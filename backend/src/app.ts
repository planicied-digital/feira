import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { corsPlugin } from "./plugins/cors.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { importRoutes } from "./modules/import/import.routes.js";
import { precosRoutes } from "./modules/precos/precos.routes.js";
import { revisaoRoutes } from "./modules/revisao/revisao.routes.js";
import { lojasRoutes } from "./modules/lojas/lojas.routes.js";
import { categoriasRoutes } from "./modules/categorias/categorias.routes.js";
import { listaComprasRoutes } from "./modules/lista-compras/lista-compras.routes.js";

export function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(corsPlugin);
  app.register(prismaPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  app.register(importRoutes);
  app.register(precosRoutes);
  app.register(revisaoRoutes);
  app.register(lojasRoutes);
  app.register(categoriasRoutes);
  app.register(listaComprasRoutes);

  return app;
}
