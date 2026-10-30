import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  carregarManifestoPanfletos,
  listarLojas,
  urlPaginaPanfleto,
  type Loja,
  type ManifestoPanfletos,
  type PanfletoAtual,
} from "../lib/api";
import { formatarDataCurta } from "../lib/tempoRelativo";

// Segunda forma de navegar no dashboard: por mercado, já que cada panfleto descreve os
// mesmos itens com grafia um pouco diferente — ver tudo por loja ajuda a comparar mesmo
// antes da revisão manual unificar os produtos. Só entram mercados com panfleto válido agora:
// os demais cairiam numa página vazia ("nenhuma promoção válida").
export function LojaList() {
  const [lojas, setLojas] = useState<Loja[] | null>(null);
  const [manifesto, setManifesto] = useState<ManifestoPanfletos>({});

  useEffect(() => {
    listarLojas({ apenasComPanfletoAtual: true }).then(setLojas);
    // Sem o manifesto a lista funciona igual, só não oferece o panfleto original.
    carregarManifestoPanfletos().then(setManifesto, () => {});
  }, []);

  if (lojas === null) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Mercados com panfleto válido</h2>
      {lojas.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum mercado com panfleto válido no momento.</p>
      )}
      <div className="space-y-2">
        {lojas.map((loja) => {
          const panfletos = loja.panfletosAtuais.filter((p) => p.arquivoJson && manifesto[p.arquivoJson]);
          return (
            <div key={loja.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <Link to={`/lojas/${loja.id}`} className="flex items-center gap-3 p-3 active:bg-gray-50">
                <span className="text-xl">🏪</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{loja.nomeRaw}</p>
                  {loja.enderecoRaw && <p className="truncate text-xs text-gray-500">{loja.enderecoRaw}</p>}
                </div>
              </Link>
              {panfletos.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 px-3 py-2">
                  {panfletos.map((panfleto) => (
                    <PanfletoOriginal
                      key={panfleto.id}
                      panfleto={panfleto}
                      paginas={manifesto[panfleto.arquivoJson!]}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PanfletoOriginal({ panfleto, paginas }: { panfleto: PanfletoAtual; paginas: string[] }) {
  const [aberto, setAberto] = useState(false);
  const validade =
    panfleto.tipoValidade === "DATA_DEFINIDA" && panfleto.validadeFim
      ? `até ${formatarDataCurta(panfleto.validadeFim)}`
      : "enquanto durar o estoque";

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center justify-between text-left text-xs text-blue-700"
      >
        <span>
          📄 Panfleto original ({paginas.length} {paginas.length === 1 ? "página" : "páginas"}, {validade})
        </span>
        <span>{aberto ? "ocultar" : "ver"}</span>
      </button>
      {aberto && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {paginas.map((pagina, i) => {
            const url = urlPaginaPanfleto(panfleto.arquivoJson!, pagina);
            const nomeDownload = `${panfleto.arquivoJson!.replace(/\.json$/, "")}-${pagina}`;
            return (
              <div key={pagina} className="text-center">
                <a href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt={`Página ${i + 1} do panfleto`}
                    loading="lazy"
                    className="aspect-[4/5] w-full rounded border border-gray-200 object-cover"
                  />
                </a>
                <a href={url} download={nomeDownload} className="mt-1 inline-block text-xs text-blue-700">
                  ⬇ baixar
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
