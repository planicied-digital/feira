const NOISE_WORDS = [
  "oferta",
  "ofertas",
  "promocao",
  "promocional",
  "imperdivel",
  "confira",
  "novo",
  "nova",
  "leve mais pague menos",
  "embalagem economica",
  "super oferta",
  "preco especial",
];

const DIACRITICOS_REGEX = /[̀-ͯ]/g;

function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(DIACRITICOS_REGEX, "");
}

// Usado como alvo dos índices trigram — precisa ficar estável entre itens/produtos para o matching funcionar.
export function normalizarNome(texto: string, trechoQuantidadeUnidade?: string | null): string {
  let normalizado = removerAcentos(texto.toLowerCase());

  if (trechoQuantidadeUnidade) {
    const trechoNormalizado = removerAcentos(trechoQuantidadeUnidade.toLowerCase());
    normalizado = normalizado.replace(trechoNormalizado, " ");
  }

  for (const ruido of NOISE_WORDS) {
    normalizado = normalizado.replace(new RegExp(`\\b${ruido}\\b`, "g"), " ");
  }

  normalizado = normalizado
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalizado;
}
