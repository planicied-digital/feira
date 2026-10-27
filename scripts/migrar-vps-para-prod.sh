#!/bin/sh
# Migra a VPS da stack de dev (docker-compose.yml + local-proxy, com banco/backend/Vite publicados
# em 0.0.0.0) pra stack de produção (docker-compose.prod.yml, só o frontend em 127.0.0.1).
# Roda UMA vez, como root, na VPS:  sh /opt/feira/scripts/migrar-vps-para-prod.sh
#
# Passos (aborta no primeiro problema, sem mexer no que já está no ar):
#   1. cria .env.prod com senha aleatória (se ainda não existir)
#   2. sobe a stack prod (banco vazio + migrations) e espera a API responder
#   3. para o backend de dev (congela escritas) e copia os dados do banco de dev pro de prod
#   4. confere contagem por tabela e as categorias (dev x prod)
#   5. aponta o nginx do host pra stack prod (com backup e nginx -t) e testa pela URL pública
#   6. para a stack de dev — containers e volume ficam guardados pra rollback
#   7. cria .deploy-prod, que faz o deploy automático (scripts/deploy-vps.sh) usar a stack prod
#
# Se o passo 5 falhar, volta o nginx e o backend de dev sozinho. Rollback manual depois da virada:
# ver o fim deste script (instruções impressas ao terminar).
set -eu

cd /opt/feira
NGINX_SITE=/etc/nginx/sites-available/planicie
URL_PUBLICA=https://13.140.39.163.sslip.io/sistemas/feira
PROD="docker compose -f docker-compose.prod.yml --env-file .env.prod"
DEV="docker compose -f docker-compose.yml -f docker-compose.local-proxy.yml"

if [ -f .deploy-prod ]; then
  echo "A VPS já está na stack de produção (.deploy-prod existe). Nada a fazer."
  exit 0
fi

echo "== 1/7 .env.prod"
if [ ! -f .env.prod ]; then
  senha=$(openssl rand -hex 24)
  sed "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$senha/" .env.prod.example > .env.prod
  chmod 600 .env.prod
  echo "criado com senha aleatória"
else
  echo "já existe, mantido"
fi
porta=$(sed -n 's/^FEIRA_PORT=//p' .env.prod)
porta=${porta:-8091}
usuario_prod=$(sed -n 's/^POSTGRES_USER=//p' .env.prod)
banco_prod=$(sed -n 's/^POSTGRES_DB=//p' .env.prod)
usuario_prod=${usuario_prod:-feira}
banco_prod=${banco_prod:-feira}

echo "== 2/7 subindo stack prod (porta 127.0.0.1:$porta)"
$PROD up -d --build
tentativas=0
until curl -sf "http://127.0.0.1:$porta/sistemas/feira/api/health" > /dev/null; do
  tentativas=$((tentativas + 1))
  if [ "$tentativas" -ge 90 ]; then
    echo "API prod não respondeu"; docker logs --tail 50 feira_prod_backend; exit 1
  fi
  sleep 2
done
echo "API prod ok"

psql_dev() { docker exec feira_db psql -U feira -d feira -tA "$@"; }
psql_prod() { docker exec -i feira_prod_db psql -U "$usuario_prod" -d "$banco_prod" -tA "$@"; }

folhetos_prod=$(psql_prod -c "select count(*) from folhetos")
if [ "$folhetos_prod" != "0" ]; then
  echo "O banco prod já tem $folhetos_prod folheto(s) — abortando pra não misturar dados."
  exit 1
fi

# distinct: o banco de dev da VPS tem linhas repetidas em _prisma_migrations (herança de uma
# sincronização manual antiga) — o que importa é o conjunto de migrations aplicadas.
migr_dev=$(psql_dev -c "select string_agg(distinct migration_name, ',' order by migration_name) from _prisma_migrations where finished_at is not null")
migr_prod=$(psql_prod -c "select string_agg(distinct migration_name, ',' order by migration_name) from _prisma_migrations where finished_at is not null")
if [ "$migr_dev" != "$migr_prod" ]; then
  echo "Migrations diferentes entre dev e prod — abortando."; echo "dev:  $migr_dev"; echo "prod: $migr_prod"; exit 1
