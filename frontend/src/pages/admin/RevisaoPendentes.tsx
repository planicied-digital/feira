import { useEffect, useState } from "react";
import {
  ErroApi,
  aceitarSugestao,
  listarSugestoesFusao,
  rejeitarSugestao,
  sairAdmin,
  type SugestaoFusao,
} from "../../lib/api";
import { LoginAdmin } from "./LoginAdmin";

type Acesso = "verificando" | "liberado" | "login" | "desabilitado";

export function RevisaoPendentes() {
  const [sugestoes, setSugestoes] = useState<SugestaoFusao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [acesso, setAcesso] = useState<Acesso>("verificando");

  // 401 = sessão ausente/expirada → pede a senha; 503 = admin desligado no servidor (produção sem
  // ADMIN_PASSWORD). Vale tanto pra listagem quanto pras ações.
  function tratarErro(erro: unknown) {
    if (erro instanceof ErroApi && erro.status === 401) {
      sairAdmin();
      setAcesso("login");
    } else if (erro instanceof ErroApi && erro.status === 503) {
      setAcesso("desabilitado");
    } else {
      throw erro;
    }
  }

  function recarregar() {
    setCarregando(true);
    listarSugestoesFusao()
      .then((lista) => {
        setSugestoes(lista);
        setAcesso("liberado");
      })
      .catch(tratarErro)
      .finally(() => setCarregando(false));
  }

  useEffect(recarregar, []);

  async function tratar(id: string, acao: "aceitar" | "rejeitar") {
    const executar = acao === "aceitar" ? aceitarSugestao : rejeitarSugestao;
    try {
      await executar(id);
      recarregar();
    } catch (erro) {
      tratarErro(erro);
    }
  }

  function sair() {
    sairAdmin();
    setSugestoes([]);
    setAcesso("login");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-start justify-between gap-2">
        <h1 className="text-lg font-bold text-gray-900">Revisão de possíveis produtos duplicados</h1>
        {acesso === "liberado" && (
          <button onClick={sair} className="shrink-0 text-xs text-gray-500 underline">
            Sair
          </button>
        )}
      </div>

      {acesso === "login" && <LoginAdmin aoEntrar={recarregar} />}
      {acesso === "desabilitado" && (
        <p className="text-sm text-gray-500">A área de administração está desabilitada neste servidor.</p>
      )}

      {acesso !== "login" && acesso !== "desabilitado" && carregando && (
        <p className="text-sm text-gray-500">Carregando...</p>
      )}
      {acesso === "liberado" && !carregando && sugestoes.length === 0 && (
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
                className="rounded bg-primaria-600 px-3 py-1.5 text-xs font-medium text-white"
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
