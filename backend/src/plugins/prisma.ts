import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma-client.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

export const prismaPlugin = fp(async (app: FastifyInstance) => {
  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
