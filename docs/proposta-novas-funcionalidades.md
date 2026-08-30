# Proposta — novas funcionalidades (app feira)

Ideias para reforçar o objetivo central do app: ajudar a decidir onde
comprar com melhor custo-benefício nas compras do mês. Nenhuma delas exige
cadastro de usuário (ainda fora do escopo) nem Google Maps (descartado por
enquanto). Organizei por impacto/esforço — não é preciso adotar tudo.

## Fase 1 — alto impacto, aproveitando o que já existe

1. **Lista de compras comparativa (sem precisar salvar nada)**: uma tela
   onde o usuário digita/cola vários itens de uma vez (ex.: "arroz, feijão,
   óleo, sabão em pó") e o app calcula duas coisas: (a) o total mais barato
   comprando tudo num único mercado, e (b) o total mais barato possível
   dividindo a compra entre os mercados mais baratos por item. Mostrando a
   diferença de economia entre as duas opções, o usuário decide se vale a
   pena ir a mais de um lugar ou não. Não precisa de login: a lista vive só
   na sessão/navegador, é montada e descartada a cada uso.
2. **Histórico de preço na tela do produto**: o backend já tem a consulta
   pronta (`listarHistoricoProduto`), só falta aparecer na interface. Um
   gráfico ou lista simples "preço nas últimas semanas/meses" ajuda o
   usuário a perceber se a promoção atual é realmente boa ou só preço
   normal disfarçado de oferta.
3. **Sugestão de alternativa mais barata**: quando o item buscado não tiver
   oferta ativa (ou a oferta encontrada não for boa), sugerir o produto
   mais barato da mesma categoria (ex.: buscou "Arroz Tio João" e não achou
   oferta, mas tem "Arroz Camil" mais barato agora) — aproveita o
   agrupamento por categoria que já existe.
4. **Reforçar o indicador de urgência da validade**: além do selo já
   existente (`SeloValidade`), mostrar contagem regressiva clara para
   `data_definida` ("acaba em 2 dias") e, para `enquanto_durar_estoque`,
   destacar visualmente quando a informação está ficando "velha" (ex.: mais
   de 7 dias desde `extraido_em`) para o usuário desconfiar que pode já ter
   acabado o estoque.

## Fase 2 — mais elaboradas, ainda sem precisar de conta de usuário

5. **Cesta básica no dashboard inicial**: definir uma lista fixa de ~15-20
   itens comuns (arroz, feijão, óleo, açúcar, leite, papel higiênico etc.)
   e mostrar direto na tela inicial "hoje, essa cesta sai mais barata no
   Mercado X por R$ Y" — dá um resultado imediato sem o usuário precisar
   montar nada.
6. **Ranking de mercados**: uma visão que mostra, com base no histórico de
   preços importados, qual mercado tende a ser mais barato com mais
   frequência (ex.: "Mercado X teve o menor preço em 60% dos itens
   comparados este mês") — ajuda a decidir onde fazer a compra "de rotina",
   além da busca item a item.
7. **Comparar dois mercados lado a lado**: escolher dois mercados
   específicos e ver, produto a produto, qual está mais barato em cada um —
   útil pra quem já costuma alternar entre dois lugares fixos.
8. **Compartilhar/exportar a lista otimizada**: depois de montar a lista
   comparativa (item 1), gerar um texto simples pra copiar/mandar no
   WhatsApp com "o que comprar em cada mercado" — sem precisar de conta,
   só um texto gerado na hora.

## Fase 3 — depende de infraestrutura futura (cadastro de usuário)

9. **Alerta de preço-alvo**: usuário define "avise quando X ficar abaixo de
   R$ Y" — natural de implementar quando existir cadastro/contato do
   usuário (e-mail, push), então fica junto com essa fase futura já
   prevista no escopo original.

## Recomendação

Se for escolher só uma coisa pra começar, a lista de compras comparativa
(item 1) é a que mais entrega o objetivo central do app — é o recurso que
realmente ajuda a decidir "vale ir a mais de um mercado ou não" em vez de
só mostrar preço item por item.
