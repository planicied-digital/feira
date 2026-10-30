#!/usr/bin/env node
// Publica as fotos originais dos panfletos válidos em frontend/public/panfletos/, pra tela inicial
// oferecer o panfleto pra ver/baixar. As fotos ficam só na máquina de quem transcreve
// (docs/panfletos/ está no .gitignore), então este script roda localmente e o resultado vai pro
// git junto com os JSONs — o deploy da VPS só enxerga o que está no repositório.
//
// Só os panfletos válidos hoje são publicados (mesma regra do backend: data de fim >= hoje, ou
// "enquanto durar o estoque" extraído há no máximo 3 dias); os vencidos são removidos da pasta,
// pra o repositório não acumular foto de panfleto que o app nem mostra mais.
//
// Uso (na raiz do repo): node scripts/publicar-panfletos.mjs
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

const RAIZ = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const PASTA_JSONS = join(RAIZ, "scripts");
const PASTA_FOTOS = join(RAIZ, "docs", "panfletos");
const PASTA_DESTINO = join(RAIZ, "frontend", "public", "panfletos");
const DIAS_LIMITE_ENQUANTO_ESTOQUE = 3;

// Data de hoje em Boa Vista (UTC-4), no formato das datas do JSON (AAAA-MM-DD).
const hoje = new Date(Date.now() - 4 * 3_600_000).toISOString().slice(0, 10);

function panfletoValido(json) {
  const { tipo_validade: tipo, fim } = json.validade;
  if (tipo === "data_definida") return fim !== null && fim >= hoje;
  const limite = new Date(json.extraido_em).getTime() + DIAS_LIMITE_ENQUANTO_ESTOQUE * 86_400_000;
  return limite >= Date.now();
}

// arquivo_origem lista as páginas em forma abreviada: só a primeira tem o nome completo
// ("WhatsApp Image 2026-10-26 at 21.37.47.jpeg + 21.37.48 + 21.37.58 (1)"); as seguintes repetem
// só a hora, às vezes sem extensão.
function arquivosDasPaginas(arquivoOrigem) {
  const partes = arquivoOrigem.split(" + ").map((p) => p.trim());
  const prefixo = partes[0].match(/^(.* at )/)?.[1];
  if (!prefixo) return null;
  return partes.map((parte) => {
    const nome = parte.startsWith(prefixo) ? parte : prefixo + parte;
    // Não dá pra usar extname: "21.37.48" teria extensão ".48".
    return /\.(jpe?g|png|webp)$/i.test(nome) ? nome : `${nome}.jpeg`;
  });
}

const manifesto = {};
const problemas = [];

for (const arquivo of readdirSync(PASTA_JSONS).filter((f) => /^panfleto-.*\.json$/.test(f)).sort()) {
  const json = JSON.parse(readFileSync(join(PASTA_JSONS, arquivo), "utf8"));
  const nome = basename(arquivo, ".json");
  const destino = join(PASTA_DESTINO, nome);

  if (!panfletoValido(json)) {
    rmSync(destino, { recursive: true, force: true });
    continue;
  }

  const paginas = arquivosDasPaginas(json.arquivo_origem);
  const faltando = paginas?.filter((p) => !existsSync(join(PASTA_FOTOS, p))) ?? [];
  if (!paginas || faltando.length > 0) {
    // Sem as fotos locais não dá pra publicar; se já foi publicado antes, mantém o que está lá.
    if (existsSync(destino)) manifesto[arquivo] = readdirSync(destino).sort();
    problemas.push(`${arquivo}: ${paginas ? `fotos não encontradas: ${faltando.join(", ")}` : "arquivo_origem em formato desconhecido"}`);
    continue;
  }

  rmSync(destino, { recursive: true, force: true });
  mkdirSync(destino, { recursive: true });
  manifesto[arquivo] = paginas.map((pagina, i) => {
    const nomePagina = `${String(i + 1).padStart(2, "0")}${extname(pagina).toLowerCase()}`;
    copyFileSync(join(PASTA_FOTOS, pagina), join(destino, nomePagina));
    return nomePagina;
  });
}

// Remove pastas de JSONs que não existem mais.
if (existsSync(PASTA_DESTINO)) {
  for (const pasta of readdirSync(PASTA_DESTINO, { withFileTypes: true })) {
    if (pasta.isDirectory() && !manifesto[`${pasta.name}.json`]) {
      rmSync(join(PASTA_DESTINO, pasta.name), { recursive: true, force: true });
    }
  }
}

mkdirSync(PASTA_DESTINO, { recursive: true });
// Chave = nome do JSON, o mesmo valor gravado em folhetos.arquivo_json — é assim que o frontend
// liga o panfleto devolvido pela API às fotos publicadas.
writeFileSync(join(PASTA_DESTINO, "manifesto.json"), `${JSON.stringify(manifesto, null, 2)}\n`);

console.log(`Panfletos publicados: ${Object.keys(manifesto).length} (válidos em ${hoje})`);
for (const [json, paginas] of Object.entries(manifesto)) console.log(`  ${json}: ${paginas.length} página(s)`);
if (problemas.length > 0) {
  console.log("Atenção:");
  for (const p of problemas) console.log(`  ${p}`);
}
