// api/notify-claim.js
// Vercel Serverless Function — avisa o celular do Admin (ntfy.sh, mesmo
// canal do cadastro de empresa nova, v2.6.29/30) toda vez que alguém
// reivindica vaga. Existe fora do api/db-write.js de propósito: aqui
// não é gravação de dado, é só um aviso — mas ainda assim exige uma
// sessão válida (verifySession), pra ninguém conseguir spamar o
// celular do Admin chamando esse endpoint direto sem estar logado.
//
// Por que isso não fica no navegador direto: o NTFY_TOPIC é o "segredo"
// que mantém as notificações privadas (ntfy.sh é público por padrão) —
// se o navegador chamasse ntfy.sh direto, esse topic ficaria visível
// pra qualquer um inspecionando a rede. Rodando aqui, o topic nunca
// sai do servidor.

import { verifySession } from "./_lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  const { token, companyName, count } = req.body || {};
  const session = verifySession(token);
  if (!session) {
    return res.status(401).json({ success: false, error: "Sessão expirada ou ausente." });
  }
  if (!companyName || !Number.isFinite(count) || count < 1) {
    return res.status(400).json({ success: false, error: "Dados incompletos." });
  }

  if (process.env.NTFY_TOPIC) {
    // Lote grande = o mesmo limiar (>15) que já protege a pré-seleção
    // no ClaimJobsModal — aqui só decide o quão "alto" o aviso é.
    const grande = count > 15;
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 4000);
      await fetch(`https://ntfy.sh/${process.env.NTFY_TOPIC}`, {
        method: "POST",
        headers: {
          Title: grande ? "⚠️ Reivindicação GRANDE de vagas" : "Vagas reivindicadas",
          Tags: grande ? "warning" : "briefcase",
          Priority: grande ? "high" : "default",
        },
        body: `"${companyName}" reivindicou ${count} vaga${count === 1 ? "" : "s"}.`,
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
    } catch (err) {
      console.error("notify-claim: falha ao notificar (não bloqueia a reivindicação):", err);
    }
  }

  return res.status(200).json({ success: true });
}
