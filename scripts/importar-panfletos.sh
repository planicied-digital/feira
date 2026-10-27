#!/bin/sh
# Importa todos os scripts/panfleto-*.json que ainda não estão no banco. Idempotente: cada arquivo
# vai com ?arquivo_json=<nome>, e o backend devolve 200 (já importado, nada gravado) em vez de 201
# quando aquele JSON já entrou antes. Pode rodar quantas vezes quiser, local ou na VPS.
#
# Uso: sh scripts/importar-panfletos.sh [URL_DA_API]   (padrão: http://localhost:3333)
# Se a API exigir token (produção), passe-o em IMPORT_TOKEN:
#   IMPORT_TOKEN=... sh scripts/importar-panfletos.sh https://.../sistemas/feira/api
set -eu

API_URL="${1:-http://localhost:3333}"
cd "$(dirname "$0")"

resposta=$(mktemp)
trap 'rm -f "$resposta"' EXIT

novos=0
existentes=0
falhas=0

for arquivo in panfleto-*.json; do
  status=$(curl -sS -o "$resposta" -w '%{http_code}' -X POST \
    "$API_URL/import?arquivo_json=$arquivo" \
    -H 'Content-Type: application/json; charset=utf-8' \
    -H "Authorization: Bearer ${IMPORT_TOKEN:-}" \
    --data-binary "@$arquivo") || status="000"

  case "$status" in
    201)
      novos=$((novos + 1))
      pendentes=$(grep -o 'PENDENTE_REVISAO' "$resposta" | wc -l | tr -d ' ')
      echo "importado: $arquivo ($pendentes item(ns) para revisão)"
      ;;
    200)
      existentes=$((existentes + 1))
      ;;
    *)
      falhas=$((falhas + 1))
      echo "FALHOU ($status): $arquivo"
      cat "$resposta"
      echo
      ;;
  esac
done

echo "panfletos: $novos novo(s), $existentes já importado(s), $falhas falha(s)"
[ "$falhas" -eq 0 ]
