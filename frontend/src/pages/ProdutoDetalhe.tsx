import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buscarHistorico, type PrecoResultado } from "../lib/api";
import { formatarMoeda } from "../lib/formatacao";
import { SeloValidade } from "../components/SeloValidade";
import { tempoRelativo } from "../lib/tempoRelativo";

export function ProdutoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [historico, setHistorico] = useState<PrecoResultado[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    buscarHistorico(id)
      .then(setHistorico)
      .finally(() => setCarregando(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link to="/" className="text-sm text-emerald-700">
        ← voltar para a busca
      </Link>
      <h1 className="mt-2 mb-4 text-lg font-bold text-gray-900">Onde encontrar</h1>

      {carregando && <p className="text-sm text-gray-500">Carregando...</p>}

      {!carregando && historico.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma oferta ativa no momento para este produto.</p>
      )}

      <ul className="space-y-2">
        {historico.map((preco) => (
          <li key={preco.precoId} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{preco.loja.nomeRaw}</p>
                <p className="text-sm text-gray-700">{formatarMoeda(preco.preco)}</p>
                <p className="text-xs text-gray-500">extraído {tempoRelativo(preco.extraidoEm)}</p>
              </div>
              <SeloValidade tipoValidade={preco.tipoValidade} validadeFim={preco.validadeFim} extraidoEm={preco.extraidoEm} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