fi

cat_dev=$(psql_dev -c "select md5(string_agg(id || slug, ',' order by id)) from categorias")
cat_prod=$(psql_prod -c "select md5(string_agg(id || slug, ',' order by id)) from categorias")
if [ "$cat_dev" != "$cat_prod" ]; then
  echo "Categorias diferentes entre dev e prod (os produtos apontam pra elas por id) — abortando."; exit 1
fi

echo "== 3/7 copiando dados (backend de dev parado durante a cópia)"
docker stop feira_backend > /dev/null
religar_dev() { docker start feira_backend > /dev/null; }
if ! docker exec feira_db pg_dump -U feira -d feira --data-only --disable-triggers \
      --exclude-table=categorias --exclude-table=_prisma_migrations \
    | psql_prod -q -1 -v ON_ERROR_STOP=1 > /dev/null; then
  echo "Falha na cópia — backend de dev religado, nginx intocado."; religar_dev; exit 1
fi

echo "== 4/7 conferindo contagens"
divergente=0
for tabela in lojas folhetos itens_folheto produtos_canonicos precos sugestoes_fusao_produto; do
  n_dev=$(psql_dev -c "select count(*) from $tabela")
  n_prod=$(psql_prod -c "select count(*) from $tabela")
  echo "  $tabela: dev=$n_dev prod=$n_prod"
  [ "$n_dev" = "$n_prod" ] || divergente=1
done
if [ "$divergente" = 1 ]; then
  echo "Contagens divergentes — backend de dev religado, nginx intocado. Banco prod precisa ser"
  echo "zerado antes de tentar de novo:  $PROD down -v"
  religar_dev; exit 1
fi

echo "== 5/7 virando o nginx do host pra 127.0.0.1:$porta"
backup="$NGINX_SITE.bak-feira-$(date +%Y%m%d%H%M%S)"
cp "$NGINX_SITE" "$backup"
sed -i "s#proxy_pass http://127.0.0.1:8090/sistemas/feira/;#proxy_pass http://127.0.0.1:$porta/sistemas/feira/;#" "$NGINX_SITE"
# O restart do feira_local_proxy é necessário porque o nginx dele resolve o IP do container do
# frontend de dev só ao subir — se o frontend foi recriado depois disso, ele responde 502.
voltar_nginx() {
  cp "$backup" "$NGINX_SITE"; nginx -t > /dev/null 2>&1 && systemctl reload nginx
  religar_dev; docker restart feira_local_proxy > /dev/null
}
if ! grep -q "proxy_pass http://127.0.0.1:$porta/sistemas/feira/;" "$NGINX_SITE"; then
  echo "Não achei o proxy_pass do feira (127.0.0.1:8090) em $NGINX_SITE — nada alterado."
  voltar_nginx; exit 1
fi
if ! nginx -t; then
  echo "nginx -t falhou — config restaurada."; voltar_nginx; exit 1
fi
systemctl reload nginx
sleep 2
if ! curl -sf "$URL_PUBLICA/api/health" > /dev/null || ! curl -sf "$URL_PUBLICA/" | grep -q 'id="root"'; then
  echo "A URL pública não respondeu pela stack prod — nginx e backend de dev restaurados."
  voltar_nginx; exit 1
fi
echo "URL pública ok pela stack prod"

echo "== 6/7 parando a stack de dev (containers e volume ficam guardados)"
$DEV stop

echo "== 7/7 marcando deploy automático pra usar a stack prod"
touch .deploy-prod

cat <<EOF

Migração concluída. Backup do nginx: $backup

Rollback, se precisar (volta tudo pra stack de dev):
  cp $backup $NGINX_SITE && nginx -t && systemctl reload nginx
  cd /opt/feira && $DEV start && docker restart feira_local_proxy && rm .deploy-prod

Depois de alguns dias estável, a stack de dev pode ser removida de vez (apaga o volume antigo):
  cd /opt/feira && $DEV down -v
EOF
