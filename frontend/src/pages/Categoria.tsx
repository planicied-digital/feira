import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BuscaInput } from "../components/BuscaInput";
import { ResultadosProdutos } from "../components/ResultadosProdutos";
import { listarCategorias, listarProdutosPorCategoria, type Categoria, type ProdutoComPrecos } from "../lib/api";

export function CategoriaPagina() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [produtos, setProdutos] = useState<ProdutoComPrecos[]>([]);
  const [carregando, setCarregando] = useState(true);

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

      <div className="mt-4">
        <ResultadosProdutos produtos={produtos} />
      </div>
    </div>
  );
}
