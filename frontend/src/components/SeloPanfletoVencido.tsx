import type { SituacaoPanfleto } from "../lib/api";
import { formatarDataCurta } from "../lib/tempoRelativo";

export function textoPanfletoVencido(situacao: SituacaoPanfleto): string {
  return situacao.panfletoValidoAte
    ? `panfleto vencido em ${formatarDataCurta(situacao.panfletoValidoAte)}`
    : "sem panfleto";
}

// Ranking e comparação usam histórico: um mercado pode aparecer bem colocado com preços de um
// panfleto que já venceu. O selo deixa claro que aqueles preços não estão valendo agora.
export function SeloPanfletoVencido({ situacao }: { situacao: SituacaoPanfleto }) {
  if (situacao.panfletoAtual) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
      {textoPanfletoVencido(situacao)}
    </span>
  );
}
