#!/bin/sh
# Deploy na VPS, disparado pelo workflow .github/workflows/deploy.yml depois de cada merge na master.
#
# Não é chamado direto: a chave de deploy do GitHub Actions só pode executar o "forced command"
# configurado em /root/.ssh/authorized_keys da VPS, que faz o git pull ANTES de chamar este script
# (assim sempre roda a versão nova dele) e passa o commit anterior como argumento:
#
#   command="cd /opt/feira && ANTES=$(git rev-parse HEAD) && git pull --ff-only -q && sh scripts/deploy-vps.sh $ANTES",restrict ssh-ed25519 AAAA... feira-gha-deploy
set -eu

ANTES="$1"
cd /opt/feira
DEPOIS=$(git rev-parse HEAD)
echo "deploy: $ANTES -> $DEPOIS"

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

# O backend aplica as migrations (prisma migrate deploy) ao subir — espera ficar de pé antes de importar.
tentativas=0
until curl -sf http://localhost:3333/health > /dev/null; do
  tentativas=$((tentativas + 1))
  if [ "$tentativas" -ge 90 ]; then
    echo "backend não respondeu em http://localhost:3333/health"
    docker logs --tail 50 feira_backend
    exit 1
  fi
  sleep 2
done

sh scripts/importar-panfletos.sh http://localhost:3333
