import { useState, type FormEvent } from "react";
import { ErroApi, entrarAdmin } from "../../lib/api";

export function LoginAdmin({ aoEntrar }: { aoEntrar: () => void }) {
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await entrarAdmin(senha);
      aoEntrar();
    } catch (e) {
      setErro(e instanceof ErroApi && e.status === 401 ? "Senha incorreta." : "Não foi possível entrar agora.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <label htmlFor="senha-admin" className="mb-1 block text-sm font-medium text-gray-700">
        Senha de administrador
      </label>
      <input
        id="senha-admin"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
      />
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
      <button
        type="submit"
        disabled={enviando || senha.length === 0}
        className="mt-3 w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
