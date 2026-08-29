import { useEffect, useState } from "react";
import { aceitarSugestao, listarSugestoesFusao, rejeitarSugestao, type SugestaoFusao } from "../../lib/api";

export function RevisaoPendentes() {
  const [sugestoes, setSugestoes] = useState<SugestaoFusao[]>([]);
  const [carregando, setCarregando] = useState(true);

  function recarregar() {
    setCarregando(true);
    listarSugestoesFusao()
      .then(setSugestoes)
      .finally(() => setCarregando(false));
  }

  useEffect(recarregar, []);

  async function tratar(id: string, acao: "aceitar" | "rejeitar") {
    const executar = acao === "aceitar" ? aceitarSugestao : rejeitarSugestao;
    await executar(id);
    recarregar();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-lg font-bold text-gray-900">Revisão de possíveis produtos duplicados</h1>

      {carregando && <p className="text-sm text-gray-500">Carregando...</p>}
      {!carregando && sugestoes.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma sugestão pendente.</p>
      )}

      <ul className="space-y-3">
        {sugestoes.map((s) => (
          <li key={s.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-sm text-gray-700">
              <strong>{s.produtoOrigem.nomeCanonico}</strong>
              {s.produtoOrigem.marca ? ` (${s.produtoOrigem.marca})` : ""} pode ser o mesmo produto que{" "}
              <strong>{s.produtoDestino.nomeCanonico}</strong>
              {s.produtoDestino.marca ? ` (${s.produtoDestino.marca})` : ""}?
            </p>
            <p className="mt-1 text-xs text-gray-500">similaridade: {(s.score * 100).toFixed(0)}%</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => tratar(s.id, "aceitar")}
                className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                É o mesmo produto
              </button>
              <button
                onClick={() => tratar(s.id, "rejeitar")}
                className="rounded bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800"
              >
                São diferentes
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
