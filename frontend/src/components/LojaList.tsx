import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarLojas, type Loja } from "../lib/api";

// Segunda forma de navegar no dashboard: por mercado, já que cada panfleto descreve os
// mesmos itens com grafia um pouco diferente — ver tudo por loja ajuda a comparar mesmo
// antes da revisão manual unificar os produtos.
export function LojaList() {
  const [lojas, setLojas] = useState<Loja[]>([]);

  useEffect(() => {
    listarLojas().then(setLojas);
  }, []);

  if (lojas.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Mercados</h2>
      <div className="space-y-2">
        {lojas.map((loja) => (
          <Link
            key={loja.id}
            to={`/lojas/${loja.id}`}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:bg-gray-50"
          >
            <span className="text-xl">🏪</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{loja.nomeRaw}</p>
              {loja.enderecoRaw && <p className="truncate text-xs text-gray-500">{loja.enderecoRaw}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
