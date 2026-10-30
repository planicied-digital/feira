// Carrinho de compras em linhas grossas (alça, cesta com faixas, base e rodas vazadas), desenhado
// em SVG próprio. Usa currentColor: a cor vem do texto do elemento pai (className).
export function CarrinhoIcone({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* alça e lateral até a base */}
      <path d="M3 5.5h2.6a1.6 1.6 0 0 1 1.6 1.4L9.4 22h17" />
      {/* cesta (trapézio) */}
      <path d="M8.2 9.5H28l-2.2 9.2H9.6" />
      {/* faixas da cesta */}
      <path d="M10 12.5h16.6M10.4 15.6h15.4" />
      {/* rodas vazadas */}
      <circle cx="12" cy="26.5" r="1.9" />
      <circle cx="23.5" cy="26.5" r="1.9" />
    </svg>
  );
}
