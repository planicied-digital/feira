import { prisma } from "../../lib/prisma-client.js";

export interface CategoriaResultado {
  id: string;
  nome: string;
  slug: string;
  icone: string | null;
}

export async function listarCategorias(): Promise<CategoriaResultado[]> {
  return prisma.categoria.findMany({
    select: { id: true, nome: true, slug: true, icone: true },
    orderBy: { nome: "asc" },
  });
}
