import { PromocaoLojaCard } from "./PromocaoLojaCard";
import type { ProdutoComPrecos, PromocaoLoja } from "../lib/api";

interface GrupoLoja {
  lojaId: string;
  nomeRaw: string;
  itens: PromocaoLoja[];
}

function agruparPorLoja(produtos: ProdutoComPrecos[]): GrupoLoja[] {
  const grupos = new Map<string, GrupoLoja>();
  for (const produto of produtos) {
    for (const preco of produto.precos) {
      const grupo = grupos.get(preco.loja.id) ?? { lojaId: preco.loja.id, nomeRaw: preco.loja.nomeRaw, itens: [] };
      grupo.itens.push({
        precoId: preco.precoId,
        produtoCanonicoId: produto.produtoCanonicoId,
        nomeCanonico: produto.nomeCanonico,
        marca: produto.marca,
        categoria: produto.categoria,
        preco: preco.preco,
        precoPorUnidadePadrao: preco.precoPorUnidadePadrao,
        unidadePadrao: produto.unidadePadrao,
        tipoValidade: preco.tipoValidade,
        validadeInicio: preco.validadeInicio,
        validadeFim: preco.validadeFim,
        extraidoEm: preco.extraidoEm,
      });
      grupos.set(preco.loja.id, grupo);
    }
  }

  for (const grupo of grupos.values()) {
    grupo.itens.sort((a, b) => a.nomeCanonico.localeCompare(b.nomeCanonico));
  }
  return [...grupos.values()].sort((a, b) => a.nomeRaw.localeCompare(b.nomeRaw));
}

interface ResultadosPorLojaProps {
  produtos: ProdutoComPrecos[];
}

// Mesmos dados da visão "menor preço" (ResultadosProdutos), só reorganizados: agrupados por
// supermercado em vez de por produto — útil para quem já decidiu em qual mercado comprar e quer
// ver tudo que ele tem de oferta nesta categoria.
export function ResultadosPorLoja({ produtos }: ResultadosPorLojaProps) {
  const grupos = agruparPorLoja(produtos);

  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <section key={grupo.lojaId}>
          <h2 className="text-sm font-semibold text-gray-700">🏪 {grupo.nomeRaw}</h2>
          <div className="mt-2 space-y-2">
            {grupo.itens.map((item) => (
              <PromocaoLojaCard key={item.precoId} promocao={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
