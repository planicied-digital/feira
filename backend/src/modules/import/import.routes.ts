import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { importFolhetoSchema, importQuerySchema } from "./import.schema.js";
import { ImportValidationError, importarFolheto } from "./import.service.js";

export async function importRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/import",
    { schema: { body: importFolhetoSchema, querystring: importQuerySchema } },
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
