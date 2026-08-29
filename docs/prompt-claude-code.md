# Prompt para o Claude Code — App de comparação de preços (feira/mercado)

> Cole este prompt inteiro como primeira mensagem para o Claude Code no projeto "feira".

## Contexto

Estou construindo um app cujo objetivo é ajudar qualquer pessoa a descobrir
onde comprar itens de supermercado e feira mais baratos, para ter o melhor
custo-benefício na hora de fazer as compras do mês.

Os mercados distribuem folhetos de promoção (imagens PNG/JPG) com itens,
preços e (na maioria das vezes) prazo de validade da promoção. Por enquanto,
EU MESMO submeto essas imagens a uma IA (fora deste app, manualmente) pedindo
que ela leia e transcreva o folheto para um arquivo estruturado. Esse arquivo
é o que entra no sistema.

Ou seja, o app não precisa fazer OCR das imagens nesta fase — ele precisa
saber IMPORTAR o arquivo estruturado gerado pela IA, guardar isso num banco de
dados, identificar quando itens de folhetos/mercados diferentes são "o mesmo
produto" e mostrar ao usuário o menor preço entre as opções válidas no
momento.

**Importante:** nem todo folheto traz uma data de validade explícita. Muitas
vezes só há o(s) item(s) e o nome da empresa, e a promoção deve ser entendida
como válida "enquanto durar o estoque". O app precisa tratar esse caso de
forma explícita (ver seções "Formato do arquivo" e "Regras de negócio"
abaixo) — nunca inventar uma data de término nem esconder o item por falta
de data.

## Objetivo do MVP

1. Definir e validar um formato de arquivo (gerado pela IA a partir do
   folheto) que sirva como "dump" de importação para o banco de dados.
2. Modelar o banco de dados para guardar mercados, folhetos, itens brutos
   extraídos e um catálogo de produtos "canônicos" (normalizados).
3. Implementar a importação desse arquivo para o banco.
4. Implementar a normalização/classificação: agrupar itens semelhantes vindos
   de folhetos e mercados diferentes como o mesmo produto canônico, calculando
   preço por unidade padrão (R$/kg, R$/L, R$/un) para permitir comparação
   justa entre embalagens de tamanhos diferentes.
5. Implementar a consulta: usuário busca um item (ou monta uma lista de
   compras) e o app mostra os menores preços entre os mercados, respeitando o
   prazo de validade da promoção — e deixando claro quando a validade é
   "enquanto durar o estoque" em vez de uma data fixa.
6. Além da busca por texto, uma tela inicial em formato de dashboard simples,
   mostrando categorias de produtos (bebidas, carnes, limpeza, grãos etc.)
   para o usuário navegar mesmo sem saber o nome exato do item.
7. Uma interface simples, mobile-first (o uso típico é consultar no celular
   antes ou durante a compra).

## Busca e navegação por categorias (tela inicial)

A forma principal de uso continua sendo a caixa de busca: o usuário digita o
nome do item que está procurando e o app mostra os preços encontrados,
ordenados do mais barato para o mais caro (isso já está definido e não muda).

Além disso, quero que a tela inicial funcione como um dashboard simples,
mostrando categorias de produtos em destaque — para o usuário conseguir
navegar e descobrir ofertas mesmo sem saber exatamente o que procurar (ex.:
"o que tá barato em bebidas hoje?").

Categorias sugeridas para começar (ajuste/complete se fizer sentido, mas
mantenha a ideia de uma lista fixa e curta, não texto livre):

- Hortifruti (frutas, verduras, legumes)
- Carnes, Aves e Peixes
- Laticínios e Frios (leite, queijo, iogurte, presunto etc.)
- Padaria
- Mercearia (grãos, massas, enlatados, molhos, óleo, açúcar, temperos)
- Bebidas
- Congelados
- Material de Limpeza
- Higiene Pessoal
- Bebês e Pet
- Outros (fallback para o que não se encaixar nas anteriores)

Comportamento esperado:
- Tela inicial = caixa de busca (destaque principal) + grade/lista das
  categorias acima, cada uma podendo mostrar um ícone e o nome.
