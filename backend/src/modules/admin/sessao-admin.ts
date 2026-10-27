import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env.js";

const DURACAO_SESSAO_MS = 7 * 24 * 60 * 60 * 1000;
const chaveSessao = env.ADMIN_SESSION_SECRET ?? randomBytes(32).toString("hex");

function assinar(conteudo: string): string {
  return createHmac("sha256", chaveSessao).update(conteudo).digest("base64url");
}

function iguais(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

// Compara pelo hash pra que o tamanho da senha digitada não vaze pelo tempo de resposta.
export function senhaConfere(senha: string): boolean {
  if (!env.ADMIN_PASSWORD) return false;
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return iguais(hash(senha), hash(env.ADMIN_PASSWORD));
}

// Sessão sem estado no servidor: "<expiração em ms>.<HMAC da expiração>". Não precisa de tabela
// nem de dependência de cookie — o frontend guarda e manda no header Authorization.
export function criarSessao(): { token: string; expiraEm: string } {
  const expira = Date.now() + DURACAO_SESSAO_MS;
  return { token: `${expira}.${assinar(String(expira))}`, expiraEm: new Date(expira).toISOString() };
}

function sessaoValida(token: string): boolean {
  const [expira, assinatura] = token.split(".");
  if (!expira || !assinatura || !/^\d+$/.test(expira)) return false;
  if (!iguais(Buffer.from(assinatura), Buffer.from(assinar(expira)))) return false;
  return Number(expira) > Date.now();
}

// Mesmo critério do POST /import: em produção sem senha configurada, a área fica fechada
// (falha fechada); em dev sem senha, aberta pra não atrapalhar o uso local.
export async function exigirAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!env.ADMIN_PASSWORD) {
    if (env.NODE_ENV === "production") {
      return reply.status(503).send({ mensagem: "Área de admin desabilitada: ADMIN_PASSWORD não configurada" });
    }
    return;
  }

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
  if (!sessaoValida(token)) {
    return reply.status(401).send({ mensagem: "Faça login para acessar a área de admin" });
  }
}
