-- Correção: a palavra-chave "hortifruti" (o próprio nome da categoria, valor mais comum
-- que a IA sugere) não continha nem "fruta" nem "horta" como substring, então os 22 itens
-- de hortifruti da migration anterior caíram errado em "Outros". Rederiva a partir do
-- categoria_sugerida original (ainda preservado em itens_folheto) só para quem está em
-- "outros" hoje.
UPDATE "produtos_canonicos" pc
SET "categoria_id" = (SELECT "id" FROM "categorias" WHERE "slug" = 'hortifruti')
WHERE pc."categoria_id" = (SELECT "id" FROM "categorias" WHERE "slug" = 'outros')
  AND EXISTS (
    SELECT 1 FROM "itens_folheto" i
    WHERE i."produto_canonico_id" = pc."id"
      AND lower(i."categoria_sugerida") LIKE '%hortifruti%'
  );
