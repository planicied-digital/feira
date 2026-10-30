import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BuscaInput } from "../components/BuscaInput";
import { CategoriaGrid } from "../components/CategoriaGrid";
import { LojaList } from "../components/LojaList";
import { OrdenacaoChips } from "../components/OrdenacaoChips";
import { ResultadosProdutos } from "../components/ResultadosProdutos";
import { useBuscaProdutos } from "../hooks/useBuscaProdutos";
import { lerOrdenacao, ordenarProdutos, type Ordenacao } from "../lib/ordenarProdutos";

export function Busca() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [termo, setTermo] = useState(searchParams.get("q") ?? "");
  const { produtos, carregando, erro } = useBuscaProdutos(termo);
  const buscaVazia = !termo.trim();
  const ordenacao = lerOrdenacao(searchParams.get("ordem"));
  const produtosOrdenados = useMemo(() => ordenarProdutos(produtos, ordenacao, "busca"), [produtos, ordenacao]);

  // O termo digitado não vai pra URL a cada tecla; ao escolher a ordem, grava os dois juntos pra o
  // link compartilhado/recarregado reabrir a mesma busca na mesma ordem.
  const mudarOrdenacao = (nova: Ordenacao) => {
    const params: Record<string, string> = { q: termo };
    if (nova !== "relevantes") params.ordem = nova;
    setSearchParams(params, { replace: true });
  };

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
          <Link to="/ranking" className="mt-2 block rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800">
            🏆 Ranking: qual mercado costuma ser mais barato
          </Link>
          <Link to="/comparar" className="mt-2 block rounded-lg bg-violet-50 p-3 text-sm font-medium text-violet-800">
            ⚖️ Comparar dois mercados lado a lado
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

      {!buscaVazia && produtos.length > 0 && (
        <div className="mt-4">
          <OrdenacaoChips valor={ordenacao} aoMudar={mudarOrdenacao} />
        </div>
      )}

      {!buscaVazia && (
        <div className="mt-4">
          <ResultadosProdutos produtos={produtosOrdenados} />
        </div>
      )}
    </div>
  );
}
