import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { aceitarSugestao, listarSugestoesPendentes, rejeitarSugestao } from "./revisao.service.js";

export async function revisaoRoutes(app: FastifyInstance) {
  app.get("/revisao/sugestoes-fusao", async () => {
    return listarSugestoesPendentes();
  });

  app.withTypeProvider<ZodTypeProvider>().patch(
    "/revisao/sugestoes-fusao/:id/aceitar",
    { schema: { params: z.object({ id: z.string().min(1) }) } },
    async (request) => {
      return aceitarSugestao(request.params.id);
    },
  );

  app.withTypeProvider<ZodTypeProvider>().patch(
    "/revisao/sugestoes-fusao/:id/rejeitar",
    { schema: { params: z.object({ id: z.string().min(1) }) } },
    async (request) => {
      return rejeitarSugestao(request.params.id);
    },
  );
}
