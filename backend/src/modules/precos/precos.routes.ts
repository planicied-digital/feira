import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { buscarProdutos, listarHistoricoProduto } from "./precos.service.js";

export async function precosRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/produtos/busca",
    { schema: { querystring: z.object({ q: z.string().min(1) }) } },
    async (request) => {
      return buscarProdutos(request.query.q);
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/produtos/:id/historico",
    { schema: { params: z.object({ id: z.string().min(1) }) } },
    async (request) => {
      return listarHistoricoProduto(request.params.id);
    },
  );
}