- Ao tocar numa categoria, listar os produtos canônicos daquela categoria,
  reaproveitando a mesma lógica de ranking por preço/unidade padrão já usada
  na busca por texto (menor preço primeiro, respeitando validade da
  promoção).
- Opcional (não obrigatório no MVP, só implemente se for simples): destacar
  na tela inicial algo como "maiores descontos do momento", calculado pela
  diferença entre `preco_original` e `preco`.

## Escopo — o que fica de fora por enquanto

- Cadastro/login de usuários e multiusuário — só quando o app já tiver
  adoção.
- OCR automático das imagens dentro do próprio app (a transcrição é manual,
  feita por mim, submetendo a imagem a uma IA à parte).
- Emissão de nota fiscal, PDV, controle de estoque.

## Stack

Já definida (mesmo padrão usado em outros projetos meus — siga essa
combinação, não é uma sugestão em aberto):

- **Docker** + **docker-compose** para subir os serviços localmente (app +
  banco, e o que mais for necessário).
- **PostgreSQL** como banco de dados.
- **Prisma** como ORM. Como o Prisma é para Node.js/TypeScript, o backend deve
  ser em **Node.js com TypeScript** — proponha o framework (Express, Fastify
  ou NestJS) e justifique a escolha no plano inicial.
- Frontend a seu critério (ex.: Next.js, Vite + React), priorizando
  mobile-first, já que o uso típico é consultar no celular antes ou durante a
  compra.

Não tenho, nesta conversa, um projeto de referência conectado para você copiar
a estrutura exata de pastas/docker-compose — proponha essa organização no
plano inicial, seguindo boas práticas para esse stack. Se for usar
`pg_trgm`/`pgvector` na etapa de similaridade, verifique como habilitar a
extensão via Prisma (normalmente via SQL raw numa migration, já que extensões
do Postgres não são configuradas diretamente no `schema.prisma`). Projeto
local (Windows), sem hospedagem definida ainda — ambiente de desenvolvimento e
testes por enquanto.

**URL/path fixo:** este app tem que ficar acessível em
`http://localhost:8090/sistemas/feira` — não na raiz do domínio. Esse é o
padrão para todos os apps que eu for projetando: cada um vive sob
`http://localhost:8090/sistemas/<nome-do-app>` (aqui, `feira`). Ou seja, tudo
tem que funcionar com esse path como base:
- Se o frontend for Next.js, configure o `basePath` (e `assetPrefix` se
  necessário) como `/sistemas/feira`.
- Rotas de API, links internos e chamadas do frontend para o backend também
  precisam respeitar esse prefixo — nada de assumir que a aplicação roda na
  raiz (`/`).
- No `docker-compose.yml`, deixe claro qual porta/serviço interno vai ficar
  disponível para ser exposto em `8090` sob esse path (pode ser via um
  reverse proxy na frente, se fizer mais sentido — proponha a abordagem, mas
  deixe explícito no plano como o roteamento por path vai funcionar).

## Formato do arquivo de extração (o que a IA vai gerar ao ler o folheto)

Formato recomendado: **JSON**, um arquivo por folheto/imagem processada.

Por que JSON e não CSV: um folheto tem 1 loja + 1 período de validade (quando
existe) e N itens. Em CSV isso obrigaria repetir loja/validade em cada linha e
perderia tipagem (números, datas). Em JSON a IA gera uma estrutura já
validável (dá para rodar uma validação de schema antes de inserir no banco), e
o backend depois transforma isso em linhas relacionais. Se algum dia for
necessário um insert em lote via COPY do Postgres, é trivial "achatar" este
JSON para JSONL (um item por linha, repetindo os dados do folheto) como etapa
intermediária — mas o formato de origem/canônico deve ser este JSON aninhado.

Estrutura sugerida (ajuste nomes de campos se fizer sentido, mas mantenha a
ideia: metadados do folheto + lista de itens). Note o campo `tipo_validade`
dentro de `validade`: ele existe justamente para cobrir o caso de folhetos sem
data explícita.

