export interface EnderecoComRotulo {
  rotulo: string | null;
  endereco: string;
}

const REGEX_ROTULO = /^(Loja\s*\d+|\d{1,2})\s*[-:]\s*(.+)$/i;

// Alguns mercados descrevem mais de uma unidade num único campo de texto (ex.: "Loja 1: ...;
// Loja 2: ..." ou "01 - ...; 02 - ..."). Separa por unidade para gerar um link de mapa por
// endereço; quando não há um rótulo reconhecível, mantém o texto inteiro como um endereço único.
export function dividirEnderecos(enderecoRaw: string): EnderecoComRotulo[] {
  return enderecoRaw
    .split(";")
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => {
      const match = parte.match(REGEX_ROTULO);
      return match ? { rotulo: match[1].trim(), endereco: match[2].trim() } : { rotulo: null, endereco: parte };
    });
}

// Deep link de busca do Google Maps — não precisa de API key nem geocodificação prévia.
export function linkGoogleMaps(endereco: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}
