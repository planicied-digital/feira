import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Exigido em POST /import quando definido. Vazio vira undefined porque o compose repassa
  // "${IMPORT_TOKEN:-}" mesmo quando a variável não existe no .env.
  IMPORT_TOKEN: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(16).optional()),
  // Senha da área /admin (revisão). Sem ela: em produção a área fica desabilitada; em dev, aberta.
  ADMIN_PASSWORD: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(8).optional()),
  // Chave que assina as sessões do admin. Sem ela, usa uma aleatória por processo (as sessões
  // caem a cada restart do backend — aceitável, só obriga a logar de novo).
  ADMIN_SESSION_SECRET: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(32).optional()),
});

export const env = envSchema.parse(process.env);
