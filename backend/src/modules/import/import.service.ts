import { Prisma, StatusMatch, TipoValidade, type UnidadePadrao } from "@prisma/client";
import { prisma } from "../../lib/prisma-client.js";
import { normalizarNome } from "../normalizacao/normalizar-nome.js";
import { calcularPrecoPorUnidadePadrao, extrairQuantidadeUnidade, unidadeParaPadrao } from "../normalizacao/unidades.js";
import { encontrarOuCriarProdutoCanonico } from "../normalizacao/matching.service.js";
import { mapearCategoria } from "../normalizacao/mapear-categoria.js";
import type { ImportFolhetoInput, ImportItemInput, ImportValidadeInput } from "./import.schema.js";

function mapTipoValidade(v: ImportValidadeInput["tipo_validade"]): TipoValidade {
  return v === "data_definida" ? TipoValidade.DATA_DEFINIDA : TipoValidade.ENQUANTO_DURAR_ESTOQUE;
}

interface UnidadeResolvida {
  quantidade: number;
  unidadePadrao: UnidadePadrao;
  precoPorUnidadePadrao: number;
}

// A IA pode errar aritmética ou deixar quantidade/unidade nulos — o backend sempre recalcula
// quando dá para resolver quantidade+unidade, e só confia no valor pronto da IA como último recurso.
function resolverUnidade(item: ImportItemInput): UnidadeResolvida | null {
  if (item.quantidade && item.unidade) {
    const conversao = unidadeParaPadrao(item.unidade);
    if (conversao) {
      return {
        quantidade: item.quantidade,
        unidadePadrao: conversao.unidadePadrao,
        precoPorUnidadePadrao: calcularPrecoPorUnidadePadrao(item.preco, item.quantidade, conversao.fator),
      };
    }
  }

  const extraido = extrairQuantidadeUnidade(item.nome_raw);
  if (extraido) {
    return {
      quantidade: extraido.quantidade,
      unidadePadrao: extraido.unidadePadrao,
      precoPorUnidadePadrao: calcularPrecoPorUnidadePadrao(item.preco, extraido.quantidade, extraido.fatorConversao),
    };
  }

  if (item.unidade_padrao === "un") {
    return { quantidade: item.quantidade ?? 1, unidadePadrao: "UN", precoPorUnidadePadrao: item.preco };
  }

  if (item.unidade_padrao && item.preco_por_unidade_padrao) {
    return {
      quantidade: item.quantidade ?? 1,
      unidadePadrao: item.unidade_padrao.toUpperCase() as UnidadePadrao,
      precoPorUnidadePadrao: item.preco_por_unidade_padrao,
    };
  }

  return null;
}

export interface ImportErro {
  index: number;
  mensagem: string;
}

export class ImportValidationError extends Error {
  erros: ImportErro[];

  constructor(erros: ImportErro[]) {
    super("Falha de validação na importação do folheto");
    this.erros = erros;
  }
}

export interface ImportResultItem {
  itemFolhetoId: string;
  produtoCanonicoId: string;
  statusMatch: StatusMatch;
}

export interface ImportResult {
  folhetoId: string;
  lojaId: string;
  itens: ImportResultItem[];
}

