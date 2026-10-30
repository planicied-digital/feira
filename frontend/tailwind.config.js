/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Paleta do app, inspirada no estilo de varejo (azul de ação + amarelo de destaque) — sem
      // copiar identidade de marca. Use estes nomes nos componentes, nunca cores soltas do
      // Tailwind (emerald, blue...), pra trocar o visual mexendo só aqui.
      colors: {
        // Ação: botões, links, chips ativos, foco.
        primaria: {
          50: "#EEF4FF",
          100: "#DCE8FF",
          200: "#B9D1FF",
          300: "#8AB2FF",
          400: "#4F8AF7",
          500: "#1F66EA",
          600: "#0B56D9",
          700: "#0846B3",
          800: "#0B3A8C",
          900: "#0E2F6B",
        },
        // Destaque: selos de economia, avisos. Os tons 700–900 são escuros de propósito — texto
        // em amarelo não é legível; sobre fundo destaque-50/100 use destaque-800.
        destaque: {
          50: "#FFF9E6",
          100: "#FFF0BF",
          200: "#FFE38A",
          300: "#FFD65C",
          400: "#FFC933",
          500: "#F5B800",
          600: "#D69E00",
          700: "#8A5F00",
          800: "#6B4700",
          900: "#4D3300",
        },
        // Azul-marinho neutro: blocos secundários e textos fortes.
        marinho: {
          50: "#EEF2F8",
          100: "#D9E1EE",
          200: "#B3C2DA",
          300: "#8099BD",
          400: "#4D6E9C",
          500: "#2E5280",
          600: "#1E406B",
          700: "#163357",
          800: "#0F2A4A",
          900: "#0A1F38",
        },
      },
    },
  },
  plugins: [],
};
