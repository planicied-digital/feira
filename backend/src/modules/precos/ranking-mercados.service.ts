import { prisma } from "../../lib/prisma-client.js";

// Ranking "cabeça a cabeça": em cada produto vendido por 2+ mercados, ganha quem tem o menor preço
// por unidade padrão; o ranking de cada mercado é a % de vitórias entre as comparações de que
// participou. Preferido a "preço médio por categoria" (mistura produtos diferentes) e a "cesta
// fixa" (nenhum mercado cobre uma cesta inteira com os panfletos que temos).
//
// Só comparamos preços da mesma "leva": extraídos com até 7 dias de diferença entre si. Sem isso,
// um panfleto de outubro de um mercado seria comparado com um de agosto de outro — e quem
// importou por último levaria a culpa (ou o crédito) pela inflação do período.
const JANELA_MESMA_LEVA_MS = 7 * 24 * 60 * 60 * 1000;

// Abaixo disso o percentual engana (1 vitória em 1 comparação = 100%) — esses mercados aparecem
// separados, em "poucos dados", em vez de disputar o topo.
export const MIN_COMPARACOES = 5;

export interface RankingLoja {
  loja: { id: string; nomeRaw: string };
  comparacoes: number;
  vitorias: number;
  percentual: number;
  dadosSuficientes: boolean;
}

export interface RankingMercados {
  dias: number;
  comparacoes: number;
  produtos: number;
  minComparacoes: number;
  lojas: RankingLoja[];
}

interface PrecoLeva {
  produtoCanonicoId: string;
  lojaId: string;
  precoPorUnidadePadrao: number;
  extraidoEm: Date;
}

// Agrupa os preços de UM produto (já em ordem decrescente de extração) em levas: cada leva começa
// no preço mais recente ainda não agrupado e junta tudo até 7 dias antes dele. Dentro da leva, só
// o preço mais recente de cada loja conta (reimportação do mesmo panfleto não vira dois votos).
function agruparEmLevas(precos: PrecoLeva[]): PrecoLeva[][] {
  const levas: PrecoLeva[][] = [];
  let atual: PrecoLeva[] = [];
  let inicioLeva = 0;
  const lojasNaLeva = new Set<string>();

  for (const preco of precos) {
    if (atual.length === 0 || inicioLeva - preco.extraidoEm.getTime() > JANELA_MESMA_LEVA_MS) {
      if (atual.length > 0) levas.push(atual);
      atual = [];
      lojasNaLeva.clear();
      inicioLeva = preco.extraidoEm.getTime();
    }
    if (!lojasNaLeva.has(preco.lojaId)) {
      lojasNaLeva.add(preco.lojaId);
      atual.push(preco);
    }
  }
  if (atual.length > 0) levas.push(atual);
  return levas;
}

export async function calcularRankingMercados(dias: number): Promise<RankingMercados> {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const [registros, lojas] = await Promise.all([
    prisma.preco.findMany({
      where: { extraidoEm: { gte: desde } },
      select: { produtoCanonicoId: true, lojaId: true, precoPorUnidadePadrao: true, extraidoEm: true },
      orderBy: { extraidoEm: "desc" },
    }),
    prisma.loja.findMany({ select: { id: true, nomeRaw: true } }),
  ]);

  const porProduto = new Map<string, PrecoLeva[]>();
  for (const r of registros) {
    const lista = porProduto.get(r.produtoCanonicoId) ?? [];
    lista.push({ ...r, precoPorUnidadePadrao: r.precoPorUnidadePadrao.toNumber() });
    porProduto.set(r.produtoCanonicoId, lista);
  }

  const placar = new Map<string, { comparacoes: number; vitorias: number }>();
  const produtosComparados = new Set<string>();
  let comparacoes = 0;

  for (const [produtoId, precos] of porProduto) {
    for (const leva of agruparEmLevas(precos)) {
      if (leva.length < 2) continue;
      comparacoes++;
      produtosComparados.add(produtoId);
      const menor = Math.min(...leva.map((p) => p.precoPorUnidadePadrao));
      for (const p of leva) {
        const atual = placar.get(p.lojaId) ?? { comparacoes: 0, vitorias: 0 };
        atual.comparacoes++;
        // Empate no menor preço conta como vitória pra todos os empatados.
        if (p.precoPorUnidadePadrao <= menor + 1e-6) atual.vitorias++;
        placar.set(p.lojaId, atual);
      }
    }
  }

  const nomePorLoja = new Map(lojas.map((l) => [l.id, l.nomeRaw]));
  const ranking = [...placar.entries()]
    .map(([lojaId, { comparacoes: c, vitorias: v }]) => ({
      loja: { id: lojaId, nomeRaw: nomePorLoja.get(lojaId) ?? "?" },
      comparacoes: c,
      vitorias: v,
      percentual: Math.round((v / c) * 1000) / 10,
      dadosSuficientes: c >= MIN_COMPARACOES,
    }))
    .sort(
      (a, b) =>
        Number(b.dadosSuficientes) - Number(a.dadosSuficientes) ||
        b.percentual - a.percentual ||
        b.comparacoes - a.comparacoes,
    );

  return { dias, comparacoes, produtos: produtosComparados.size, minComparacoes: MIN_COMPARACOES, lojas: ranking };
}
