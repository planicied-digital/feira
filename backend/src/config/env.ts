import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Exigido em POST /import quando definido. Vazio vira undefined porque o compose repassa
  // "${IMPORT_TOKEN:-}" mesmo quando a variável não existe no .env.
  IMPORT_TOKEN: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(16).optional()),
});

export const env = envSchema.parse(process.env);
