import type { UnidadePadrao } from "./api";

const SUFIXO_UNIDADE: Record<UnidadePadrao, string> = {
  KG: "kg",
  L: "L",
  UN: "un",
};

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarPrecoPorUnidade(valor: number, unidadePadrao: UnidadePadrao): string {
  return `${formatarMoeda(valor)}/${SUFIXO_UNIDADE[unidadePadrao]}`;
}
