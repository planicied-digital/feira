import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EnderecosLoja } from "../components/EnderecosLoja";
import { PromocaoLojaCard } from "../components/PromocaoLojaCard";
import { listarLojas, listarPromocoesPorLoja, type Loja, type PromocaoLoja } from "../lib/api";

export function LojaPagina() {
  const { id } = useParams<{ id: string }>();
  const [loja, setLoja] = useState<Loja | null>(null);
  const [promocoes, setPromocoes] = useState<PromocaoLoja[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    Promise.all([listarLojas(), listarPromocoesPorLoja(id)])
      .then(([lojas, resultado]) => {
        setLoja(lojas.find((l) => l.id === id) ?? null);
        setPromocoes(resultado);
      })
      .finally(() => setCarregando(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link to="/" className="text-sm text-emerald-700">
        ← voltar
      </Link>
      <h1 className="mt-2 mb-2 text-lg font-bold text-gray-900">🏪 {loja?.nomeRaw ?? "Mercado"}</h1>
      {loja?.enderecoRaw && <EnderecosLoja enderecoRaw={loja.enderecoRaw} />}

      {carregando && <p className="mt-4 text-sm text-gray-500">Carregando...</p>}
      {!carregando && promocoes.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">Nenhuma promoção válida deste mercado no momento.</p>
      )}

      <div className="mt-4 space-y-2">
        {promocoes.map((promocao) => (
          <PromocaoLojaCard key={promocao.precoId} promocao={promocao} />
        ))}
      </div>
    </div>
  );
}
