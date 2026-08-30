import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BuscaInput } from "../components/BuscaInput";
import { CategoriaGrid } from "../components/CategoriaGrid";
import { LojaList } from "../components/LojaList";
import { ResultadosProdutos } from "../components/ResultadosProdutos";
import { useBuscaProdutos } from "../hooks/useBuscaProdutos";

export function Busca() {
  const [searchParams] = useSearchParams();
  const [termo, setTermo] = useState(searchParams.get("q") ?? "");
  const { produtos, carregando, erro } = useBuscaProdutos(termo);
  const buscaVazia = !termo.trim();

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-gray-900">feira — compare preços</h1>
      <BuscaInput valor={termo} aoMudar={setTermo} />

      {buscaVazia && (
        <>
          <Link
            to="/lista-compras"
            className="mt-4 block rounded-lg bg-blue-50 p-3 text-sm font-medium text-blue-700"
          >
            🛒 Montar lista de compras e comparar mercados
          </Link>
          <CategoriaGrid />
          <LojaList />
        </>
      )}

      {carregando && <p className="mt-4 text-sm text-gray-500">Buscando...</p>}
      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

      {!carregando && !buscaVazia && produtos.length === 0 && !erro && (
        <p className="mt-4 text-sm text-gray-500">Nenhum resultado para "{termo}".</p>
      )}

      {!buscaVazia && (
        <div className="mt-4">
          <ResultadosProdutos produtos={produtos} />
        </div>
      )}
    </div>
  );
}
