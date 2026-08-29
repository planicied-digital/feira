import { useEffect, useState } from "react";
import { buscarProdutos, type ProdutoComPrecos } from "../lib/api";

const DEBOUNCE_MS = 300;

export function useBuscaProdutos(termo: string) {
  const [produtos, setProdutos] = useState<ProdutoComPrecos[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const termoLimpo = termo.trim();
    if (!termoLimpo) {
      setProdutos([]);
      setErro(null);
      return;
    }

    setCarregando(true);
    const timeoutId = setTimeout(() => {
      buscarProdutos(termoLimpo)
        .then((resultado) => {
          setProdutos(resultado);
          setErro(null);
        })
        .catch(() => setErro("Não foi possível buscar os preços agora. Tente novamente."))
        .finally(() => setCarregando(false));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [termo]);

  return { produtos, carregando, erro };
}
