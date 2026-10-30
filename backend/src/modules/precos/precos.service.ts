import { TipoValidade } from "@prisma/client";
import { prisma } from "../../lib/prisma-client.js";
import { hojeEmBoaVista } from "../../lib/data-boa-vista.js";
import { normalizarNome } from "../normalizacao/normalizar-nome.js";

// "enquanto durar o estoque" não tem data de fim — sem isso, uma promoção assim ficaria visível
// para sempre mesmo que a loja nunca mais confirme o preço. Some sozinha depois de 3 dias sem uma
// nova extração (reimportação de panfleto daquela loja); o selo de "envelhecido" acende 1 dia antes.
const DIAS_LIMITE_ENQUANTO_ESTOQUE = 3;

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
  // Só na busca por texto: similaridade (pg_trgm, 0–1) do nome com o termo buscado.
  relevancia?: number;
}

export function filtroPrecoAtivo() {
  const hoje = hojeEmBoaVista();

  const corteEnquantoEstoque = new Date();
  corteEnquantoEstoque.setDate(corteEnquantoEstoque.getDate() - DIAS_LIMITE_ENQUANTO_ESTOQUE);

  return {
    OR: [
      { tipoValidade: TipoValidade.ENQUANTO_DURAR_ESTOQUE, extraidoEm: { gte: corteEnquantoEstoque } },
      { tipoValidade: TipoValidade.DATA_DEFINIDA, validadeFim: { gte: hoje } },
    ],
  };
}

export interface SituacaoPanfleto {
  panfletoAtual: boolean;
  // Até quando vale (ou valeu) o panfleto mais recente da loja: maior data de fim entre os panfletos
  // com data, ou extração + DIAS_LIMITE_ENQUANTO_ESTOQUE nos "enquanto durar o estoque".
  panfletoValidoAte: string | null;
}

const SEM_PANFLETO: SituacaoPanfleto = { panfletoAtual: false, panfletoValidoAte: null };

// Ranking e comparação usam histórico — sem isso, um mercado cujo último panfleto venceu há meses
// aparece igual a um com ofertas valendo hoje. "Atual" segue exatamente filtroPrecoAtivo.
export async function situacaoPanfletos(): Promise<(lojaId: string) => SituacaoPanfleto> {
  const [comData, enquantoEstoque, ativas] = await Promise.all([
    prisma.preco.groupBy({
      by: ["lojaId"],
      where: { tipoValidade: TipoValidade.DATA_DEFINIDA },
      _max: { validadeFim: true },
    }),
    prisma.preco.groupBy({
      by: ["lojaId"],
      where: { tipoValidade: TipoValidade.ENQUANTO_DURAR_ESTOQUE },
      _max: { extraidoEm: true },
    }),
    prisma.preco.findMany({ where: filtroPrecoAtivo(), select: { lojaId: true }, distinct: ["lojaId"] }),
  ]);

  const validoAte = new Map<string, Date>();
  const considerar = (lojaId: string, data: Date | null) => {
    if (!data) return;
    const atual = validoAte.get(lojaId);
    if (!atual || data > atual) validoAte.set(lojaId, data);
  };
  for (const g of comData) considerar(g.lojaId, g._max.validadeFim);
  for (const g of enquantoEstoque) {
    const extraido = g._max.extraidoEm;
    if (extraido) considerar(g.lojaId, new Date(extraido.getTime() + DIAS_LIMITE_ENQUANTO_ESTOQUE * 86_400_000));
  }

  const lojasAtivas = new Set(ativas.map((a) => a.lojaId));
  return (lojaId) => {
    const data = validoAte.get(lojaId);
    if (!data) return SEM_PANFLETO;
    return { panfletoAtual: lojasAtivas.has(lojaId), panfletoValidoAte: data.toISOString().slice(0, 10) };
  };
}

