-- Nome do JSON em scripts/ que originou o folheto (ex.: panfleto-goiana-hortifruti-2026-10-27.json).
-- Único para que reimportar o mesmo arquivo (deploy automático na VPS) não duplique o folheto.
ALTER TABLE "folhetos" ADD COLUMN "arquivo_json" TEXT;

CREATE UNIQUE INDEX "folhetos_arquivo_json_key" ON "folhetos"("arquivo_json");
