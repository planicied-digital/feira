import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { env } from "../../config/env.js";
import { criarSessao, senhaConfere } from "./sessao-admin.js";

// Atraso fixo em senha errada: torna tentativa e erro pela URL pública lenta demais pra valer a pena.
const ATRASO_SENHA_ERRADA_MS = 1000;

export async function adminRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/admin/login",
    { schema: { body: z.object({ senha: z.string().min(1).max(200) }) } },
    async (request, reply) => {
      if (!env.ADMIN_PASSWORD) {
        const mensagem =
          env.NODE_ENV === "production"
            ? "Área de admin desabilitada: ADMIN_PASSWORD não configurada"
            : "Sem ADMIN_PASSWORD configurada — em dev a área de admin já fica aberta";
        return reply.status(env.NODE_ENV === "production" ? 503 : 400).send({ mensagem });
      }

      if (!senhaConfere(request.body.senha)) {
        await new Promise((resolve) => setTimeout(resolve, ATRASO_SENHA_ERRADA_MS));
        return reply.status(401).send({ mensagem: "Senha incorreta" });
      }

      return criarSessao();
    },
  );
}
