import { TipoValidade } from "@prisma/client";
import { buscarProdutos } from "../precos/precos.service.js";

export interface ItemListaEncontrado {
  termoBuscado: string;
  produtoCanonicoId: string;
  nomeCanonico: string;
  marca: string | null;
  categoria: { nome: string; slug: string; icone: string | null };
  unidadePadrao: string;
  precosPorLoja: {
    lojaId: string;
    nomeRaw: string;
    preco: number;
    tipoValidade: TipoValidade;
    validadeFim: string | null;
  }[];
}

export interface TotalPorLoja {
  lojaId: string;
  nomeRaw: string;
  total: number;
  itens: { termoBuscado: string; nomeCanonico: string; preco: number }[];
}

export interface ResultadoListaCompras {
  itensEncontrados: ItemListaEncontrado[];
  itensNaoEncontrados: string[];
  totalDividido: { total: number; porLoja: TotalPorLoja[] } | null;
  totalUnicoMercado: TotalPorLoja | null;
  economia: number | null;
}

// Para cada termo buscado, reaproveita a mesma busca por nome (trigram + regra de validade) já
// usada na tela de busca — pega o produto de menor preço por unidade entre os candidatos com nome
// parecido, e dedupe por loja mantendo a oferta mais barata de cada uma.
async function buscarMelhorCorrespondencia(termo: string): Promise<ItemListaEncontrado | null> {
  const produtos = await buscarProdutos(termo);
  const melhor = produtos[0];
  if (!melhor) return null;

  const precosPorLoja: ItemListaEncontrado["precosPorLoja"] = [];
  const lojasVistas = new Set<string>();
  for (const preco of melhor.precos) {
    if (lojasVistas.has(preco.loja.id)) continue;
    lojasVistas.add(preco.loja.id);
    precosPorLoja.push({
      lojaId: preco.loja.id,
      nomeRaw: preco.loja.nomeRaw,
      preco: preco.preco,
      tipoValidade: preco.tipoValidade,
      validadeFim: preco.validadeFim,
    });
  }

  return {
    termoBuscado: termo,
    produtoCanonicoId: melhor.produtoCanonicoId,
    nomeCanonico: melhor.nomeCanonico,
    marca: melhor.marca,
    categoria: melhor.categoria,
    unidadePadrao: melhor.unidadePadrao,
    precosPorLoja,
  };
}

export async function compararListaCompras(itens: string[]): Promise<ResultadoListaCompras> {
  const termos = itens.map((t) => t.trim()).filter(Boolean);
  const resultados = await Promise.all(termos.map(buscarMelhorCorrespondencia));

  const itensEncontrados: ItemListaEncontrado[] = [];
  const itensNaoEncontrados: string[] = [];
  termos.forEach((termo, index) => {
    const resultado = resultados[index];
    if (resultado) itensEncontrados.push(resultado);
    else itensNaoEncontrados.push(termo);
  });

  if (itensEncontrados.length === 0) {
    return { itensEncontrados, itensNaoEncontrados, totalDividido: null, totalUnicoMercado: null, economia: null };
  }

  // Dividido: cada item no mercado onde ele sai mais barato, independente dos outros itens.
  const porLojaDividido = new Map<string, TotalPorLoja>();
  for (const item of itensEncontrados) {
    const maisBarato = item.precosPorLoja[0];
    if (!maisBarato) continue;
    const entrada = porLojaDividido.get(maisBarato.lojaId) ?? {
      lojaId: maisBarato.lojaId,
      nomeRaw: maisBarato.nomeRaw,
      total: 0,
      itens: [],
    };
    entrada.total += maisBarato.preco;
    entrada.itens.push({ termoBuscado: item.termoBuscado, nomeCanonico: item.nomeCanonico, preco: maisBarato.preco });
    porLojaDividido.set(maisBarato.lojaId, entrada);
  }
  const totalDividido = {
    total: [...porLojaDividido.values()].reduce((soma, l) => soma + l.total, 0),
    porLoja: [...porLojaDividido.values()].sort((a, b) => b.total - a.total),
  };

  // Único mercado: só considera lojas que têm TODOS os itens encontrados — sinaliza em vez de
  // forçar uma comparação com itens faltando.
  const lojasComTodos = itensEncontrados.reduce<Set<string> | null>((acc, item) => {
    const lojasDoItem = new Set(item.precosPorLoja.map((p) => p.lojaId));
    if (acc === null) return lojasDoItem;
    return new Set([...acc].filter((id) => lojasDoItem.has(id)));
  }, null);

  let totalUnicoMercado: TotalPorLoja | null = null;
  if (lojasComTodos && lojasComTodos.size > 0) {
    const candidatos: TotalPorLoja[] = [...lojasComTodos].map((lojaId) => {
      const nomeRaw = itensEncontrados[0]!.precosPorLoja.find((p) => p.lojaId === lojaId)!.nomeRaw;
      const itens = itensEncontrados.map((item) => {
        const preco = item.precosPorLoja.find((p) => p.lojaId === lojaId)!;
        return { termoBuscado: item.termoBuscado, nomeCanonico: item.nomeCanonico, preco: preco.preco };
      });
      return { lojaId, nomeRaw, total: itens.reduce((soma, i) => soma + i.preco, 0), itens };
    });
    totalUnicoMercado = candidatos.sort((a, b) => a.total - b.total)[0]!;
  }

  const economia = totalUnicoMercado ? totalUnicoMercado.total - totalDividido.total : null;

  return { itensEncontrados, itensNaoEncontrados, totalDividido, totalUnicoMercado, economia };
}
