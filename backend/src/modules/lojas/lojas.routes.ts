import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { listarPromocoesPorLoja } from "../precos/precos.service.js";
import { calcularRankingMercados } from "../precos/ranking-mercados.service.js";

export async function lojasRoutes(app: FastifyInstance) {
  app.get("/lojas", async (request) => {
    return request.server.prisma.loja.findMany({ orderBy: { nomeRaw: "asc" } });
  });

  app.withTypeProvider<ZodTypeProvider>().get(
    "/lojas/ranking",
    { schema: { querystring: z.object({ dias: z.coerce.number().int().min(7).max(365).default(90) }) } },
    async (request) => {
      return calcularRankingMercados(request.query.dias);
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/lojas/:id/produtos",
    { schema: { params: z.object({ id: z.string().min(1) }) } },
    async (request) => {
      return listarPromocoesPorLoja(request.params.id);
    },
  );
}
