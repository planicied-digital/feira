import { useState } from "react";
import { Link } from "react-router-dom";
import { compararListaCompras, type ResultadoListaCompras } from "../lib/api";
import { formatarMoeda } from "../lib/formatacao";

function dividirItens(texto: string): string[] {
  return texto
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ListaCompras() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<ResultadoListaCompras | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function comparar() {
    const itens = dividirItens(texto);
    if (itens.length === 0) return;
    setCarregando(true);
    setErro(null);
    try {
      setResultado(await compararListaCompras(itens));
    } catch {
      setErro("Não foi possível comparar a lista agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link to="/" className="text-sm text-blue-600">
        ← voltar
      </Link>
      <h1 className="mb-1 mt-2 text-xl font-bold text-gray-900">Lista de compras</h1>
      <p className="mb-4 text-sm text-gray-500">
        Digite os itens separados por vírgula ou um por linha. Não salvamos nada — a lista some ao sair da página.
      </p>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={"arroz, feijão, óleo, sabão em pó"}
        rows={4}
        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
      />
      <button
        onClick={comparar}
        disabled={carregando || dividirItens(texto).length === 0}
        className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
      >
        {carregando ? "Comparando..." : "Comparar"}
      </button>

      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

      {resultado && (
        <div className="mt-6 space-y-6">
          {resultado.itensNaoEncontrados.length > 0 && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Não encontramos oferta ativa para: {resultado.itensNaoEncontrados.join(", ")}.
            </p>
          )}

          {resultado.itensEncontrados.length === 0 && resultado.itensNaoEncontrados.length > 0 && (
            <p className="text-sm text-gray-500">Nenhum item da lista foi encontrado.</p>
          )}

          {resultado.totalDividido && (
            <section className="rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700">Dividindo entre mercados</h2>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatarMoeda(resultado.totalDividido.total)}</p>
              <p className="text-xs text-gray-500">comprando cada item onde ele sai mais barato</p>
              <div className="mt-3 space-y-2">
                {resultado.totalDividido.porLoja.map((loja) => (
                  <div key={loja.lojaId} className="text-sm">
                    <p className="font-medium text-gray-800">
                      {loja.nomeRaw} — {formatarMoeda(loja.total)}
                    </p>
                    <ul className="ml-4 list-disc text-xs text-gray-500">
                      {loja.itens.map((item) => (
                        <li key={item.termoBuscado}>
                          {item.nomeCanonico} ({formatarMoeda(item.preco)})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {resultado.totalUnicoMercado ? (
            <section className="rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700">Comprando tudo em um mercado</h2>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatarMoeda(resultado.totalUnicoMercado.total)}</p>
              <p className="text-xs text-gray-500">mais barato: {resultado.totalUnicoMercado.nomeRaw}</p>
            </section>
          ) : (
            resultado.itensEncontrados.length > 0 && (
              <p className="text-sm text-gray-500">
                Nenhum mercado tem oferta ativa para todos os itens encontrados ao mesmo tempo — por isso só
                mostramos a opção dividida entre mercados.
              </p>
            )
          )}

          {resultado.economia !== null && resultado.economia > 0 && (
            <p className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-800">
              Dividindo entre mercados você economiza {formatarMoeda(resultado.economia)} em relação a comprar tudo
              num só lugar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
