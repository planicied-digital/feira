import type { ProdutoComPrecos } from "./api";
import { calcularFaixaPreco } from "./faixaPreco";

export const ORDENACOES = ["relevantes", "menor-preco", "maior-preco", "maior-economia"] as const;
export type Ordenacao = (typeof ORDENACOES)[number];

export const ROTULO_ORDENACAO: Record<Ordenacao, string> = {
  relevantes: "Mais relevantes",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
  "maior-economia": "Maior economia",
};

// Valor de ?ordem= na URL; qualquer coisa fora da lista (ou ausente) cai no padrão.
export function lerOrdenacao(valor: string | null): Ordenacao {
  return ORDENACOES.includes(valor as Ordenacao) ? (valor as Ordenacao) : "relevantes";
}

interface ProdutoComFaixa {
  produto: ProdutoComPrecos;
  menor: number;
  quantidadeMercados: number;
  economia: { valor: number; percentual: number } | null;
}

const porNome = (a: ProdutoComFaixa, b: ProdutoComFaixa) =>
  a.produto.nomeCanonico.localeCompare(b.produto.nomeCanonico, "pt-BR");
const porMenorPreco = (a: ProdutoComFaixa, b: ProdutoComFaixa) => a.menor - b.menor || porNome(a, b);

const COMPARADORES: Record<Ordenacao, (a: ProdutoComFaixa, b: ProdutoComFaixa) => number> = {
  // Usado só na categoria (sem termo): presentes em mais mercados primeiro.
  relevantes: (a, b) => b.quantidadeMercados - a.quantidadeMercados || porNome(a, b),
  "menor-preco": porMenorPreco,
  "maior-preco": (a, b) => b.menor - a.menor || porNome(a, b),
  // Sem economia (um mercado só) vai pro fim, entre si por menor preço.
  "maior-economia": (a, b) => {
    if (!a.economia || !b.economia) return a.economia ? -1 : b.economia ? 1 : porMenorPreco(a, b);
    return b.economia.percentual - a.economia.percentual || b.economia.valor - a.economia.valor || porNome(a, b);
  },
};

// Ordena só os produtos — os preços dentro de cada um continuam do mais barato ao mais caro.
// Preço e economia são os mesmos do card de resumo (calcularFaixaPreco), pra a ordem bater com o
// que aparece na tela. "Mais relevantes" na busca é a ordem de similaridade com o termo que o
// backend já devolve.
export function ordenarProdutos(
  produtos: ProdutoComPrecos[],
  ordenacao: Ordenacao,
  contexto: "busca" | "categoria",
): ProdutoComPrecos[] {
  if (ordenacao === "relevantes" && contexto === "busca") return [...produtos];

  const comFaixa: ProdutoComFaixa[] = produtos.map((produto) => {
    const faixa = calcularFaixaPreco(produto.precos);
    return {
      produto,
      menor: faixa?.menor ?? Infinity,
      quantidadeMercados: faixa?.quantidadeMercados ?? 0,
      economia: faixa?.economia ?? null,
    };
  });

  return comFaixa.sort(COMPARADORES[ordenacao]).map((item) => item.produto);
}
