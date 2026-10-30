import { ORDENACOES, ROTULO_ORDENACAO, type Ordenacao } from "../lib/ordenarProdutos";

interface OrdenacaoChipsProps {
  valor: Ordenacao;
  aoMudar: (ordenacao: Ordenacao) => void;
}

export function OrdenacaoChips({ valor, aoMudar }: OrdenacaoChipsProps) {
  return (
    // flex-wrap em vez de rolagem horizontal: no celular estreito os chips quebram em 2 linhas, mas
    // ficam todos à vista — numa linha rolável o "Maior economia" ficaria escondido à direita.
    <div role="radiogroup" aria-label="Ordenar resultados" className="flex flex-wrap gap-1.5">
      {ORDENACOES.map((ordenacao) => {
        const ativo = ordenacao === valor;
        return (
          <button
            key={ordenacao}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(ordenacao)}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
              ativo
                ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                : "border-emerald-200 bg-white text-emerald-700 active:bg-emerald-50"
            }`}
          >
            {ROTULO_ORDENACAO[ordenacao]}
          </button>
        );
      })}
    </div>
  );
}
