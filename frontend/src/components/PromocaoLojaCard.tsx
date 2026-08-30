import { Link } from "react-router-dom";
import type { PromocaoLoja } from "../lib/api";
import { formatarMoeda, formatarPrecoPorUnidade } from "../lib/formatacao";
import { precoEstaEnvelhecido, SeloValidade } from "./SeloValidade";

interface PromocaoLojaCardProps {
  promocao: PromocaoLoja;
}

// Card da visão por mercado: uma promoção por linha, sem "mais barato" (não há comparação
// entre lojas aqui — isso já é a busca/categoria). Reaproveita o mesmo SeloValidade.
export function PromocaoLojaCard({ promocao }: PromocaoLojaCardProps) {
  const envelhecido = precoEstaEnvelhecido(promocao.tipoValidade, promocao.extraidoEm);

  return (
    <Link
      to={`/produtos/${promocao.produtoCanonicoId}`}
      className={`flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${
        envelhecido ? "opacity-70" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">
          {promocao.nomeCanonico}
          {promocao.marca ? ` · ${promocao.marca}` : ""}
        </p>
        <p className="text-lg font-bold text-gray-900">{formatarMoeda(promocao.preco)}</p>
        <p className="text-xs text-gray-500">
          {formatarPrecoPorUnidade(promocao.precoPorUnidadePadrao, promocao.unidadePadrao)}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400">{promocao.categoria.nome}</p>
      </div>
      <SeloValidade
        tipoValidade={promocao.tipoValidade}
        validadeFim={promocao.validadeFim}
        extraidoEm={promocao.extraidoEm}
      />
    </Link>
  );
}
