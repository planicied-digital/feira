import { Link } from "react-router-dom";
import { PrecoCard } from "./PrecoCard";
import type { ProdutoComPrecos, TipoValidade } from "../lib/api";

function temPrecoComDataDefinida(precos: { tipoValidade: TipoValidade }[]): boolean {
  return precos.some((p) => p.tipoValidade === "DATA_DEFINIDA");
}

interface ResultadosProdutosProps {
  produtos: ProdutoComPrecos[];
}

// Compartilhado pela busca por texto e pela navegação por categoria — mesmo ranking por
// preço por unidade padrão, mesmos selos de validade, mesmo destaque de "mais barato".
export function ResultadosProdutos({ produtos }: ResultadosProdutosProps) {
  return (
    <div className="space-y-6">
      {produtos.map((produto) => (
        <section key={produto.produtoCanonicoId}>
          <Link to={`/produtos/${produto.produtoCanonicoId}`} className="block">
            <h2 className="text-sm font-semibold text-gray-700">
              {produto.nomeCanonico}
              {produto.marca ? ` · ${produto.marca}` : ""}
            </h2>
          </Link>
          {!temPrecoComDataDefinida(produto.precos) && (
            <p className="mb-2 mt-1 text-xs text-amber-700">
              Nenhuma promoção com data definida — confira a atualização em cada card abaixo.
            </p>
          )}
          <div className="mt-2 space-y-2">
            {produto.precos.map((preco, index) => (
              <PrecoCard
                key={preco.precoId}
                preco={preco}
                unidadePadrao={produto.unidadePadrao}
                ehMaisBarato={index === 0}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
