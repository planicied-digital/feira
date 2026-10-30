# Prompt para o Claude Code — Card de resumo com faixa de preço por produto

> Cole este texto no Claude Code aberto na pasta do projeto `feira`.
> Anexe junto a imagem de referência (card "Pack biscoito integral tradicional Club Social…").

---

Quero implementar no app **feira** um **card de resumo por produto**, inspirado na imagem de referência que estou anexando. Antes de codar, leia `frontend/src/components/ResultadosProdutos.tsx`, `frontend/src/components/PrecoCard.tsx`, `frontend/src/lib/api.ts`, `frontend/src/lib/formatacao.ts` e `backend/src/modules/precos/precos.service.ts` para seguir os padrões que já existem.

## O que a imagem mostra (e o que deve ser reproduzido)

Um card por produto com:

1. **Miniatura** à esquerda e, ao lado, o **nome do produto** em negrito (até 3 linhas) e a **marca** em cinza logo abaixo.
2. **Faixa de preço**: um bloco destacado (fundo cinza-claro, cantos arredondados) com o rótulo pequeno **"DE:"** e o **menor preço** grande e em negrito; ao lado, o rótulo **"ATÉ:"** e o **maior preço** em vermelho, menor que o primeiro.
3. Linha **"em N mercados"** em cinza.
4. Selo/pílula âmbar **"Economize até R$ X (Y%)"**, onde X = maior − menor e Y = X ÷ maior, arredondado para inteiro (ex.: 13,49 − 9,99 = 3,50 → 26%).

## Onde entra no app

- Hoje `ResultadosProdutos` mostra, para cada produto, um título (link para `/produtos/:id`) e a lista de `PrecoCard`s. **Substitua o título** por esse novo card de resumo (crie `frontend/src/components/ResumoProdutoCard.tsx`). O card inteiro continua sendo o link para `/produtos/:id`.
- **Mantenha a lista de `PrecoCard`s logo abaixo** do resumo, como está hoje (com destaque "mais barato", selos de validade etc.). Não remova nada que já existe.
- Como `ResultadosProdutos` é compartilhado, o card aparece automaticamente na **Busca** e na **Categoria**. Se fizer sentido, reutilize o mesmo card no topo de `ProdutoDetalhe.tsx`.
- O aviso atual "Nenhuma promoção com data definida…" continua existindo (pode ficar abaixo do card).

## Regras de cálculo (importante — não comparar laranja com banana)

- Os dados já vêm em `ProdutoComPrecos.precos`, filtrados por validade ativa e ordenados por `precoPorUnidadePadrao` asc. **Não precisa mudar o backend** — calcule tudo no frontend, numa função pura (ex.: `frontend/src/lib/faixaPreco.ts`) com testes se o frontend já tiver setup de teste; se não tiver, não crie infraestrutura nova só para isso.
- **N mercados** = número de `loja.id` distintos entre os preços ativos.
- Um mesmo produto canônico pode ter ofertas de tamanhos diferentes (ex.: 500 g e 1 kg). A quantidade de cada oferta em unidade padrão é `preco / precoPorUnidadePadrao`. Então:
  - **Se todas as ofertas têm a mesma quantidade** (tolerância de ~1%): DE/ATÉ mostram o **preço absoluto** (`formatarMoeda`) e a economia é calculada sobre o preço absoluto.
  - **Se as quantidades diferem**: DE/ATÉ e a economia usam o **preço por unidade padrão** (formatado com `formatarPrecoPorUnidade`, ex.: "R$ 19,98/kg"), e o selo diz "Economize até R$ X/kg (Y%)".
- **Só 1 mercado** (ou menor = maior): mostre só o preço, sem "ATÉ" e sem selo de economia; a linha vira "em 1 mercado" (singular).
- Nunca use preços vencidos/inativos no cálculo — use exatamente a lista que o backend já devolve.

## Miniatura

O banco **não tem imagem de produto**. Não invente URL nem busque imagem na internet. Use um placeholder quadrado (fundo cinza-claro, cantos arredondados) com o `categoria.icone` do produto (já vem no `ProdutoComPrecos`) ou, se não houver, as iniciais do nome. Deixe o componente preparado para receber uma `imagemUrl?` opcional no futuro, mas **sem** migração de banco agora.

## Visual

- Tailwind, mesma linguagem visual dos cards atuais (fundo branco, borda cinza, `rounded-lg`, `shadow-sm`).
- Cores: preço "DE" em `text-gray-900`, rótulos "DE:"/"ATÉ:" pequenos em maiúsculas cinza, preço "ATÉ" em vermelho (`text-red-700`), selo em âmbar (`bg-amber-100 text-amber-800`, pílula arredondada).
- Responsivo: no celular (≈360 px) nada pode estourar a largura; o nome quebra em até 3 linhas (`line-clamp-3`).
- Textos em português do Brasil, valores no formato `R$ 9,99` (use os helpers de `formatacao.ts`).

## Entrega

- Rode `npm run build` (e lint/typecheck/testes que existirem) no frontend e confirme que passa, inclusive o CI em `.github/workflows/ci.yml`.
- Suba a stack com docker-compose e confira visualmente em `http://localhost:8090/sistemas/feira` uma busca que retorne um produto em vários mercados e outro em um só mercado.
- Crie uma branch, faça commit com mensagem em português e abra um PR descrevendo o que mudou, seguindo o padrão dos PRs anteriores.
- No final, me diga quais arquivos mudaram e qualquer decisão que você precisou tomar.
