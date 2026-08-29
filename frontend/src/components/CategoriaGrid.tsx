import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarCategorias, type Categoria } from "../lib/api";

// Dashboard inicial: navegação por categoria fixa para quem não sabe o nome exato do item.
export function CategoriaGrid() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    listarCategorias().then(setCategorias);
  }, []);

  if (categorias.length === 0) return null;

  return (
    <div className="mt-4">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Categorias</h2>
      <div className="grid grid-cols-3 gap-2">
        {categorias.map((categoria) => (
          <Link
            key={categoria.id}
            to={`/categorias/${categoria.slug}`}
            className="flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white p-3 text-center shadow-sm active:bg-gray-50"
          >
            <span className="text-2xl">{categoria.icone ?? "🛒"}</span>
            <span className="text-xs font-medium text-gray-700">{categoria.nome}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
