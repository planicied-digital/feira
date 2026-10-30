import { PrecoCard } from "./PrecoCard";
import { ResumoProdutoCard } from "./ResumoProdutoCard";
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
          <ResumoProdutoCard produto={produto} />
          {!temPrecoComDataDefinida(produto.precos) && (
            <p className="mb-2 mt-2 text-xs text-destaque-700">
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
