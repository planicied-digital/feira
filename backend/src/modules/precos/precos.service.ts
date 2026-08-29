import { TipoValidade } from "@prisma/client";
import { prisma } from "../../lib/prisma-client.js";
import { normalizarNome } from "../normalizacao/normalizar-nome.js";

export interface PrecoResultado {
  precoId: string;
  loja: { id: string; nomeRaw: string };
  preco: number;
  precoPorUnidadePadrao: number;
  tipoValidade: TipoValidade;
  validadeInicio: string | null;
  validadeFim: string | null;
  extraidoEm: string;
}

export interface ProdutoComPrecos {
  produtoCanonicoId: string;
  nomeCanonico: string;
  categoria: { nome: string; slug: string; icone: string | null };
  marca: string | null;
  unidadePadrao: string;
  precos: PrecoResultado[];
}

function mapPreco(preco: {
  id: string;
  loja: { id: string; nomeRaw: string };
  preco: { toNumber(): number };
  precoPorUnidadePadrao: { toNumber(): number };
  tipoValidade: TipoValidade;
  validadeInicio: Date | null;
  validadeFim: Date | null;
  extraidoEm: Date;
}): PrecoResultado {
  return {
    precoId: preco.id,
    loja: preco.loja,
    preco: preco.preco.toNumber(),
    precoPorUnidadePadrao: preco.precoPorUnidadePadrao.toNumber(),
    tipoValidade: preco.tipoValidade,
    validadeInicio: preco.validadeInicio?.toISOString().slice(0, 10) ?? null,
    validadeFim: preco.validadeFim?.toISOString().slice(0, 10) ?? null,
    extraidoEm: preco.extraidoEm.toISOString(),
  };
}

// Só a tabela `precos` é lida aqui — item.4 do plano: enquanto_durar_estoque nunca some por
// data; data_definida some da busca normal quando validadeFim já passou (mas segue no histórico).
// Compartilhado pela busca por texto e pela navegação por categoria: ambas mostram os mesmos
// cards, mesma regra de validade, mesmo ranking por preço por unidade padrão.
async function montarResultado(produtoCanonicoIds: string[]): Promise<ProdutoComPrecos[]> {
  if (produtoCanonicoIds.length === 0) return [];

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);

  const produtos = await prisma.produtoCanonico.findMany({
    where: { id: { in: produtoCanonicoIds } },
    include: {
      categoria: true,
      precos: {
        where: {
          OR: [
            { tipoValidade: TipoValidade.ENQUANTO_DURAR_ESTOQUE },
            { tipoValidade: TipoValidade.DATA_DEFINIDA, validadeFim: { gte: hoje } },
          ],
        },
        include: { loja: { select: { id: true, nomeRaw: true } } },
        orderBy: { precoPorUnidadePadrao: "asc" },
      },
    },
  });

  return produtos
    .filter((p) => p.precos.length > 0)
    .map((p) => ({
      produtoCanonicoId: p.id,
      nomeCanonico: p.nomeCanonico,
      categoria: { nome: p.categoria.nome, slug: p.categoria.slug, icone: p.categoria.icone },
      marca: p.marca,
      unidadePadrao: p.unidadePadrao,
      precos: p.precos.map(mapPreco),
    }))
    .sort((a, b) => a.precos[0]!.precoPorUnidadePadrao - b.precos[0]!.precoPorUnidadePadrao);
}

export async function buscarProdutos(termo: string): Promise<ProdutoComPrecos[]> {
  const termoNormalizado = normalizarNome(termo);
  if (!termoNormalizado) return [];

  const candidatos = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM produtos_canonicos
    WHERE nome_normalizado % ${termoNormalizado}
       OR nome_normalizado ILIKE ${"%" + termoNormalizado + "%"}
    ORDER BY similarity(nome_normalizado, ${termoNormalizado}) DESC
    LIMIT 20
  `;
  return montarResultado(candidatos.map((c) => c.id));
}

export async function listarProdutosPorCategoria(categoriaSlug: string): Promise<ProdutoComPrecos[]> {
  const produtos = await prisma.produtoCanonico.findMany({
    where: { categoria: { slug: categoriaSlug } },
    select: { id: true },
  });
  return montarResultado(produtos.map((p) => p.id));
}

export interface PromocaoLoja {
  precoId: string;
  produtoCanonicoId: string;
  nomeCanonico: string;
  marca: string | null;
  categoria: { nome: string; slug: string; icone: string | null };
  preco: number;
  precoPorUnidadePadrao: number;
  unidadePadrao: string;
  tipoValidade: TipoValidade;
  validadeInicio: string | null;
  validadeFim: string | null;
  extraidoEm: string;
}

// Visão por mercado: mesma regra de validade da busca/categoria, mas sem agrupar por produto
// entre lojas — cada linha é uma promoção daquela loja específica.
export async function listarPromocoesPorLoja(lojaId: string): Promise<PromocaoLoja[]> {
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);

  const precos = await prisma.preco.findMany({
    where: {
      lojaId,
      OR: [
        { tipoValidade: TipoValidade.ENQUANTO_DURAR_ESTOQUE },
        { tipoValidade: TipoValidade.DATA_DEFINIDA, validadeFim: { gte: hoje } },
      ],
    },
    include: {
      produtoCanonico: { include: { categoria: true } },
    },
    orderBy: { produtoCanonico: { nomeCanonico: "asc" } },
  });

  return precos.map((preco) => ({
    precoId: preco.id,
    produtoCanonicoId: preco.produtoCanonico.id,
    nomeCanonico: preco.produtoCanonico.nomeCanonico,
    marca: preco.produtoCanonico.marca,
    categoria: {
      nome: preco.produtoCanonico.categoria.nome,
      slug: preco.produtoCanonico.categoria.slug,
      icone: preco.produtoCanonico.categoria.icone,
    },
    preco: preco.preco.toNumber(),
    precoPorUnidadePadrao: preco.precoPorUnidadePadrao.toNumber(),
    unidadePadrao: preco.unidadePadrao,
    tipoValidade: preco.tipoValidade,
    validadeInicio: preco.validadeInicio?.toISOString().slice(0, 10) ?? null,
    validadeFim: preco.validadeFim?.toISOString().slice(0, 10) ?? null,
    extraidoEm: preco.extraidoEm.toISOString(),
  }));
}

export async function listarHistoricoProduto(produtoCanonicoId: string): Promise<PrecoResultado[]> {
  const precos = await prisma.preco.findMany({
    where: { produtoCanonicoId },
    include: { loja: { select: { id: true, nomeRaw: true } } },
    orderBy: { extraidoEm: "desc" },
  });
  return precos.map(mapPreco);
}
