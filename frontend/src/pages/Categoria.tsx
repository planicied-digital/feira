import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BuscaInput } from "../components/BuscaInput";
import { OrdenacaoChips } from "../components/OrdenacaoChips";
import { ResultadosProdutos } from "../components/ResultadosProdutos";
import { ResultadosPorLoja } from "../components/ResultadosPorLoja";
import { listarCategorias, listarProdutosPorCategoria, type Categoria, type ProdutoComPrecos } from "../lib/api";
import { lerOrdenacao, ORDENACAO_PADRAO, ordenarProdutos, type Ordenacao } from "../lib/ordenarProdutos";

type Visualizacao = "produto" | "supermercado";

export function CategoriaPagina() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [produtos, setProdutos] = useState<ProdutoComPrecos[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [visualizacao, setVisualizacao] = useState<Visualizacao>("produto");
  const [searchParams, setSearchParams] = useSearchParams();
  const ordenacao = lerOrdenacao(searchParams.get("ordem"));
  const produtosOrdenados = useMemo(() => ordenarProdutos(produtos, ordenacao), [produtos, ordenacao]);

  const mudarOrdenacao = (nova: Ordenacao) =>
    setSearchParams(nova === ORDENACAO_PADRAO ? {} : { ordem: nova }, { replace: true });

  useEffect(() => {
    if (!slug) return;
    setCarregando(true);
    Promise.all([listarCategorias(), listarProdutosPorCategoria(slug)])
      .then(([categorias, resultado]) => {
        setCategoria(categorias.find((c) => c.slug === slug) ?? null);
        setProdutos(resultado);
      })
      .finally(() => setCarregando(false));
  }, [slug]);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link to="/" className="text-sm text-emerald-700">
        ← voltar
      </Link>
      <h1 className="mt-2 mb-4 text-lg font-bold text-gray-900">
        {categoria ? `${categoria.icone ?? ""} ${categoria.nome}` : "Categoria"}
      </h1>

      <BuscaInput
        valor=""
        aoMudar={(termo) => {
          if (termo.trim()) navigate(`/?q=${encodeURIComponent(termo)}`);
        }}
      />

      {carregando && <p className="mt-4 text-sm text-gray-500">Carregando...</p>}
      {!carregando && produtos.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">Nenhum produto encontrado nesta categoria ainda.</p>
      )}

      {!carregando && produtos.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <span>Ver por:</span>
          <div className="inline-flex overflow-hidden rounded-md border border-gray-200">
            {(["produto", "supermercado"] as const).map((opcao) => (
              <button
                key={opcao}
                type="button"
                aria-pressed={visualizacao === opcao}
                onClick={() => setVisualizacao(opcao)}
                className={`px-2.5 py-1 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 ${
                  visualizacao === opcao ? "bg-emerald-600 text-white" : "bg-white text-gray-600"
                }`}
              >
                {opcao === "produto" ? "Produto" : "Supermercado"}
              </button>
            ))}
          </div>
        </div>
      )}

      {!carregando && produtos.length > 0 && visualizacao === "produto" && (
        <div className="mt-3">
          <OrdenacaoChips valor={ordenacao} aoMudar={mudarOrdenacao} />
        </div>
      )}

      <div className="mt-4">
        {visualizacao === "produto" ? (
          <ResultadosProdutos produtos={produtosOrdenados} />
        ) : (
          <ResultadosPorLoja produtos={produtos} />
        )}
      </div>
    </div>
  );
}