```json
{
  "arquivo_origem": "folheto_mercado_bomprc_2026-08-29.jpg",
  "estabelecimento": {
    "nome_raw": "Supermercado Bom Preço",
    "endereco_raw": "Av. Principal, 123 - Centro",
    "rede": null
  },
  "validade": {
    "tipo_validade": "data_definida",
    "inicio": "2026-08-28",
    "fim": "2026-09-03"
  },
  "extraido_em": "2026-08-29T14:32:00-04:00",
  "itens": [
    {
      "nome_raw": "Arroz Tio João Tipo 1 5kg",
      "marca": "Tio João",
      "categoria_sugerida": "arroz",
      "quantidade": 5,
      "unidade": "kg",
      "preco": 24.90,
      "preco_original": 29.90,
      "unidade_padrao": "kg",
      "preco_por_unidade_padrao": 4.98,
      "confianca_ocr": 0.95
    },
    {
      "nome_raw": "Feijão Carioca Kicaldo 1kg",
      "marca": "Kicaldo",
      "categoria_sugerida": "feijao",
      "quantidade": 1,
      "unidade": "kg",
      "preco": 7.49,
      "preco_original": null,
      "unidade_padrao": "kg",
      "preco_por_unidade_padrao": 7.49,
      "confianca_ocr": 0.9,
      "validade_item": {
        "tipo_validade": "enquanto_durar_estoque",
        "inicio": null,
        "fim": null
      }
    }
  ]
}
```

Campos-chave a exigir da IA que transcreve:
- `nome_raw`: nome do produto exatamente como está no folheto.
- `quantidade` + `unidade`: separados do nome sempre que possível (ex.: "5" +
  "kg"), para permitir cálculo de preço por unidade padrão.
- `preco` (preço promocional/atual) e `preco_original` quando houver "de/por".
- `preco_por_unidade_padrao`: a própria IA pode calcular, ou o backend calcula
  na importação — decida qual dos dois na implementação, mas o campo tem que
  existir no banco.
- `validade` (no nível do folheto) e, opcionalmente, `validade_item` (no
  nível do item, só quando um item específico tiver uma validade diferente da
  geral do folheto). Ambos seguem o mesmo formato:
  - `tipo_validade`: `"data_definida"` quando o folheto/item traz datas de
    início e fim impressas; `"enquanto_durar_estoque"` para os dois casos que
    não têm data de término confiável — (a) quando está escrito algo como
    "válido enquanto durarem os estoques", e (b) quando o folheto simplesmente
    não traz nenhuma data, só os itens e o nome da empresa. **A IA nunca deve
    inventar uma data de término nesses casos** — deixe `fim` como `null` e
    marque `tipo_validade` corretamente.
  - `inicio`: data ISO (YYYY-MM-DD). Se não houver data de início impressa,
    use `null` — o backend pode usar `extraido_em` como referência de "desde
    quando essa informação é conhecida".
  - `fim`: data ISO ou `null` quando `tipo_validade` for
    `"enquanto_durar_estoque"`.
- `confianca_ocr`: opcional, mas útil para sinalizar itens que precisam de
  revisão manual antes de entrar no catálogo "confiável".

## Modelagem sugerida do banco de dados

Proponha a modelagem final (como schema Prisma), mas a ideia central é em 3
camadas:

1. **Staging (dados brutos importados)**: `lojas`, `folhetos`,
   `itens_folheto` — praticamente um espelho do JSON acima, sem nenhuma
   normalização. As tabelas `folhetos` e/ou `itens_folheto` precisam guardar
   `tipo_validade` (enum: `data_definida` / `enquanto_durar_estoque`) com
   `validade_fim` aceitando `NULL`.
2. **Catálogo canônico**: `produtos_canonicos` (nome_canonico, categoria,
   marca, unidade_padrao) — o "mesmo produto" reunindo variações de nome
   entre folhetos/mercados diferentes.
3. **Preços**: `precos` — liga `produto_canonico_id` + `loja_id` +
   `folheto_id` a um preço, preço por unidade padrão, `tipo_validade` e
   período de validade (`validade_inicio`, `validade_fim` nullable). É essa
   tabela que a consulta final usa para ranquear mercados por preço.

