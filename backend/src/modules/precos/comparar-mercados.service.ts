import type { UnidadePadrao } from "@prisma/client";
import { prisma } from "../../lib/prisma-client.js";
import { situacaoPanfletos, type SituacaoPanfleto } from "./precos.service.js";
import { agruparEmLevas, type PrecoLeva } from "./ranking-mercados.service.js";

// Comparação lado a lado de dois mercados: mesma regra do ranking (só preços da mesma "leva", até 7
// dias de diferença entre si — ver ranking-mercados.service.ts), restrita ao par escolhido. Se um
// produto aparece em mais de uma leva com os dois mercados, vale só a comparação mais recente.

export class LojaNaoEncontradaError extends Error {}

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
  lojaA: { id: string; nomeRaw: string } & SituacaoPanfleto;
  lojaB: { id: string; nomeRaw: string } & SituacaoPanfleto;
  vitoriasA: number;
  vitoriasB: number;
  empates: number;
  itens: ItemComparacao[];
}

interface PrecoComValor extends PrecoLeva {
  preco: number;
}

export async function compararMercados(lojaAId: string, lojaBId: string, dias: number): Promise<ComparacaoMercados> {
  const [lojas, situacao] = await Promise.all([
    prisma.loja.findMany({ where: { id: { in: [lojaAId, lojaBId] } }, select: { id: true, nomeRaw: true } }),
    situacaoPanfletos(),
  ]);
  const encontradaA = lojas.find((l) => l.id === lojaAId);
  const encontradaB = lojas.find((l) => l.id === lojaBId);
  if (!encontradaA || !encontradaB) throw new LojaNaoEncontradaError("Mercado não encontrado");
  const lojaA = { ...encontradaA, ...situacao(lojaAId) };
  const lojaB = { ...encontradaB, ...situacao(lojaBId) };

  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  const registros = await prisma.preco.findMany({
    where: { lojaId: { in: [lojaAId, lojaBId] }, extraidoEm: { gte: desde } },
    select: { produtoCanonicoId: true, lojaId: true, preco: true, precoPorUnidadePadrao: true, extraidoEm: true },
    orderBy: { extraidoEm: "desc" },
  });

  const porProduto = new Map<string, PrecoComValor[]>();
  for (const r of registros) {
    const lista = porProduto.get(r.produtoCanonicoId) ?? [];
    lista.push({ ...r, preco: r.preco.toNumber(), precoPorUnidadePadrao: r.precoPorUnidadePadrao.toNumber() });
    porProduto.set(r.produtoCanonicoId, lista);
  }

  const pares: { produtoId: string; a: PrecoComValor; b: PrecoComValor }[] = [];
  for (const [produtoId, precos] of porProduto) {
    // Levas saem da mais recente pra mais antiga: a primeira com os dois mercados é a que vale.
    for (const leva of agruparEmLevas(precos) as PrecoComValor[][]) {
      const a = leva.find((p) => p.lojaId === lojaAId);
      const b = leva.find((p) => p.lojaId === lojaBId);
      if (a && b) {
        pares.push({ produtoId, a, b });
        break;
      }
    }
  }

  const produtos = await prisma.produtoCanonico.findMany({
    where: { id: { in: pares.map((p) => p.produtoId) } },
    select: { id: true, nomeCanonico: true, marca: true, unidadePadrao: true },
  });
  const produtoPorId = new Map(produtos.map((p) => [p.id, p]));

  const lado = (p: PrecoComValor): PrecoLado => ({
    preco: p.preco,
    precoPorUnidadePadrao: p.precoPorUnidadePadrao,
    extraidoEm: p.extraidoEm.toISOString(),
  });

  const itens: ItemComparacao[] = pares
    .map(({ produtoId, a, b }) => {
      const diferenca = a.precoPorUnidadePadrao - b.precoPorUnidadePadrao;
      const maisBarato: ItemComparacao["maisBarato"] = Math.abs(diferenca) < 1e-6 ? "empate" : diferenca < 0 ? "a" : "b";
      return { produto: produtoPorId.get(produtoId)!, a: lado(a), b: lado(b), maisBarato };
    })
    .sort((x, y) => x.produto.nomeCanonico.localeCompare(y.produto.nomeCanonico, "pt-BR"));

  return {
    dias,
    lojaA,
    lojaB,
    vitoriasA: itens.filter((i) => i.maisBarato === "a").length,
    vitoriasB: itens.filter((i) => i.maisBarato === "b").length,
    empates: itens.filter((i) => i.maisBarato === "empate").length,
    itens,
  };
}
