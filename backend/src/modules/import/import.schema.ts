import { z } from "zod";

const dataIsoRegex = /^\d{4}-\d{2}-\d{2}$/;

const validadeSchema = z
  .object({
    tipo_validade: z.enum(["data_definida", "enquanto_durar_estoque"]),
    inicio: z.string().regex(dataIsoRegex).nullable(),
    fim: z.string().regex(dataIsoRegex).nullable(),
  })
  .refine(
    (v) => (v.tipo_validade === "enquanto_durar_estoque" ? v.fim === null : v.fim !== null),
    {
      message:
        "fim deve ser null quando tipo_validade for enquanto_durar_estoque, e obrigatório quando for data_definida",
      path: ["fim"],
    },
  );

const itemSchema = z.object({
  nome_raw: z.string().min(1),
  marca: z.string().nullable().optional(),
  categoria_sugerida: z.string().nullable().optional(),
  quantidade: z.number().positive().nullable().optional(),
  unidade: z.string().nullable().optional(),
  preco: z.number().nonnegative(),
  preco_original: z.number().nonnegative().nullable().optional(),
  unidade_padrao: z.enum(["kg", "l", "un"]).nullable().optional(),
  preco_por_unidade_padrao: z.number().positive().nullable().optional(),
  confianca_ocr: z.number().min(0).max(1).nullable().optional(),
  validade_item: validadeSchema.nullable().optional(),
});

export const importFolhetoSchema = z.object({
  arquivo_origem: z.string().min(1),
  estabelecimento: z.object({
    nome_raw: z.string().min(1),
    endereco_raw: z.string().nullable().optional(),
    rede: z.string().nullable().optional(),
  }),
  validade: validadeSchema,
  extraido_em: z.string().datetime({ offset: true }),
  itens: z.array(itemSchema).min(1),
});

export type ImportFolhetoInput = z.infer<typeof importFolhetoSchema>;
export type ImportItemInput = z.infer<typeof itemSchema>;
export type ImportValidadeInput = z.infer<typeof validadeSchema>;
