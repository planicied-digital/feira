import { normalizarNome } from "./normalizar-nome.js";

// Ordem importa: primeira que bater vence. Mantido em espelho com a migration
// 20260829183000_add_categorias/migration.sql — qualquer ajuste aqui deve ser
// refletido lá também (ou numa nova migration de correção, como já aconteceu
// com "hortifruti").
const CATEGORIA_KEYWORDS: [slug: string, palavras: string[]][] = [
  ["hortifruti", ["hortifruti", "fruta", "verdura", "legume", "horta"]],
  ["carnes-aves-peixes", ["carne", "frango", "ave", "peixe", "bovino", "suino"]],
  [
    "laticinios-frios",
    ["laticinio", "leite", "queijo", "iogurte", "presunto", "frios", "ovos", "lactea"],
  ],
  ["padaria", ["padaria", "pao", "bolo", "biscoito"]],
  [
    "mercearia",
    [
      "mercearia",
      "arroz",
      "feijao",
      "acucar",
      "cafe",
      "oleo",
      "massa",
      "macarrao",
      "farinha",
      "molho",
      "enlatado",
      "achocolatado",
      "doce",
      "grao",
    ],
  ],
  [
    "bebidas",
    [
      "bebida",
      "cerveja",
      "refrigerante",
      "suco",
      "agua",
      "vinho",
      "whisky",
      "vodka",
      "gin",
      "cachaca",
      "energetico",
    ],
  ],
  ["congelados", ["congelado", "sorvete"]],
  ["limpeza", ["limpeza", "detergente", "sabao", "desinfetante", "amaciante"]],
  [
    "higiene-pessoal",
    ["higiene", "sabonete", "shampoo", "creme dental", "absorvente", "desodorante", "papel higienico"],
  ],
  ["bebes-pet", ["bebe", "fralda", "pet", "racao", "infantil"]],
];

const CATEGORIA_FALLBACK_SLUG = "outros";

// Nunca deixa um item sem categoria fixa nem força um mapeamento errado — sem
// correspondência confiável, cai em "outros" (mesmo princípio de "sinalizar em
// vez de errar" usado no agrupamento de produtos).
export function mapearCategoria(categoriaSugerida: string | null | undefined): string {
  if (!categoriaSugerida) return CATEGORIA_FALLBACK_SLUG;

  const normalizado = normalizarNome(categoriaSugerida);
  for (const [slug, palavras] of CATEGORIA_KEYWORDS) {
    if (palavras.some((palavra) => normalizado.includes(palavra))) {
      return slug;
    }
  }
  return CATEGORIA_FALLBACK_SLUG;
}
