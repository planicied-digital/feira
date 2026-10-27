import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SeloPanfletoVencido } from "../components/SeloPanfletoVencido";
import { buscarRankingMercados, type RankingLoja, type RankingMercados } from "../lib/api";

const JANELAS = [30, 90, 365] as const;

function LinhaRanking({ item, posicao }: { item: RankingLoja; posicao: number | null }) {
  return (
    <Link
      to={`/lojas/${item.loja.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:bg-gray-50"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium text-gray-900">
          {posicao !== null && <span className="mr-1 text-gray-400">{posicao}º</span>}
          {item.loja.nomeRaw}
        </p>
        <p className="shrink-0 text-sm font-bold text-gray-900">{item.percentual.toLocaleString("pt-BR")}%</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.percentual}%` }} />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
        <p className="text-xs text-gray-500">
          mais barato em {item.vitorias} de {item.comparacoes} {item.comparacoes === 1 ? "comparação" : "comparações"}
        </p>
        <SeloPanfletoVencido situacao={item.loja} />
      </div>
    </Link>
  );
}

export function Ranking() {
  const [dias, setDias] = useState<number>(90);
  const [ranking, setRanking] = useState<RankingMercados | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    buscarRankingMercados(dias)
      .then(setRanking)
      .finally(() => setCarregando(false));
  }, [dias]);

  const comDados = ranking?.lojas.filter((l) => l.dadosSuficientes) ?? [];
  const poucosDados = ranking?.lojas.filter((l) => !l.dadosSuficientes) ?? [];

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link to="/" className="text-sm text-emerald-700">
        ← voltar
      </Link>
      <h1 className="mt-2 text-lg font-bold text-gray-900">🏆 Ranking de mercados</h1>
      <p className="mt-1 text-xs text-gray-500">
        Em cada produto anunciado por 2 ou mais mercados na mesma semana, ganha quem tem o menor preço por kg, litro
        ou unidade. A porcentagem é quantas vezes cada mercado foi o mais barato.
      </p>

      <div className="mt-3 flex gap-2">
        {JANELAS.map((j) => (
          <button
            key={j}
            onClick={() => setDias(j)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              dias === j ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {j === 365 ? "último ano" : `${j} dias`}
          </button>
        ))}
      </div>

      {carregando && <p className="mt-4 text-sm text-gray-500">Calculando...</p>}

      {!carregando && ranking && ranking.comparacoes === 0 && (
        <p className="mt-4 text-sm text-gray-500">
          Nenhum produto foi anunciado por dois mercados na mesma semana nesse período. Tente uma janela maior.
        </p>
      )}

      {!carregando && ranking && ranking.comparacoes > 0 && (
        <>
          <p className="mt-4 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
            Baseado em {ranking.comparacoes} {ranking.comparacoes === 1 ? "comparação" : "comparações"} de{" "}
            {ranking.produtos} {ranking.produtos === 1 ? "produto" : "produtos"}. Com poucos panfletos por mercado, a
            posição pode mudar bastante a cada nova importação.
            {ranking.lojas.some((l) => !l.loja.panfletoAtual) &&
              " Mercados com “panfleto vencido” não têm ofertas valendo agora — a posição deles vem de preços antigos."}
          </p>

          <div className="mt-3 space-y-2">
            {comDados.map((item, i) => (
              <LinhaRanking key={item.loja.id} item={item} posicao={i + 1} />
            ))}
          </div>

          {poucosDados.length > 0 && (
            <>
              <h2 className="mt-6 mb-1 text-sm font-semibold text-gray-700">Poucos dados</h2>
              <p className="mb-2 text-xs text-gray-500">
                Menos de {ranking.minComparacoes} comparações — ainda não dá pra colocar no ranking.
              </p>
              <div className="space-y-2">
                {poucosDados.map((item) => (
                  <LinhaRanking key={item.loja.id} item={item} posicao={null} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
