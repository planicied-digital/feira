# Prompt para o Claude Code — Ordenação dos resultados (chips)

> Cole este texto no Claude Code aberto na pasta do projeto `feira`.
> Anexe junto a imagem de referência (chips "Mais relevantes · Menor preço · Maior preço · Maior economia").
> **Pré-requisito:** implementar antes o `docs/prompt-card-faixa-preco.md` (card de resumo com faixa de preço), porque a ordenação "Maior economia" reaproveita aquele cálculo.

---

Quero adicionar ao app **feira** uma barra de **ordenação dos resultados** em forma de chips, inspirada na imagem anexada. Antes de codar, leia `frontend/src/pages/Busca.tsx`, `frontend/src/pages/Categoria.tsx`, `frontend/src/components/ResultadosProdutos.tsx`, `frontend/src/components/ResultadosPorLoja.tsx`, `frontend/src/lib/faixaPreco.ts` (criado no prompt anterior) e `backend/src/modules/precos/precos.service.ts`.

## O que a imagem mostra

Uma linha de 4 chips em formato de pílula, um ao lado do outro:

**Mais relevantes · Menor preço · Maior preço · Maior economia**

- Chip inativo: fundo branco, borda fina colorida clara, texto colorido em semi-negrito.
- Chip ativo: fundo colorido bem claro e borda um pouco mais forte. Só um fica ativo por vez.
- Na imagem a cor é rosa/magenta; **no app use a cor principal que já existe (emerald)**, para manter a identidade visual. Ex.: inativo `border-emerald-200 text-emerald-700 bg-white`, ativo `bg-emerald-50 border-emerald-400 text-emerald-800`.

Crie um componente reutilizável `frontend/src/components/OrdenacaoChips.tsx`, com acessibilidade (`role="radiogroup"`/`aria-checked` ou `aria-pressed`) e foco visível pelo teclado.

## Regras de cada ordenação (produto a produto)

Use uma função pura, por exemplo `frontend/src/lib/ordenarProdutos.ts`, que recebe `ProdutoComPrecos[]` e a ordenação e devolve uma nova lista (sem alterar a original). Use `faixaPreco.ts` para obter menor preço, economia em R$ e economia em %.

- **Mais relevantes**:
  - Na **Busca**: a ordem de relevância do termo buscado (similaridade com `pg_trgm`). **Atenção:** hoje `montarResultado` no backend reordena tudo por `precoPorUnidadePadrao` e joga fora a ordem de similaridade que veio do SQL de `buscarProdutos`. Ajuste o backend para preservar essa ordem — por exemplo, incluindo um campo `relevancia` (o score de `similarity`) em `ProdutoComPrecos` na busca, ou mantendo a ordem dos ids recebidos. Não quebre a página de Categoria, que usa a mesma função.
  - Na **Categoria** (não há termo): produtos com oferta em **mais mercados** primeiro; empate pelo nome em ordem alfabética.
- **Menor preço**: crescente pelo menor preço do produto (o valor "DE" do card de resumo); empate pelo nome.
- **Maior preço**: decrescente pelo mesmo valor de referência; empate pelo nome.
- **Maior economia**: decrescente pela economia em **%** (a mesma do selo "Economize até…"); empate pela economia em R$. Produtos com oferta em **um mercado só** (sem economia) vão para o final, mantendo entre si a ordem de "Menor preço".
- Os `PrecoCard`s **dentro** de cada produto continuam ordenados como hoje (mais barato primeiro, com o destaque "mais barato"). A ordenação muda só a ordem **dos produtos**.

## Onde entra

- **Busca** (`Busca.tsx`): chips logo acima dos resultados, só quando há resultados. Padrão: **Mais relevantes**.
- **Categoria** (`Categoria.tsx`): hoje existem os botões "Menor preço" / "Supermercado", que na verdade trocam o **modo de visualização** (por produto × agrupado por loja). Separe as duas coisas:
  - um seletor de visualização pequeno, "Ver por: **Produto** | **Supermercado**";
  - os chips de ordenação, mostrados só no modo **Produto**. Padrão: **Mais relevantes**.
  - O modo "Supermercado" continua funcionando como hoje.
- Guarde a ordenação escolhida na URL (`?ordem=relevantes|menor-preco|maior-preco|maior-economia`) usando `useSearchParams`, para que voltar à página, recarregar ou compartilhar o link mantenha a escolha. Valor inválido ou ausente → padrão. Na Busca, não perca o `?q=` que já existe.

## Visual / responsivo

- No celular (~360 px), os 4 chips não podem estourar a largura: use uma linha com rolagem horizontal (`overflow-x-auto`, sem barra visível) ou quebra de linha (`flex-wrap`) — escolha o que ficar melhor e me diga qual escolheu.
- Textos em português do Brasil.

## Testes e entrega

- Se o frontend já tiver setup de testes, escreva testes para `ordenarProdutos` cobrindo os 4 casos, os empates e produtos de um mercado só em "Maior economia". Se não tiver, não crie infraestrutura nova só para isso. No backend, cubra a preservação da ordem de relevância com teste, seguindo o padrão de `data-boa-vista.test.ts`.
- Rode build, lint, typecheck e testes do frontend e do backend; confirme que o CI (`.github/workflows/ci.yml`) passa.
- Suba com docker-compose e confira em `http://localhost:8090/sistemas/feira`: uma busca trocando os 4 chips, e uma categoria nos dois modos de visualização.
- Crie uma branch, faça commit com mensagem em português e abra um PR no padrão dos anteriores.
- No final, me diga quais arquivos mudaram e qualquer decisão que você precisou tomar.
