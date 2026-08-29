import type { PrecoResultado, UnidadePadrao } from "../lib/api";
import { formatarMoeda, formatarPrecoPorUnidade } from "../lib/formatacao";
import { precoEstaEnvelhecido, SeloValidade } from "./SeloValidade";

interface PrecoCardProps {
  preco: PrecoResultado;
  unidadePadrao: UnidadePadrao;
  ehMaisBarato: boolean;
}

export function PrecoCard({ preco, unidadePadrao, ehMaisBarato }: PrecoCardProps) {
  const envelhecido = precoEstaEnvelhecido(preco.tipoValidade, preco.extraidoEm);

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border bg-white p-3 shadow-sm ${
        ehMaisBarato ? "border-l-4 border-l-green-500" : "border-gray-200"
      } ${envelhecido ? "opacity-70" : ""}`}
    >
      <div>
        <p className="font-semibold text-gray-900">{preco.loja.nomeRaw}</p>
        <p className="text-lg font-bold text-gray-900">{formatarPrecoPorUnidade(preco.precoPorUnidadePadrao, unidadePadrao)}</p>
        <p className="text-xs text-gray-500">{formatarMoeda(preco.preco)} no total</p>
        {ehMaisBarato && (
          <span className="mt-1 inline-block rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-medium text-green-700">
            mais barato
          </span>
        )}
      </div>
      <SeloValidade tipoValidade={preco.tipoValidade} validadeFim={preco.validadeFim} extraidoEm={preco.extraidoEm} />
    </div>
  );
}