Para suportar a navegação por categorias, crie também uma tabela
`categorias` (id, nome, slug, ícone opcional) com a lista fixa sugerida
acima, e faça `produtos_canonicos.categoria` referenciar essa tabela
(`categoria_id`), em vez de ser texto livre — evita categorias duplicadas ou
divergentes (ex.: "limpeza" vs "Limpeza" vs "produtos de limpeza"). O campo
`categoria_sugerida` que vem no JSON de importação continua sendo texto
livre (é o que a IA consegue inferir do folheto); é o backend, na etapa de
normalização, que mapeia esse texto para uma das categorias fixas.

## Regras de negócio centrais

- **Preço por unidade padrão**: sempre converter para uma unidade comum
  (R$/kg, R$/L, R$/un) antes de comparar — embalagens de tamanhos diferentes
  não podem ser comparadas pelo preço bruto.
- **Classificação/agrupamento de itens semelhantes**: normalizar o
  `nome_raw` (minúsculo, sem acento, remover ruído tipo "OFERTA", "PROMOÇÃO"),
  extrair marca/quantidade/unidade, e então agrupar por similaridade dentro
  da mesma categoria + unidade padrão (ex.: `pg_trgm`/similaridade de
  trigramas no Postgres, ou embeddings, à sua escolha). Correspondências com
  confiança baixa devem ficar sinalizadas para revisão manual em vez de
  fundidas automaticamente — errar um agrupamento é pior do que deixar um
  item "solto" temporariamente.
- **Validade — dois casos, tratados de forma diferente:**
  - `data_definida`: só aparece nos resultados enquanto a data atual estiver
    dentro de `[validade_inicio, validade_fim]`. Passou do `fim`, some da
    listagem normal (mas fica guardado no histórico).
  - `enquanto_durar_estoque`: **nunca deve ser escondido automaticamente por
    data**, já que não existe uma data de término confiável. Em vez disso, o
    item deve continuar aparecendo nos resultados, mas com um rótulo bem
    visível para o usuário (ex.: "válido enquanto durar o estoque — sem data
    de término informada") e mostrando há quanto tempo essa informação foi
    extraída (`extraido_em`), para o usuário avaliar o risco de já ter
    acabado. Opcionalmente, a UI pode ordenar/priorizar itens
    `data_definida` acima de `enquanto_durar_estoque` quando o preço
    empatar, já que são mais confiáveis.
- **Mapeamento de categoria**: ao normalizar um item, mapeie o
  `categoria_sugerida` (texto livre vindo da IA) para uma das categorias
  fixas da tabela `categorias`. Se não houver correspondência confiável, use
  a categoria "Outros" em vez de forçar um mapeamento errado — o mesmo
  princípio de "sinalizar em vez de errar" já usado no agrupamento de
  produtos semelhantes.
- **Resultado para o usuário**: ao buscar um item ou montar uma lista de
  compras, mostrar os preços agrupados por produto canônico, ordenados do
  mais barato (por unidade padrão) para o mais caro, com nome do mercado,
  preço, unidade e a informação de validade (data definida ou "enquanto
  durar o estoque", sempre explícita).

## O que peço que você faça primeiro

Antes de escrever código, apresente um plano curto com:
1. A modelagem de banco de dados proposta como schema Prisma (`schema.prisma`
   preliminar), incluindo como fica o `tipo_validade`/`validade_fim`
   nullable.
2. A estrutura de pastas do projeto e um `docker-compose.yml` preliminar
   (serviços de app/backend e Postgres, no mínimo).
3. A estratégia de normalização/agrupamento de itens semelhantes que
   pretende usar, e como tratar casos de baixa confiança.
4. Como a UI vai deixar claro, visualmente, a diferença entre um preço com
   data de validade definida e um preço "enquanto durar o estoque".
5. Como o app vai ficar acessível em `http://localhost:8090/sistemas/feira`
   (basePath do frontend, roteamento das rotas de API, e se vai precisar de
   um reverse proxy na frente).
6. Um wireframe simples (pode ser em texto mesmo) da tela inicial mostrando
   a caixa de busca junto com a grade de categorias, e a lista de categorias
   que pretende usar (pode ajustar a sugestão acima).

Só depois de eu validar esse plano, comece a implementação.
