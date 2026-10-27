import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  compararMercados,
  listarLojas,
  type ComparacaoMercados,
  type ItemComparacao,
  type Loja,
  type PrecoLado,
  type UnidadePadrao,
} from "../lib/api";
import { formatarMoeda, formatarPrecoPorUnidade } from "../lib/formatacao";

const JANELAS = [30, 90, 365] as const;

function Lado({ preco, unidade, vencedor }: { preco: PrecoLado; unidade: UnidadePadrao; vencedor: boolean }) {
  return (
    <div className={`rounded p-2 ${vencedor ? "bg-emerald-50 ring-1 ring-emerald-500" : "bg-gray-50"}`}>
      <p className={`text-sm font-bold ${vencedor ? "text-emerald-700" : "text-gray-900"}`}>
        {formatarMoeda(preco.preco)}
      </p>
      <p className="text-xs text-gray-500">{formatarPrecoPorUnidade(preco.precoPorUnidadePadrao, unidade)}</p>
      {vencedor && <p className="mt-0.5 text-[11px] font-medium text-emerald-700">mais barato</p>}
    </div>
  );
}

function LinhaComparacao({ item }: { item: ItemComparacao }) {
  return (
    <li className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <Link to={`/produtos/${item.produto.id}`} className="text-sm font-medium text-gray-900">
        {item.produto.nomeCanonico}
      </Link>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Lado preco={item.a} unidade={item.produto.unidadePadrao} vencedor={item.maisBarato === "a"} />
        <Lado preco={item.b} unidade={item.produto.unidadePadrao} vencedor={item.maisBarato === "b"} />
      </div>
      {item.maisBarato === "empate" && <p className="mt-1 text-xs text-gray-500">mesmo preço por unidade</p>}
    </li>
  );
}

function SeletorLoja({
  rotulo,
  valor,
  lojas,
  outra,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  lojas: Loja[];
  outra: string;
  aoMudar: (id: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-gray-600">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="w-full truncate rounded border border-gray-300 bg-white px-2 py-2 text-sm"
      >
        <option value="">Escolha…</option>
        {lojas.map((l) => (
          <option key={l.id} value={l.id} disabled={l.id === outra}>
            {l.nomeRaw}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CompararMercados() {
  const [params, setParams] = useSearchParams();
  const a = params.get("a") ?? "";
  const b = params.get("b") ?? "";
  const [dias, setDias] = useState<number>(90);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [comparacao, setComparacao] = useState<ComparacaoMercados | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    listarLojas().then(setLojas);
  }, []);

  useEffect(() => {
    if (!a || !b || a === b) {
      setComparacao(null);
      return;
    }
    setCarregando(true);
    compararMercados(a, b, dias)
      .then(setComparacao)
      .finally(() => setCarregando(false));
  }, [a, b, dias]);

  // Os mercados escolhidos ficam na URL (?a=&b=) — dá pra voltar, recarregar ou mandar o link.
  function escolher(lado: "a" | "b", id: string) {
    const novos = new URLSearchParams(params);
    if (id) novos.set(lado, id);
    else novos.delete(lado);
    setParams(novos, { replace: true });
  }

  function inverter() {
    setParams(new URLSearchParams({ a: b, b: a }), { replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link to="/" className="text-sm text-emerald-700">
        ← voltar
      </Link>
      <h1 className="mt-2 text-lg font-bold text-gray-900">⚖️ Comparar dois mercados</h1>
      <p className="mt-1 text-xs text-gray-500">
        Produtos que os dois anunciaram na mesma semana, lado a lado. O mais barato é decidido pelo preço por kg, litro
        ou unidade.
      </p>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <SeletorLoja rotulo="Mercado A" valor={a} lojas={lojas} outra={b} aoMudar={(id) => escolher("a", id)} />
        <button
          onClick={inverter}
          disabled={!a || !b}
          aria-label="Inverter mercados"
          className="mb-1 rounded px-2 py-1 text-gray-500 disabled:opacity-30"
        >
          ⇄
        </button>
        <SeletorLoja rotulo="Mercado B" valor={b} lojas={lojas} outra={a} aoMudar={(id) => escolher("b", id)} />
      </div>

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

      {(!a || !b) && <p className="mt-4 text-sm text-gray-500">Escolha os dois mercados para comparar.</p>}
      {carregando && <p className="mt-4 text-sm text-gray-500">Comparando...</p>}

      {!carregando && comparacao && comparacao.itens.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">
          Esses dois mercados não anunciaram nenhum produto em comum na mesma semana nesse período.
        </p>
      )}

      {!carregando && comparacao && comparacao.itens.length > 0 && (
        <>
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              <strong>{comparacao.lojaA.nomeRaw}</strong> mais barato em <strong>{comparacao.vitoriasA}</strong>;{" "}
              <strong>{comparacao.lojaB.nomeRaw}</strong> em <strong>{comparacao.vitoriasB}</strong>
              {comparacao.empates > 0 && (
                <>
                  ; empate em <strong>{comparacao.empates}</strong>
                </>
              )}
              .
            </p>
            <p className="mt-1 text-xs text-amber-800">
              {comparacao.itens.length} {comparacao.itens.length === 1 ? "produto em comum" : "produtos em comum"}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 px-3 text-xs font-semibold text-gray-600">
            <p className="truncate">{comparacao.lojaA.nomeRaw}</p>
            <p className="truncate">{comparacao.lojaB.nomeRaw}</p>
          </div>
          <ul className="mt-1 space-y-2">
            {comparacao.itens.map((item) => (
              <LinhaComparacao key={item.produto.id} item={item} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
