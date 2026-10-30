import { Link } from "react-router-dom";
import type { ProdutoComPrecos } from "../lib/api";
import { calcularFaixaPreco } from "../lib/faixaPreco";
import { formatarMoeda, formatarPrecoPorUnidade } from "../lib/formatacao";

interface ResumoProdutoCardProps {
  produto: ProdutoComPrecos;
  // O banco ainda não tem foto de produto; quando tiver, basta passar aqui.
  imagemUrl?: string;
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palavra) => palavra[0]!.toUpperCase())
    .join("");
}

// Cabeçalho de cada produto na busca e na categoria: a faixa "DE / ATÉ" entre os mercados e
// quanto dá pra economizar escolhendo o mais barato. Os cards de cada mercado vêm logo abaixo.
export function ResumoProdutoCard({ produto, imagemUrl }: ResumoProdutoCardProps) {
  const faixa = calcularFaixaPreco(produto.precos);
  const formatar = (valor: number) =>
    faixa?.base === "porUnidade" ? formatarPrecoPorUnidade(valor, produto.unidadePadrao) : formatarMoeda(valor);
  const mostrarAte = faixa !== null && faixa.economia !== null;

  return (
    <Link
      to={`/produtos/${produto.produtoCanonicoId}`}
      className="block rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:bg-gray-50"
    >
      <div className="flex gap-3">
        {imagemUrl ? (
          <img src={imagemUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-contain" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl text-gray-500">
            {produto.categoria.icone ?? <span className="text-base font-semibold">{iniciais(produto.nomeCanonico)}</span>}
          </div>
        )}
        <div className="min-w-0">
          <p className="line-clamp-3 font-semibold text-gray-900">{produto.nomeCanonico}</p>
          {produto.marca && <p className="text-sm text-gray-500">{produto.marca}</p>}
        </div>
      </div>

      {faixa && (
        <>
          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
            <div className="flex items-baseline gap-2 rounded-xl bg-gray-100 px-3 py-2">
              {mostrarAte && <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">De:</span>}
              <span className="text-2xl font-bold text-gray-900">{formatar(faixa.menor)}</span>
            </div>
            {mostrarAte && (
              <div className="flex items-baseline gap-2 pb-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Até:</span>
                <span className="font-semibold text-red-700">{formatar(faixa.maior)}</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            em {faixa.quantidadeMercados} {faixa.quantidadeMercados === 1 ? "mercado" : "mercados"}
          </p>
          {faixa.economia && (
            <span className="mt-2 inline-block rounded-full bg-destaque-100 px-2.5 py-0.5 text-xs font-medium text-destaque-800">
              Economize até {formatar(faixa.economia.valor)} ({faixa.economia.percentual}%)
            </span>
          )}
        </>
      )}
    </Link>
  );
}
