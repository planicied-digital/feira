-- Categorias fixas para navegação por dashboard (ver docs/prompt-claude-code.md).
-- produtos_canonicos.categoria (texto livre) já tem 118 linhas de dados reais importados
-- de panfletos — este migration cria a tabela nova, faz backfill a partir do texto livre
-- existente e só então troca a coluna, para não perder nada.

-- 1) Tabela de categorias fixas
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icone" TEXT,
    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- 2) Seed da lista fixa (docs/prompt-claude-code.md)
INSERT INTO "categorias" ("id", "nome", "slug", "icone") VALUES
  ('cat_hortifruti', 'Hortifrúti', 'hortifruti', '🥬'),
  ('cat_carnes_aves_peixes', 'Carnes, Aves e Peixes', 'carnes-aves-peixes', '🥩'),
  ('cat_laticinios_frios', 'Laticínios e Frios', 'laticinios-frios', '🧀'),
  ('cat_padaria', 'Padaria', 'padaria', '🍞'),
  ('cat_mercearia', 'Mercearia', 'mercearia', '🛒'),
  ('cat_bebidas', 'Bebidas', 'bebidas', '🥤'),
  ('cat_congelados', 'Congelados', 'congelados', '❄️'),
  ('cat_limpeza', 'Material de Limpeza', 'limpeza', '🧽'),
  ('cat_higiene_pessoal', 'Higiene Pessoal', 'higiene-pessoal', '🧴'),
  ('cat_bebes_pet', 'Bebês e Pet', 'bebes-pet', '🍼'),
  ('cat_outros', 'Outros', 'outros', '📦')
ON CONFLICT ("slug") DO NOTHING;

-- 3) Nova coluna, nullable por enquanto (não dá pra criar já NOT NULL com linhas existentes)
ALTER TABLE "produtos_canonicos" ADD COLUMN "categoria_id" TEXT;

-- 4) Backfill: mapeia o texto livre existente para um slug fixo, espelhando exatamente
-- o dicionário de palavras-chave de backend/src/modules/normalizacao/mapear-categoria.ts
-- (mesma ordem de prioridade — primeira palavra-chave que bater vence). Sem correspondência,
-- cai em "outros".
UPDATE "produtos_canonicos" pc
SET "categoria_id" = (
  SELECT c."id" FROM "categorias" c WHERE c."slug" = (
    CASE
      WHEN lower(pc."categoria") LIKE '%fruta%' OR lower(pc."categoria") LIKE '%verdura%'
        OR lower(pc."categoria") LIKE '%legume%' OR lower(pc."categoria") LIKE '%horta%'
        THEN 'hortifruti'
      WHEN lower(pc."categoria") LIKE '%carne%' OR lower(pc."categoria") LIKE '%frango%'
        OR lower(pc."categoria") LIKE '%ave%' OR lower(pc."categoria") LIKE '%peixe%'
        OR lower(pc."categoria") LIKE '%bovino%' OR lower(pc."categoria") LIKE '%suino%'
        THEN 'carnes-aves-peixes'
      WHEN lower(pc."categoria") LIKE '%laticinio%' OR lower(pc."categoria") LIKE '%leite%'
        OR lower(pc."categoria") LIKE '%queijo%' OR lower(pc."categoria") LIKE '%iogurte%'
        OR lower(pc."categoria") LIKE '%presunto%' OR lower(pc."categoria") LIKE '%frios%'
        OR lower(pc."categoria") LIKE '%ovos%' OR lower(pc."categoria") LIKE '%lactea%'
        THEN 'laticinios-frios'
      WHEN lower(pc."categoria") LIKE '%padaria%' OR lower(pc."categoria") LIKE '%pao%'
        OR lower(pc."categoria") LIKE '%bolo%' OR lower(pc."categoria") LIKE '%biscoito%'
        THEN 'padaria'
      WHEN lower(pc."categoria") LIKE '%mercearia%' OR lower(pc."categoria") LIKE '%arroz%'
        OR lower(pc."categoria") LIKE '%feijao%' OR lower(pc."categoria") LIKE '%acucar%'
        OR lower(pc."categoria") LIKE '%cafe%' OR lower(pc."categoria") LIKE '%oleo%'
        OR lower(pc."categoria") LIKE '%massa%' OR lower(pc."categoria") LIKE '%macarrao%'
        OR lower(pc."categoria") LIKE '%farinha%' OR lower(pc."categoria") LIKE '%molho%'
        OR lower(pc."categoria") LIKE '%enlatado%' OR lower(pc."categoria") LIKE '%achocolatado%'
        OR lower(pc."categoria") LIKE '%doce%' OR lower(pc."categoria") LIKE '%grao%'
        THEN 'mercearia'
      WHEN lower(pc."categoria") LIKE '%bebida%' OR lower(pc."categoria") LIKE '%cerveja%'
        OR lower(pc."categoria") LIKE '%refrigerante%' OR lower(pc."categoria") LIKE '%suco%'
        OR lower(pc."categoria") LIKE '%agua%' OR lower(pc."categoria") LIKE '%vinho%'
        OR lower(pc."categoria") LIKE '%whisky%' OR lower(pc."categoria") LIKE '%vodka%'
        OR lower(pc."categoria") LIKE '%gin%' OR lower(pc."categoria") LIKE '%cachaca%'
        OR lower(pc."categoria") LIKE '%energetico%'
        THEN 'bebidas'
      WHEN lower(pc."categoria") LIKE '%congelado%' OR lower(pc."categoria") LIKE '%sorvete%'
        THEN 'congelados'
      WHEN lower(pc."categoria") LIKE '%limpeza%' OR lower(pc."categoria") LIKE '%detergente%'
        OR lower(pc."categoria") LIKE '%sabao%' OR lower(pc."categoria") LIKE '%desinfetante%'
        OR lower(pc."categoria") LIKE '%amaciante%'
        THEN 'limpeza'
      WHEN lower(pc."categoria") LIKE '%higiene%' OR lower(pc."categoria") LIKE '%sabonete%'
        OR lower(pc."categoria") LIKE '%shampoo%' OR lower(pc."categoria") LIKE '%creme dental%'
        OR lower(pc."categoria") LIKE '%absorvente%' OR lower(pc."categoria") LIKE '%desodorante%'
        OR lower(pc."categoria") LIKE '%papel higienico%'
        THEN 'higiene-pessoal'
      WHEN lower(pc."categoria") LIKE '%bebe%' OR lower(pc."categoria") LIKE '%fralda%'
        OR lower(pc."categoria") LIKE '%pet%' OR lower(pc."categoria") LIKE '%racao%'
        OR lower(pc."categoria") LIKE '%infantil%'
        THEN 'bebes-pet'
      ELSE 'outros'
    END
  )
);

-- 5) Agora que toda linha tem categoria_id, torna obrigatório e cria a FK + índice novo
ALTER TABLE "produtos_canonicos" ALTER COLUMN "categoria_id" SET NOT NULL;

ALTER TABLE "produtos_canonicos"
  ADD CONSTRAINT "produtos_canonicos_categoria_id_fkey"
  FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX "produtos_canonicos_categoria_unidade_padrao_idx";
CREATE INDEX "produtos_canonicos_categoria_id_unidade_padrao_idx" ON "produtos_canonicos"("categoria_id", "unidade_padrao");

-- 6) Remove a coluna de texto livre antiga
ALTER TABLE "produtos_canonicos" DROP COLUMN "categoria";
