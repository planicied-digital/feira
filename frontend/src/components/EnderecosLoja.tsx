import { dividirEnderecos, linkGoogleMaps } from "../lib/enderecos";

interface EnderecosLojaProps {
  enderecoRaw: string;
}

export function EnderecosLoja({ enderecoRaw }: EnderecosLojaProps) {
  const enderecos = dividirEnderecos(enderecoRaw);

  return (
    <div className="mb-4 space-y-1">
      {enderecos.map((item, index) => (
        <div key={index} className="flex flex-wrap items-baseline gap-x-2 text-xs text-gray-500">
          <span>
            {item.rotulo && <span className="font-medium text-gray-600">{item.rotulo}: </span>}
            {item.endereco}
          </span>
          <a
            href={linkGoogleMaps(item.endereco)}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap text-emerald-700 underline"
          >
            ver no mapa ↗
          </a>
        </div>
      ))}
    </div>
  );
}
