import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { listarCategorias } from "./categorias.service.js";
import { listarProdutosPorCategoria } from "../precos/precos.service.js";

export async function categoriasRoutes(app: FastifyInstance) {
  app.get("/categorias", async () => {
    return listarCategorias();
  });

  app.withTypeProvider<ZodTypeProvider>().get(
    "/categorias/:slug/produtos",
    { schema: { params: z.object({ slug: z.string().min(1) }) } },
    async (request) => {
      return listarProdutosPorCategoria(request.params.slug);
    },
  );
}
