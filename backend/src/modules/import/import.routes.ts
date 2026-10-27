import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "../../config/env.js";
import { importFolhetoSchema, importQuerySchema } from "./import.schema.js";
import { ImportValidationError, importarFolheto } from "./import.service.js";

function tokenConfere(recebido: string, esperado: string): boolean {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

// A rota fica exposta pela URL pública (o nginx do frontend repassa /sistemas/feira/api/), então em
// produção só aceita quem tem o IMPORT_TOKEN — e sem token configurado, recusa (falha fechada).
// Em dev, sem token, segue aberta pra não atrapalhar o uso local.
async function exigirTokenImport(request: FastifyRequest, reply: FastifyReply) {
  if (!env.IMPORT_TOKEN) {
    if (env.NODE_ENV === "production") {
      return reply.status(503).send({ mensagem: "Importação desabilitada: IMPORT_TOKEN não configurado" });
    }
    return;
  }

  const recebido = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
  if (!tokenConfere(recebido, env.IMPORT_TOKEN)) {
    return reply.status(401).send({ mensagem: "Token de importação ausente ou inválido" });
  }
}

export async function importRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/import",
    { schema: { body: importFolhetoSchema, querystring: importQuerySchema }, onRequest: exigirTokenImport },
    async (request, reply) => {
      try {
        const resultado = await importarFolheto(request.body, request.query.arquivo_json);
        return reply.status(resultado.jaImportado ? 200 : 201).send(resultado);
      } catch (error) {
        if (error instanceof ImportValidationError) {
          return reply.status(422).send({ mensagem: error.message, erros: error.erros });
        }
        throw error;
      }
    },
  );
}
