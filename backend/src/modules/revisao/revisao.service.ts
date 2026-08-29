import { StatusMatch, StatusSugestaoFusao } from "@prisma/client";
import { prisma } from "../../lib/prisma-client.js";

export async function listarSugestoesPendentes() {
  return prisma.sugestaoFusaoProduto.findMany({
    where: { status: StatusSugestaoFusao.PENDENTE },
    include: { produtoOrigem: true, produtoDestino: true },
    orderBy: { createdAt: "asc" },
  });
}

// Reatribui itens/preços do produto origem para o destino; o produto origem fica órfão
// (sem itens/preços, logo invisível na busca) em vez de ser apagado, para não violar as
// referências históricas de SugestaoFusaoProduto.
export async function aceitarSugestao(id: string) {
  return prisma.$transaction(async (tx) => {
    const sugestao = await tx.sugestaoFusaoProduto.findUniqueOrThrow({ where: { id } });

    await tx.itemFolheto.updateMany({
      where: { produtoCanonicoId: sugestao.produtoOrigemId },
      data: { produtoCanonicoId: sugestao.produtoDestinoId, statusMatch: StatusMatch.REVISADO_CONFIRMADO },
    });
    await tx.preco.updateMany({
      where: { produtoCanonicoId: sugestao.produtoOrigemId },
      data: { produtoCanonicoId: sugestao.produtoDestinoId },
    });

    return tx.sugestaoFusaoProduto.update({
      where: { id },
      data: { status: StatusSugestaoFusao.ACEITA, resolvidoEm: new Date() },
    });
  });
}

export async function rejeitarSugestao(id: string) {
  return prisma.$transaction(async (tx) => {
    const sugestao = await tx.sugestaoFusaoProduto.findUniqueOrThrow({ where: { id } });

    await tx.itemFolheto.updateMany({
      where: { produtoCanonicoId: sugestao.produtoOrigemId },
      data: { statusMatch: StatusMatch.REVISADO_REJEITADO },
    });

    return tx.sugestaoFusaoProduto.update({
      where: { id },
      data: { status: StatusSugestaoFusao.REJEITADA, resolvidoEm: new Date() },
    });
  });
}
