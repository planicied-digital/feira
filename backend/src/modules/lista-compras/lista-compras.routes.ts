import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { compararListaCompras } from "./lista-compras.service.js";

export async function listaComprasRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/lista-compras/comparar",
    { schema: { body: z.object({ itens: z.array(z.string().min(1)).min(1).max(30) }) } },
    async (request) => {
      return compararListaCompras(request.body.itens);
    },
  );
}