// Importação all-or-nothing: toda resolução de quantidade/unidade é validada antes de abrir a
// transação; se qualquer item falhar, nada é gravado.
export async function importarFolheto(input: ImportFolhetoInput): Promise<ImportResult> {
  const resolucoes = input.itens.map(resolverUnidade);
  const erros: ImportErro[] = [];
  resolucoes.forEach((r, index) => {
    if (r === null) {
      erros.push({
        index,
        mensagem: `Não foi possível determinar quantidade/unidade para o item ${index} ("${input.itens[index].nome_raw}")`,
      });
    }
  });

  if (erros.length > 0) {
    throw new ImportValidationError(erros);
  }

  return prisma.$transaction(async (tx) => {
    const nomeLojaNormalizado = normalizarNome(input.estabelecimento.nome_raw);
    let loja = await tx.loja.findFirst({ where: { nomeNormalizado: nomeLojaNormalizado } });
    if (!loja) {
      loja = await tx.loja.create({
        data: {
          nomeRaw: input.estabelecimento.nome_raw,
          nomeNormalizado: nomeLojaNormalizado,
          rede: input.estabelecimento.rede ?? null,
          enderecoRaw: input.estabelecimento.endereco_raw ?? null,
        },
      });
    }

    const folheto = await tx.folheto.create({
      data: {
        lojaId: loja.id,
        arquivoOrigem: input.arquivo_origem,
        tipoValidade: mapTipoValidade(input.validade.tipo_validade),
        validadeInicio: input.validade.inicio ? new Date(input.validade.inicio) : null,
        validadeFim: input.validade.fim ? new Date(input.validade.fim) : null,
        extraidoEm: new Date(input.extraido_em),
        rawJson: input as unknown as Prisma.InputJsonValue,
      },
    });

    const categorias = await tx.categoria.findMany();
    const categoriaIdPorSlug = new Map(categorias.map((c) => [c.slug, c.id]));

    const resultadoItens: ImportResultItem[] = [];

    for (let index = 0; index < input.itens.length; index++) {
      const item = input.itens[index];
      const resolucao = resolucoes[index]!;
      const categoria = item.categoria_sugerida?.trim().toLowerCase() || null;
      const categoriaId = categoriaIdPorSlug.get(mapearCategoria(categoria))!;
      const marca = item.marca?.trim() || null;
      // Remove a porção de quantidade/unidade do nome antes de normalizar: um pacote de 1kg e
      // um de 5kg do mesmo produto devem cair no mesmo produto canônico (o preço já é comparado
      // por unidade padrão), então o tamanho da embalagem não deve influenciar o trigram.
      const trechoQuantidadeUnidade = extrairQuantidadeUnidade(item.nome_raw)?.trechoOriginal ?? null;
      const nomeNormalizado = normalizarNome(item.nome_raw, trechoQuantidadeUnidade);

      const itemFolheto = await tx.itemFolheto.create({
        data: {
          folhetoId: folheto.id,
          nomeRaw: item.nome_raw,
          nomeNormalizado,
          marcaRaw: marca,
          categoriaSugerida: categoria,
          quantidade: resolucao.quantidade,
          unidade: item.unidade ?? null,
          preco: item.preco,
          precoOriginal: item.preco_original ?? null,
          unidadePadrao: resolucao.unidadePadrao,
          precoPorUnidadePadrao: resolucao.precoPorUnidadePadrao,
          confiancaOcr: item.confianca_ocr ?? null,
          tipoValidadeItem: item.validade_item ? mapTipoValidade(item.validade_item.tipo_validade) : null,
          validadeInicioItem: item.validade_item?.inicio ? new Date(item.validade_item.inicio) : null,
          validadeFimItem: item.validade_item?.fim ? new Date(item.validade_item.fim) : null,
        },
      });

      const match = await encontrarOuCriarProdutoCanonico(tx, {
        nomeNormalizado,
        nomeCanonicoSugerido: item.nome_raw.trim(),
        categoriaId,
        unidadePadrao: resolucao.unidadePadrao,
        marca,
      });

      await tx.itemFolheto.update({
        where: { id: itemFolheto.id },
        data: {
          produtoCanonicoId: match.produtoCanonicoId,
          statusMatch: match.statusMatch,
          scoreSimilaridade: match.scoreSimilaridade,
        },
      });

      const validadeEfetiva = item.validade_item ?? input.validade;

      await tx.preco.create({
        data: {
          produtoCanonicoId: match.produtoCanonicoId,
          lojaId: loja.id,
          folhetoId: folheto.id,
          itemFolhetoId: itemFolheto.id,
          preco: item.preco,
          precoPorUnidadePadrao: resolucao.precoPorUnidadePadrao,
          unidadePadrao: resolucao.unidadePadrao,
          tipoValidade: mapTipoValidade(validadeEfetiva.tipo_validade),
          validadeInicio: validadeEfetiva.inicio ? new Date(validadeEfetiva.inicio) : null,
          validadeFim: validadeEfetiva.fim ? new Date(validadeEfetiva.fim) : null,
          extraidoEm: new Date(input.extraido_em),
        },
      });

      resultadoItens.push({
        itemFolhetoId: itemFolheto.id,
        produtoCanonicoId: match.produtoCanonicoId,
        statusMatch: match.statusMatch,
      });
    }

    return { folhetoId: folheto.id, lojaId: loja.id, itens: resultadoItens };
  });
}
