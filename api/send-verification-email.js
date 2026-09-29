// api/send-verification-email.js
// Vercel Serverless Function — gera um token de verificação (válido
// por 24h) e manda o e-mail de confirmação pra empresa, via Resend
// (API REST direta, sem SDK — mesmo estilo enxuto do resto das
// functions desse projeto).
//
// Exige duas variáveis de ambiente NOVAS, que ainda não existiam
// nesse projeto:
//   RESEND_API_KEY — chave da conta Resend (resend.com, tem free tier)
//   RESEND_FROM_EMAIL — remetente, ex. "NihonVagas <noreply@nihonvagas.jp>"
//     (precisa ser de um domínio VERIFICADO na Resend — sem isso, a
//     Resend só deixa mandar e-mail pro próprio dono da conta, não
//     pra qualquer destinatário; ver instruções de configuração).
//
// Sem essas variáveis configuradas, devolve erro claro em vez de
// falhar silencioso — pra não parecer que "enviou" quando não enviou.

import { signSession, verifySession } from "./_lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !process.env.ADMIN_SESSION_SECRET) {
    console.error("send-verification-email: variáveis de ambiente faltando no servidor.");
    return res.status(500).json({ success: false, error: "Servidor mal configurado." });
  }
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return res.status(500).json({
      success: false,
      error: "Envio de e-mail ainda não configurado neste servidor (RESEND_API_KEY / RESEND_FROM_EMAIL).",
    });
  }

  const { token } = req.body || {};
  const session = verifySession(token);
  if (!session || session.role !== "partner") {
    return res.status(401).json({ success: false, error: "Sessão expirada ou ausente — faça login de novo." });
  }

  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    const partnerRes = await fetch(
      `${SUPABASE_URL}/rest/v1/parceiros?id=eq.${encodeURIComponent(session.partnerId)}&select=id,name,email`,
      { headers }
    );
    if (!partnerRes.ok) throw new Error(`Supabase (buscar parceiro) ${partnerRes.status}`);
    const [partner] = await partnerRes.json();
    if (!partner) return res.status(404).json({ success: false, error: "Empresa não encontrada." });

    // Token de verificação é um segundo token de sessão, só que de um
    // "papel" próprio (email-verify) — reaproveita o mesmo assinador
    // (signSession) em vez de inventar geração de token do zero, e já
    // vem com expiração de 24h embutida (verifySession confere sozinho).
    const verifyToken = signSession({ role: "email-verify", partnerId: partner.id }, 24 * 60 * 60 * 1000);

    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/parceiros?id=eq.${encodeURIComponent(partner.id)}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ email_verify_token: verifyToken, email_verify_token_exp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }),
    });
    if (!patchRes.ok) throw new Error(`Supabase (salvar token) ${patchRes.status}`);

    const siteUrl = process.env.VITE_SITE_URL || "https://www.nihonvagas.jp";
    const verifyLink = `${siteUrl}/?verificar-email=${encodeURIComponent(verifyToken)}`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: partner.email,
        subject: "Confirme seu e-mail — NihonVagas.jp",
        html: `
          <p>Olá, ${partner.name}!</p>
          <p>Confirme seu e-mail pra poder reivindicar vagas no NihonVagas.jp:</p>
          <p><a href="${verifyLink}">${verifyLink}</a></p>
          <p>Esse link expira em 24 horas. Se você não pediu isso, pode ignorar este e-mail.</p>
        `,
      }),
    });
    if (!emailRes.ok) {
      const body = await emailRes.text().catch(() => "");
      throw new Error(`Resend ${emailRes.status}: ${body}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("send-verification-email: erro:", err);
    return res.status(500).json({ success: false, error: "Não foi possível enviar o e-mail de verificação. Tente de novo em instantes." });
  }
}
