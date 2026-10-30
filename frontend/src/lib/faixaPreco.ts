import type { PrecoResultado } from "./api";

// Duas ofertas são "do mesmo tamanho" se a quantidade em unidade padrão difere menos que isso —
// preco / precoPorUnidadePadrao tem arredondamento de centavos (ex.: 520 g vira 0,5198 kg).
const TOLERANCIA_MESMA_QUANTIDADE = 0.01;

export interface FaixaPreco {
  // "absoluto": todas as ofertas têm o mesmo tamanho, então comparar o preço da embalagem é justo.
  // "porUnidade": tamanhos diferentes (500 g × 1 kg) — só o preço por kg/L/un é comparável.
  base: "absoluto" | "porUnidade";
  menor: number;
  maior: number;
  quantidadeMercados: number;
  // null quando não há o que economizar (um só mercado ou todos com o mesmo preço).
  economia: { valor: number; percentual: number } | null;
}

function quantidadeEmUnidadePadrao(preco: PrecoResultado): number {
  return preco.preco / preco.precoPorUnidadePadrao;
}

// Resumo de "DE / ATÉ" de um produto a partir dos preços ativos que o backend já devolve
// (filtrados por validade) — não recalcula validade aqui pra não divergir da busca.
export function calcularFaixaPreco(precos: PrecoResultado[]): FaixaPreco | null {
  if (precos.length === 0) return null;

  const quantidades = precos.map(quantidadeEmUnidadePadrao);
  const referencia = quantidades[0]!;
  const mesmaQuantidade = quantidades.every(
    (q) => Math.abs(q - referencia) <= referencia * TOLERANCIA_MESMA_QUANTIDADE,
  );

  const base = mesmaQuantidade ? "absoluto" : "porUnidade";
  const valores = precos.map((p) => (mesmaQuantidade ? p.preco : p.precoPorUnidadePadrao));
  const menor = Math.min(...valores);
  const maior = Math.max(...valores);
  const quantidadeMercados = new Set(precos.map((p) => p.loja.id)).size;

  const valorEconomia = Math.round((maior - menor) * 100) / 100;
  const economia =
    quantidadeMercados > 1 && valorEconomia > 0
      ? { valor: valorEconomia, percentual: Math.round((valorEconomia / maior) * 100) }
      : null;

  return { base, menor, maior, quantidadeMercados, economia };
}
