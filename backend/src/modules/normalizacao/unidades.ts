export type UnidadePadrao = "KG" | "L" | "UN";

const REGEX_QUANTIDADE_UNIDADE = /(\d+[.,]?\d*)\s*(kg|g|l|ml|un|unid|und)\b/i;

export interface QuantidadeExtraida {
  quantidade: number;
  unidade: string;
  unidadePadrao: UnidadePadrao;
  fatorConversao: number;
  trechoOriginal: string;
}

const FATORES_PARA_PADRAO: Record<string, { unidadePadrao: UnidadePadrao; fator: number }> = {
  kg: { unidadePadrao: "KG", fator: 1 },
  g: { unidadePadrao: "KG", fator: 1 / 1000 },
  l: { unidadePadrao: "L", fator: 1 },
  ml: { unidadePadrao: "L", fator: 1 / 1000 },
  un: { unidadePadrao: "UN", fator: 1 },
  unid: { unidadePadrao: "UN", fator: 1 },
  und: { unidadePadrao: "UN", fator: 1 },
};

export function unidadeParaPadrao(unidade: string): { unidadePadrao: UnidadePadrao; fator: number } | null {
  const chave = unidade.trim().toLowerCase();
  return FATORES_PARA_PADRAO[chave] ?? null;
}

// Fallback quando a IA não separou quantidade/unidade do nome_raw.
export function extrairQuantidadeUnidade(nomeRaw: string): QuantidadeExtraida | null {
  const match = nomeRaw.match(REGEX_QUANTIDADE_UNIDADE);
  if (!match) return null;

  const quantidade = Number(match[1].replace(",", "."));
  const unidade = match[2];
  const conversao = unidadeParaPadrao(unidade);
  if (!conversao || Number.isNaN(quantidade)) return null;

  return {
    quantidade,
    unidade,
    unidadePadrao: conversao.unidadePadrao,
    fatorConversao: conversao.fator,
    trechoOriginal: match[0],
  };
}

export function calcularPrecoPorUnidadePadrao(preco: number, quantidade: number, fatorConversao: number): number {
  const quantidadeEmUnidadePadrao = quantidade * fatorConversao;
  if (quantidadeEmUnidadePadrao <= 0) {
    throw new Error("Quantidade em unidade padrão deve ser maior que zero");
  }
  return preco / quantidadeEmUnidadePadrao;
}
