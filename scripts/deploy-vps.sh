#!/bin/sh
# Deploy na VPS, disparado pelo workflow .github/workflows/deploy.yml depois de cada merge na master.
#
# Não é chamado direto: a chave de deploy do GitHub Actions só pode executar o "forced command"
# configurado em /root/.ssh/authorized_keys da VPS, que faz o git pull ANTES de chamar este script
# (assim sempre roda a versão nova dele) e passa o commit anterior como argumento:
#
#   command="cd /opt/feira && ANTES=$(git rev-parse HEAD) && git pull --ff-only -q && sh scripts/deploy-vps.sh $ANTES",restrict ssh-ed25519 AAAA... feira-gha-deploy
#
# Dois modos, decididos pelo marcador .deploy-prod (criado no fim de scripts/migrar-vps-para-prod.sh):
# - prod: docker-compose.prod.yml — imagens com o código compilado dentro, então sempre rebuilda
#   (o cache do Docker pula o que não mudou) e a API é acessada pelo frontend em 127.0.0.1.
# - dev (legado, até a migração): docker-compose.yml — só rebuilda o serviço cuja pasta mudou.
set -eu

ANTES="$1"
cd /opt/feira
DEPOIS=$(git rev-parse HEAD)
echo "deploy: $ANTES -> $DEPOIS"

if [ -f .deploy-prod ]; then
  porta=$(sed -n 's/^FEIRA_PORT=//p' .env.prod)
  API_URL="http://127.0.0.1:${porta:-8091}/sistemas/feira/api"
  echo "stack: prod"
  # Gera os segredos que faltarem no .env.prod — sem eles o backend prod recusa importações
  # (IMPORT_TOKEN) e deixa a área de admin desabilitada (ADMIN_PASSWORD). Valores já definidos
  # nunca são trocados; pra mudar a senha do admin, edite o .env.prod e rode o deploy de novo.
  garantir_segredo() {
    if [ -z "$(sed -n "s/^$1=//p" .env.prod)" ]; then
      sed -i "/^$1=/d" .env.prod
      echo "$1=$(openssl rand -hex "$2")" >> .env.prod
      echo "$1 gerado em .env.prod"
    fi
  }
  garantir_segredo IMPORT_TOKEN 32
  garantir_segredo ADMIN_PASSWORD 12
  garantir_segredo ADMIN_SESSION_SECRET 32
  IMPORT_TOKEN=$(sed -n 's/^IMPORT_TOKEN=//p' .env.prod)
  export IMPORT_TOKEN
  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
  CONTAINER_BACKEND=feira_prod_backend
else
  API_URL="http://localhost:3333"
  echo "stack: dev"

  mudou() {
    [ "$ANTES" != "$DEPOIS" ] && git diff --name-only "$ANTES" "$DEPOIS" | grep -q "^$1/"
  }

  servicos=""
  if mudou backend; then servicos="$servicos backend"; fi
  if mudou frontend; then servicos="$servicos frontend"; fi

  if [ -n "$servicos" ]; then
    echo "rebuild:$servicos"
    # shellcheck disable=SC2086
    docker compose up -d --build $servicos
  fi
  CONTAINER_BACKEND=feira_backend
fi

# O backend aplica as migrations (prisma migrate deploy) ao subir — espera ficar de pé antes de importar.
tentativas=0
until curl -sf "$API_URL/health" > /dev/null; do
  tentativas=$((tentativas + 1))
  if [ "$tentativas" -ge 90 ]; then
    echo "backend não respondeu em $API_URL/health"
    docker logs --tail 50 "$CONTAINER_BACKEND"
    exit 1
  fi
  sleep 2
done

sh scripts/importar-panfletos.sh "$API_URL"