// Uma loja pode reimportar um panfleto e gerar um novo registro de preço para o mesmo produto —
// sem isso, o preço antigo (possivelmente já trocado) continuaria aparecendo ao lado do novo como
// se fosse outra oferta da mesma loja. Mantém só o registro mais recente por chave.
function manterMaisRecentePorChave<T extends { extraidoEm: Date }>(itens: T[], chave: (item: T) => string): T[] {
  const maisRecentePorChave = new Map<string, T>();
  for (const item of itens) {
    const atual = maisRecentePorChave.get(chave(item));
    if (!atual || item.extraidoEm > atual.extraidoEm) maisRecentePorChave.set(chave(item), item);
  }
  return itens.filter((item) => maisRecentePorChave.get(chave(item)) === item);
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

// Devolve os itens na ordem de `ids` (os que não estiverem lá são descartados). O findMany do
// Prisma não garante ordem para `id IN (...)`, e a busca precisa manter a ordem de relevância.
export function ordenarPelaOrdemDosIds<T extends { produtoCanonicoId: string }>(itens: T[], ids: string[]): T[] {
  const porId = new Map(itens.map((item) => [item.produtoCanonicoId, item]));
  return ids.flatMap((id) => porId.get(id) ?? []);
}

function menorPrecoPorUnidade(produto: ProdutoComPrecos): number {
  return produto.precos[0]!.precoPorUnidadePadrao;
}

// Só a tabela `precos` é lida aqui — item.4 do plano: enquanto_durar_estoque some sem confirmação
// recente (ver DIAS_LIMITE_ENQUANTO_ESTOQUE); data_definida some da busca normal quando validadeFim
// já passou. Compartilhado pela busca por texto e pela navegação por categoria: ambas mostram os
// mesmos cards e a mesma regra de validade. Os preços de cada produto vêm do mais barato por
// unidade padrão ao mais caro; a ordem dos produtos fica a cargo de quem chama.
async function montarResultado(produtoCanonicoIds: string[]): Promise<ProdutoComPrecos[]> {
  if (produtoCanonicoIds.length === 0) return [];

  const produtos = await prisma.produtoCanonico.findMany({
    where: { id: { in: produtoCanonicoIds } },
    include: {
      categoria: true,
      precos: {
        where: filtroPrecoAtivo(),
        include: { loja: { select: { id: true, nomeRaw: true } } },
        orderBy: { precoPorUnidadePadrao: "asc" },
      },
    },
  });

  return produtos
    .map((p) => ({ ...p, precos: manterMaisRecentePorChave(p.precos, (preco) => preco.loja.id) }))
    .filter((p) => p.precos.length > 0)
    .map((p) => ({
      produtoCanonicoId: p.id,
      nomeCanonico: p.nomeCanonico,
      categoria: { nome: p.categoria.nome, slug: p.categoria.slug, icone: p.categoria.icone },
      marca: p.marca,
      unidadePadrao: p.unidadePadrao,
      precos: p.precos.map(mapPreco),
    }));
}

// Ordem de relevância (similaridade com o termo); o frontend reordena por preço/economia quando o
// usuário escolhe outra ordenação.
export async function buscarProdutos(termo: string): Promise<ProdutoComPrecos[]> {
  const termoNormalizado = normalizarNome(termo);
  if (!termoNormalizado) return [];

  const candidatos = await prisma.$queryRaw<{ id: string; relevancia: number }[]>`
    SELECT id, similarity(nome_normalizado, ${termoNormalizado}) AS relevancia FROM produtos_canonicos
    WHERE nome_normalizado % ${termoNormalizado}
       OR nome_normalizado ILIKE ${"%" + termoNormalizado + "%"}
    ORDER BY relevancia DESC
    LIMIT 20
  `;
  const ids = candidatos.map((c) => c.id);
  const relevanciaPorId = new Map(candidatos.map((c) => [c.id, Number(c.relevancia)]));
  return ordenarPelaOrdemDosIds(await montarResultado(ids), ids).map((produto) => ({
    ...produto,
    relevancia: relevanciaPorId.get(produto.produtoCanonicoId),
  }));
}

export async function listarProdutosPorCategoria(categoriaSlug: string): Promise<ProdutoComPrecos[]> {
  const produtos = await prisma.produtoCanonico.findMany({
    where: { categoria: { slug: categoriaSlug } },
    select: { id: true },
  });
  return (await montarResultado(produtos.map((p) => p.id))).sort(
    (a, b) => menorPrecoPorUnidade(a) - menorPrecoPorUnidade(b),
  );
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
  const precos = await prisma.preco.findMany({
    where: { lojaId, ...filtroPrecoAtivo() },
    include: {
      produtoCanonico: { include: { categoria: true } },
    },
    orderBy: { produtoCanonico: { nomeCanonico: "asc" } },
  });

  return manterMaisRecentePorChave(precos, (preco) => preco.produtoCanonico.id).map((preco) => ({
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

// Mesma regra de permanência do resto do app: uma promoção some quando vence (data_definida) ou
// fica velha demais sem confirmação (enquanto_durar_estoque). Não é um histórico de preços
// passados — é a lista de ofertas ainda válidas para esse produto, uma por loja.
export async function listarHistoricoProduto(produtoCanonicoId: string): Promise<PrecoResultado[]> {
  const precos = await prisma.preco.findMany({
    where: { produtoCanonicoId, ...filtroPrecoAtivo() },
    include: { loja: { select: { id: true, nomeRaw: true } } },
    orderBy: { extraidoEm: "desc" },
  });
  return manterMaisRecentePorChave(precos, (preco) => preco.loja.id).map(mapPreco);
}
