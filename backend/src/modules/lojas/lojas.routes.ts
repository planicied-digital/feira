import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { listarPromocoesPorLoja } from "../precos/precos.service.js";
import { calcularRankingMercados } from "../precos/ranking-mercados.service.js";
import { LojaNaoEncontradaError, compararMercados } from "../precos/comparar-mercados.service.js";

const diasSchema = z.coerce.number().int().min(7).max(365).default(90);

export async function lojasRoutes(app: FastifyInstance) {
  app.get("/lojas", async (request) => {
    return request.server.prisma.loja.findMany({ orderBy: { nomeRaw: "asc" } });
  });

  app.withTypeProvider<ZodTypeProvider>().get(
    "/lojas/ranking",
    { schema: { querystring: z.object({ dias: diasSchema }) } },
    async (request) => {
      return calcularRankingMercados(request.query.dias);
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/lojas/comparar",
    {
      schema: {
        querystring: z
          .object({ a: z.string().min(1), b: z.string().min(1), dias: diasSchema })
          .refine((q) => q.a !== q.b, { message: "Escolha dois mercados diferentes", path: ["b"] }),
      },
    },
    async (request, reply) => {
      try {
        return await compararMercados(request.query.a, request.query.b, request.query.dias);
      } catch (error) {
        if (error instanceof LojaNaoEncontradaError) {
          return reply.status(404).send({ mensagem: error.message });
        }
        throw error;
      }
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
