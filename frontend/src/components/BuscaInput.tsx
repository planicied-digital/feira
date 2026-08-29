interface BuscaInputProps {
  valor: string;
  aoMudar: (valor: string) => void;
}

export function BuscaInput({ valor, aoMudar }: BuscaInputProps) {
  return (
    <input
      type="search"
      inputMode="search"
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      placeholder="Buscar item (ex.: arroz, feijão, leite...)"
      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      autoFocus
    />
  );
}
