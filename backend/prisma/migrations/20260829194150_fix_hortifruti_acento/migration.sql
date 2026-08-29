-- "Hortifruti" não leva acento (é um aglutinado de "horti" + "fruti", não uma
-- palavra do dicionário com acentuação própria) — corrige o nome semeado
-- errado como "Hortifrúti" na migration 20260829183000_add_categorias.
UPDATE "categorias" SET "nome" = 'Hortifruti' WHERE "slug" = 'hortifruti';
