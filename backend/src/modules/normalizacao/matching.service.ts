import { Prisma, StatusMatch, StatusSugestaoFusao, type UnidadePadrao } from "@prisma/client";

// Calibrar quando houver volume de dados reais.
const SCORE_ALTA_CONFIANCA = 0.75;
const SCORE_MEDIA_CONFIANCA = 0.45;

interface CandidatoProduto {
  id: string;
  nome_canonico: string;
  marca: string | null;
  score: number;
}

export interface MatchInput {
  nomeNormalizado: string;
  nomeCanonicoSugerido: string;
  categoriaId: string;
  unidadePadrao: UnidadePadrao;
  marca: string | null;
}

export interface MatchResult {
  produtoCanonicoId: string;
  statusMatch: StatusMatch;
  scoreSimilaridade: number | null;
}

function marcasConflitam(marcaA: string | null, marcaB: string | null): boolean {
  if (!marcaA || !marcaB) return false;
  return marcaA.trim().toLowerCase() !== marcaB.trim().toLowerCase();
}

async function buscarCandidatos(
  tx: Prisma.TransactionClient,
  input: MatchInput,
): Promise<CandidatoProduto[]> {
  return tx.$queryRaw<CandidatoProduto[]>`
    SELECT id, nome_canonico, marca, similarity(nome_normalizado, ${input.nomeNormalizado}) AS score
    FROM produtos_canonicos
    WHERE categoria_id = ${input.categoriaId}
      AND unidade_padrao = ${input.unidadePadrao}::"UnidadePadrao"
      AND nome_normalizado % ${input.nomeNormalizado}
    ORDER BY score DESC
    LIMIT 5
  `;
}

async function criarProdutoCanonico(
  tx: Prisma.TransactionClient,
  input: MatchInput,
): Promise<string> {
  const produto = await tx.produtoCanonico.create({
    data: {
      nomeCanonico: input.nomeCanonicoSugerido,
      nomeNormalizado: input.nomeNormalizado,
      categoriaId: input.categoriaId,
      marca: input.marca,
      unidadePadrao: input.unidadePadrao,
    },
  });
  return produto.id;
}

// Nunca funde produtos automaticamente com baixa confiança nem esconde o preço resultante:
// casos ambíguos sempre criam um produto novo (visível) + uma sugestão de fusão para revisão manual.
export async function encontrarOuCriarProdutoCanonico(
  tx: Prisma.TransactionClient,
  input: MatchInput,
): Promise<MatchResult> {
  const candidatos = await buscarCandidatos(tx, input);
  const melhor = candidatos.find((c) => !marcasConflitam(input.marca, c.marca)) ?? candidatos[0];

  if (!melhor) {
    const produtoCanonicoId = await criarProdutoCanonico(tx, input);
    return { produtoCanonicoId, statusMatch: StatusMatch.AUTO_CONFIRMADO, scoreSimilaridade: null };
  }

  const conflitoDeMarca = marcasConflitam(input.marca, melhor.marca);

  if (melhor.score >= SCORE_ALTA_CONFIANCA && !conflitoDeMarca) {
    return {
      produtoCanonicoId: melhor.id,
      statusMatch: StatusMatch.AUTO_CONFIRMADO,
      scoreSimilaridade: melhor.score,
    };
  }

  if (melhor.score >= SCORE_MEDIA_CONFIANCA || conflitoDeMarca) {
    const produtoCanonicoId = await criarProdutoCanonico(tx, input);
    await tx.sugestaoFusaoProduto.create({
      data: {
        produtoOrigemId: produtoCanonicoId,
        produtoDestinoId: melhor.id,
        score: melhor.score,
        status: StatusSugestaoFusao.PENDENTE,
      },
    });
    return {
      produtoCanonicoId,
      statusMatch: StatusMatch.PENDENTE_REVISAO,
      scoreSimilaridade: melhor.score,
    };
  }

  const produtoCanonicoId = await criarProdutoCanonico(tx, input);
  return { produtoCanonicoId, statusMatch: StatusMatch.AUTO_CONFIRMADO, scoreSimilaridade: melhor.score };
}
