# Prompt para transcrever um panfleto de promoção (colar junto com a foto)

> Cole este prompt inteiro numa conversa com o Claude, anexando a(s) foto(s)
> do panfleto. Pegue o JSON de resposta e importe com o comando no final
> deste arquivo.

---

Você vai transcrever um panfleto de promoção de supermercado/feira (a
imagem em anexo) para um JSON estruturado. Esse JSON alimenta um banco de
dados que compara preços entre mercados, então precisão nos números e nas
regras abaixo é mais importante que estilo de texto.

Responda **apenas com o JSON**, dentro de um bloco de código, sem nenhum
texto antes ou depois.

## Formato exato a seguir

```json
{
  "arquivo_origem": "nome-do-arquivo-da-foto.jpg",
  "estabelecimento": {
    "nome_raw": "Nome do mercado exatamente como aparece no panfleto",
    "endereco_raw": "Endereço se aparecer no panfleto, senão null",
    "rede": null
  },
  "validade": {
    "tipo_validade": "data_definida",
    "inicio": "AAAA-MM-DD",
    "fim": "AAAA-MM-DD"
  },
  "extraido_em": "2026-08-29T14:32:00-03:00",
  "itens": [
    {
      "nome_raw": "Nome do produto exatamente como está no panfleto",
      "marca": "Marca, se identificável, senão null",
      "categoria_sugerida": "categoria em minúsculo, ex.: arroz, feijao, leite, hortifruti",
      "quantidade": 5,
      "unidade": "kg",
      "preco": 24.90,
      "preco_original": 29.90,
      "unidade_padrao": "kg",
      "preco_por_unidade_padrao": 4.98,
      "confianca_ocr": 0.95,
      "validade_item": null
    }
  ]
}
```

## Regras obrigatórias

1. **Nunca invente uma data de término.** Se o panfleto não trouxer data de
   validade nenhuma, ou disser algo como "válido enquanto durarem os
   estoques", use:
   ```json
   "validade": { "tipo_validade": "enquanto_durar_estoque", "inicio": null, "fim": null }
   ```
   Só use `"data_definida"` quando houver datas de início e/ou fim
   **impressas no panfleto**. Nesse caso `fim` é obrigatório (não pode ser
   `null`); `inicio` pode ser `null` se só o "até" aparecer impresso.

2. **`validade_item`** só deve ser preenchido (mesmo formato de `validade`
   acima) quando UM item específico tiver uma validade diferente da geral
   do panfleto (ex.: panfleto todo "data definida" mas um item marcado
   "enquanto durar o estoque"). Nos outros casos, deixe `"validade_item": null`
   ou omita o campo.

3. **Separe `quantidade` e `unidade` do nome sempre que possível** (ex.:
   "Arroz 5kg" → `nome_raw: "Arroz Tio João Tipo 1 5kg"`, `quantidade: 5`,
   `unidade: "kg"`). Unidades aceitas: `kg`, `g`, `l`, `ml`, `un`, `unid`,
   `und`. Se não der pra identificar quantidade/unidade, deixe ambos `null`
   — não invente.

4. **`unidade_padrao`** é sempre `"kg"`, `"l"` ou `"un"` (nunca `g` ou
   `ml` — esses são convertidos para `kg`/`l`). Calcule
   `preco_por_unidade_padrao` você mesmo quando der (preço ÷ quantidade
   convertida pra unidade padrão); se não conseguir calcular com confiança,
   deixe `null` que o sistema recalcula na importação.

5. **`preco_original`**: preencha só quando o panfleto mostrar claramente um
   "de X por Y" ou preço riscado. Caso contrário, `null` — não é o mesmo
   que preço normal sem desconto.

6. **`confianca_ocr`**: um número de 0 a 1 refletindo o quão legível/certo
   você está da leitura daquele item específico (letra borrada, preço
   ambíguo, etc. → confiança mais baixa). Opcional, pode omitir se não tiver
   como estimar.

7. **Um item por produto do panfleto**, mesmo que fisicamente próximos na
   imagem. Não agrupe itens diferentes numa única entrada.

8. **`extraido_em`**: use a data/hora atual no formato ISO com timezone
   (ex.: `2026-08-29T14:32:00-03:00`) — é o campo que o app usa pra mostrar
   "atualizado há X" nos itens sem data de validade fixa.

## Como importar depois de ter o JSON

```powershell
$body = Get-Content "caminho\para\folheto.json" -Raw
Invoke-RestMethod -Uri http://localhost:8090/sistemas/feira/api/import -Method Post -Body $body -ContentType "application/json"
```

Se der erro `422`, a resposta traz a lista de itens inválidos por índice —
corrija o JSON e reenvie (nada é gravado até o arquivo inteiro ser válido).
Itens que ficarem com `"statusMatch": "PENDENTE_REVISAO"` na resposta
aparecem em `http://localhost:8090/sistemas/feira/admin/revisao` pra você
confirmar manualmente se são o mesmo produto de outro mercado.
