// Carrinho de compras desenhado em SVG (sem imagem externa), usado no topo da tela inicial.
// Cesta com "produtos" coloridos dentro; herda o tamanho de className.
export function CarrinhoIcone({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {/* produtos saindo da cesta */}
      <rect x="11" y="6" width="5" height="7" rx="1.5" fill="#22C55E" />
      <circle cx="20" cy="9.5" r="3.2" fill="#EF4444" />
      <rect x="15.5" y="4.5" width="3" height="8" rx="1.2" fill="#FFFFFF" />
      {/* cesta */}
      <path
        d="M3 5h3.2l3.3 14.2a2 2 0 0 0 2 1.6h12.6a2 2 0 0 0 1.9-1.4L28.5 11H8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.4 11.6h18.2l-2 6.2H10.8z" fill="currentColor" opacity="0.25" />
      {/* rodinhas */}
      <circle cx="12.5" cy="26" r="2.4" fill="currentColor" />
      <circle cx="23" cy="26" r="2.4" fill="currentColor" />
    </svg>
  );
}
