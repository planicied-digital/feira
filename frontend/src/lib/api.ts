const API_URL = import.meta.env.VITE_API_URL ?? "/sistemas/feira/api";

export type TipoValidade = "DATA_DEFINIDA" | "ENQUANTO_DURAR_ESTOQUE";
export type UnidadePadrao = "KG" | "L" | "UN";

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

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  icone: string | null;
}

export interface ProdutoComPrecos {
  produtoCanonicoId: string;
  nomeCanonico: string;
  categoria: { nome: string; slug: string; icone: string | null };
  marca: string | null;
  unidadePadrao: UnidadePadrao;
  precos: PrecoResultado[];
}

export interface Loja {
  id: string;
  nomeRaw: string;
  enderecoRaw: string | null;
}

export interface PromocaoLoja {
  precoId: string;
  produtoCanonicoId: string;
  nomeCanonico: string;
  marca: string | null;
  categoria: { nome: string; slug: string; icone: string | null };
  preco: number;
  precoPorUnidadePadrao: number;
  unidadePadrao: UnidadePadrao;
  tipoValidade: TipoValidade;
  validadeInicio: string | null;
  validadeFim: string | null;
  extraidoEm: string;
}

export interface ItemListaEncontrado {
  termoBuscado: string;
  produtoCanonicoId: string;
  nomeCanonico: string;
  marca: string | null;
  categoria: { nome: string; slug: string; icone: string | null };
  unidadePadrao: UnidadePadrao;
  precosPorLoja: {
    lojaId: string;
    nomeRaw: string;
    preco: number;
    tipoValidade: TipoValidade;
    validadeFim: string | null;
  }[];
}

export interface TotalPorLoja {
  lojaId: string;
  nomeRaw: string;
  total: number;
  itens: { termoBuscado: string; nomeCanonico: string; preco: number }[];
}

export interface ResultadoListaCompras {
  itensEncontrados: ItemListaEncontrado[];
  itensNaoEncontrados: string[];
  totalDividido: { total: number; porLoja: TotalPorLoja[] } | null;
  totalUnicoMercado: TotalPorLoja | null;
  economia: number | null;
}

export interface SugestaoFusao {
  id: string;
  score: number;
  status: string;
  produtoOrigem: { id: string; nomeCanonico: string; marca: string | null };
  produtoDestino: { id: string; nomeCanonico: string; marca: string | null };
}

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    caminho: string,
    corpo: string,
  ) {
    super(`Erro ${status} em ${caminho}: ${corpo}`);
  }
}

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  if (!resposta.ok) {
    const corpo = await resposta.text();
    throw new ErroApi(resposta.status, caminho, corpo);
  }
  return resposta.json() as Promise<T>;
}

// Sessão do admin (/admin/*): token assinado pelo backend, guardado só neste navegador. O acesso ao
// localStorage pode falhar (modo privado, armazenamento bloqueado) — aí a sessão só não persiste.
const CHAVE_SESSAO_ADMIN = "feira.admin.sessao";
let sessaoAdmin: string | null = null;

function lerSessaoAdmin(): string | null {
  if (sessaoAdmin) return sessaoAdmin;
  try {
    sessaoAdmin = localStorage.getItem(CHAVE_SESSAO_ADMIN);
  } catch {
    // sem localStorage: a sessão vale só até recarregar a página
  }
  return sessaoAdmin;
}

export function sairAdmin(): void {
  sessaoAdmin = null;
  try {
    localStorage.removeItem(CHAVE_SESSAO_ADMIN);
  } catch {
    // nada a limpar
  }
}

export async function entrarAdmin(senha: string): Promise<void> {
  const { token } = await requisitar<{ token: string; expiraEm: string }>(`/admin/login`, {
    method: "POST",
    body: JSON.stringify({ senha }),
  });
  sessaoAdmin = token;
  try {
    localStorage.setItem(CHAVE_SESSAO_ADMIN, token);
  } catch {
    // sem localStorage: a sessão vale só até recarregar a página
  }
}

function requisitarAdmin<T>(caminho: string, init?: RequestInit): Promise<T> {
  const token = lerSessaoAdmin();
  return requisitar(caminho, {
    ...init,
    headers: token ? { Authorization: `Bearer ${token}`, ...init?.headers } : init?.headers,
  });
}

export function buscarProdutos(termo: string): Promise<ProdutoComPrecos[]> {
  return requisitar(`/produtos/busca?q=${encodeURIComponent(termo)}`);
}

export function buscarHistorico(produtoCanonicoId: string): Promise<PrecoResultado[]> {
  return requisitar(`/produtos/${produtoCanonicoId}/historico`);
}

export function listarCategorias(): Promise<Categoria[]> {
  return requisitar(`/categorias`);
}

export function listarProdutosPorCategoria(slug: string): Promise<ProdutoComPrecos[]> {
  return requisitar(`/categorias/${encodeURIComponent(slug)}/produtos`);
}

export function listarLojas(): Promise<Loja[]> {
  return requisitar(`/lojas`);
}

export function listarPromocoesPorLoja(id: string): Promise<PromocaoLoja[]> {
  return requisitar(`/lojas/${encodeURIComponent(id)}/produtos`);
}

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

export function buscarRankingMercados(dias: number): Promise<RankingMercados> {
  return requisitar(`/lojas/ranking?dias=${dias}`);
}

export interface PrecoLado {
  preco: number;
  precoPorUnidadePadrao: number;
  extraidoEm: string;
}

export interface ItemComparacao {
  produto: { id: string; nomeCanonico: string; marca: string | null; unidadePadrao: UnidadePadrao };
  a: PrecoLado;
  b: PrecoLado;
  maisBarato: "a" | "b" | "empate";
}

export interface ComparacaoMercados {
  dias: number;
  lojaA: { id: string; nomeRaw: string };
  lojaB: { id: string; nomeRaw: string };
  vitoriasA: number;
  vitoriasB: number;
  empates: number;
  itens: ItemComparacao[];
}

export function compararMercados(a: string, b: string, dias: number): Promise<ComparacaoMercados> {
  const params = new URLSearchParams({ a, b, dias: String(dias) });
  return requisitar(`/lojas/comparar?${params}`);
}

export function compararListaCompras(itens: string[]): Promise<ResultadoListaCompras> {
  return requisitar(`/lista-compras/comparar`, { method: "POST", body: JSON.stringify({ itens }) });
}

export function listarSugestoesFusao(): Promise<SugestaoFusao[]> {
  return requisitarAdmin(`/revisao/sugestoes-fusao`);
}

export function aceitarSugestao(id: string): Promise<SugestaoFusao> {
  return requisitarAdmin(`/revisao/sugestoes-fusao/${id}/aceitar`, { method: "PATCH" });
}

export function rejeitarSugestao(id: string): Promise<SugestaoFusao> {
  return requisitarAdmin(`/revisao/sugestoes-fusao/${id}/rejeitar`, { method: "PATCH" });
}
