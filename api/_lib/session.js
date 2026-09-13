// api/_lib/session.js
//
// Sessão assinada simples (não é JWT de biblioteca nenhuma, é só HMAC
// caseiro com Node "crypto" — já vem embutido no runtime da Vercel,
// sem dependência nova) usada pelas duas telas de login (Admin e
// Empresa/Parceiro) e conferida pelo gateway de escrita (db-write.js).
//
// Formato do token: "<payload em base64url>.<assinatura em base64url>"
// O payload sempre carrega "role" ("admin" ou "partner"), "exp"
// (timestamp de expiração) e, pra parceiro, "partnerId".
//
// ⚠️ Exige a variável de ambiente ADMIN_SESSION_SECRET na Vercel — uma
// string aleatória longa, só o servidor conhece. Sem ela, login para
// de funcionar de propósito (mais seguro falhar visivelmente do que
// assinar token com um segredo previsível/vazio).

import crypto from "crypto";

const SECRET = process.env.ADMIN_SESSION_SECRET;
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12h — login expira sozinho, sem precisar de botão de logout pra ser seguro

function sign(encodedPayload) {
  return crypto.createHmac("sha256", SECRET).update(encodedPayload).digest("base64url");
}

export function signSession(payload, ttlMs = DEFAULT_TTL_MS) {
  if (!SECRET) throw new Error("ADMIN_SESSION_SECRET não configurado no servidor.");
  const encoded = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs })).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

// Retorna o payload (objeto) se o token for válido e não expirado, ou
// null pra qualquer outro caso (assinatura errada, formato errado,
// expirado, segredo não configurado) — nunca lança erro, pra quem usa
// só precisar checar "if (!session) ...".
export function verifySession(token) {
  if (!SECRET || !token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;

  const expected = sign(encoded);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  // Comparação em tempo constante — evita vazar informação da
  // assinatura correta por diferença de tempo de resposta.
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  return payload;
}
