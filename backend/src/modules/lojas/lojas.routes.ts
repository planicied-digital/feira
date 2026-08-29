import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { listarPromocoesPorLoja } from "../precos/precos.service.js";

export async function lojasRoutes(app: FastifyInstance) {
  app.get("/lojas", async (request) => {
    return request.server.prisma.loja.findMany({ orderBy: { nomeRaw: "asc" } });
  });

  app.withTypeProvider<ZodTypeProvider>().get(
    "/lojas/:id/produtos",
    { schema: { params: z.object({ id: z.string().min(1) }) } },
    async (request) => {
      return listarPromocoesPorLoja(request.params.id);
    },
  );
}
