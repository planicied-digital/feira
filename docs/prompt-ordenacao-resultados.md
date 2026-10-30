# Prompt para o Claude Code — Ordenação dos resultados (chips)

> Cole este texto no Claude Code aberto na pasta do projeto `feira`.
> Anexe junto a imagem de referência (chips de ordenação). **Ignore o chip "Mais relevantes" da imagem — ele não deve ser implementado.**
> **Pré-requisito:** implementar antes o `docs/prompt-card-faixa-preco.md` (card de resumo com faixa de preço), porque a ordenação "Maior economia" reaproveita aquele cálculo.

---

Quero adicionar ao app **feira** uma barra de **ordenação dos resultados** em forma de chips, inspirada na imagem anexada. Antes de codar, leia `frontend/src/pages/Busca.tsx`, `frontend/src/pages/Categoria.tsx`, `frontend/src/components/ResultadosProdutos.tsx`, `frontend/src/components/ResultadosPorLoja.tsx` e `frontend/src/lib/faixaPreco.ts` (criado no prompt anterior).

## O que deve ser implementado

Uma linha com **3 chips** em formato de pílula, um ao lado do outro:

**Menor preço · Maior preço · Maior economia**

A imagem de referência mostra também um chip "Mais relevantes": **não implemente essa opção** (decisão tomada; pode voltar no futuro).

- Chip inativo: fundo branco, borda fina colorida clara, texto colorido em semi-negrito.
- Chip ativo: fundo colorido bem claro e borda um pouco mais forte. Só um fica ativo por vez.
- Na imagem a cor é rosa/magenta; **no app use a cor principal que já existe (emerald)**, para manter a identidade visual. Ex.: inativo `border-emerald-200 text-emerald-700 bg-white`, ativo `bg-emerald-50 border-emerald-400 text-emerald-800`.

Crie um componente reutilizável `frontend/src/components/OrdenacaoChips.tsx`, com acessibilidade (`role="radiogroup"`/`aria-checked` ou `aria-pressed`) e foco visível pelo teclado.

## Regras de cada ordenação (produto a produto)

Use uma função pura, por exemplo `frontend/src/lib/ordenarProdutos.ts`, que recebe `ProdutoComPrecos[]` e a ordenação e devolve uma nova lista (sem alterar a original). Use `faixaPreco.ts` para obter menor preço, economia em R$ e economia em %.

- **Menor preço** (padrão): crescente pelo menor preço do produto (o valor "DE" do card de resumo); empate pelo nome.
- **Maior preço**: decrescente pelo mesmo valor de referência; empate pelo nome.
- **Maior economia**: decrescente pela economia em **%** (a mesma do selo "Economize até…"); empate pela economia em R$. Produtos com oferta em **um mercado só** (sem economia) vão para o final, mantendo entre si a ordem de "Menor preço".
- Os `PrecoCard`s **dentro** de cada produto continuam ordenados como hoje (mais barato primeiro, com o destaque "mais barato"). A ordenação muda só a ordem **dos produtos**.
- Tudo no frontend — **não é preciso mudar o backend**.

## Onde entra

- **Busca** (`Busca.tsx`): chips logo acima dos resultados, só quando há resultados. Padrão: **Menor preço**.
- **Categoria** (`Categoria.tsx`): hoje existem os botões "Menor preço" / "Supermercado", que na verdade trocam o **modo de visualização** (por produto × agrupado por loja). Separe as duas coisas:
  - um seletor de visualização pequeno, "Ver por: **Produto** | **Supermercado**";
  - os chips de ordenação, mostrados só no modo **Produto**. Padrão: **Menor preço**.
  - O modo "Supermercado" continua funcionando como hoje.
- Guarde a ordenação escolhida na URL (`?ordem=menor-preco|maior-preco|maior-economia`) usando `useSearchParams`, para que voltar à página, recarregar ou compartilhar o link mantenha a escolha. Valor inválido ou ausente → padrão. Na Busca, não perca o `?q=` que já existe.

## Visual / responsivo

- No celular (~360 px), os chips não podem estourar a largura: use uma linha com rolagem horizontal (`overflow-x-auto`, sem barra visível) ou quebra de linha (`flex-wrap`) — escolha o que ficar melhor e me diga qual escolheu.
- Textos em português do Brasil.

## Testes e entrega

- Se o frontend já tiver setup de testes, escreva testes para `ordenarProdutos` cobrindo os 3 casos, os empates e produtos de um mercado só em "Maior economia". Se não tiver, não crie infraestrutura nova só para isso.
- Rode build, lint, typecheck e testes; confirme que o CI (`.github/workflows/ci.yml`) passa.
- Suba com docker-compose e confira em `http://localhost:8090/sistemas/feira`: uma busca trocando os 3 chips, e uma categoria nos dois modos de visualização.
- Crie uma branch, faça commit com mensagem em português e abra um PR no padrão dos anteriores.
- No final, me diga quais arquivos mudaram e qualquer decisão que você precisou tomar.
