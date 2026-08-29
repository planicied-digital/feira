CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_itens_folheto_nome_normalizado_trgm
  ON itens_folheto USING gin (nome_normalizado gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_produtos_canonicos_nome_normalizado_trgm
  ON produtos_canonicos USING gin (nome_normalizado gin_trgm_ops);
