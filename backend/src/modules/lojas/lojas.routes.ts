import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { filtroPrecoAtivo, listarPromocoesPorLoja, situacaoPanfletos } from "../precos/precos.service.js";
import { calcularRankingMercados } from "../precos/ranking-mercados.service.js";
import { LojaNaoEncontradaError, compararMercados } from "../precos/comparar-mercados.service.js";

const diasSchema = z.coerce.number().int().min(7).max(365).default(90);

export async function lojasRoutes(app: FastifyInstance) {
  // ?ativas=true: só mercados com pelo menos um preço válido agora (mesma regra de validade da
  // busca — ver filtroPrecoAtivo). Sem o parâmetro, lista todos: a página do mercado e a comparação
  // lado a lado trabalham com histórico e precisam dos que estão sem panfleto atual também.
  app.withTypeProvider<ZodTypeProvider>().get(
    "/lojas",
    { schema: { querystring: z.object({ ativas: z.enum(["true", "false"]).optional() }) } },
    async (request) => {
      const [lojas, situacao] = await Promise.all([
        request.server.prisma.loja.findMany({
          where: request.query.ativas === "true" ? { precos: { some: filtroPrecoAtivo() } } : undefined,
          orderBy: { nomeRaw: "asc" },
        }),
        situacaoPanfletos(),
      ]);
      return lojas.map((loja) => ({ ...loja, ...situacao(loja.id) }));
    },
  );

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
