import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BuscaInput } from "../components/BuscaInput";
import { ResultadosProdutos } from "../components/ResultadosProdutos";
import { ResultadosPorLoja } from "../components/ResultadosPorLoja";
import { listarCategorias, listarProdutosPorCategoria, type Categoria, type ProdutoComPrecos } from "../lib/api";

type Ordenacao = "preco" | "loja";

export function CategoriaPagina() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [produtos, setProdutos] = useState<ProdutoComPrecos[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("preco");

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
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setOrdenacao("preco")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              ordenacao === "preco" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Menor preço
          </button>
          <button
            onClick={() => setOrdenacao("loja")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              ordenacao === "loja" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Supermercado
          </button>
        </div>
      )}

      <div className="mt-4">
        {ordenacao === "preco" ? <ResultadosProdutos produtos={produtos} /> : <ResultadosPorLoja produtos={produtos} />}
      </div>
    </div>
  );
}
