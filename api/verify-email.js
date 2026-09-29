// api/verify-email.js
// Vercel Serverless Function — confirma o link que a empresa recebeu
// por e-mail (api/send-verification-email.js). Endpoint PÚBLICO de
// propósito (não exige sessão de login) — é exatamente o ato de clicar
// no link que prova que a pessoa tem acesso àquele e-mail, sessão
// nenhuma substitui isso.
//
// Duas camadas de validação: (1) a assinatura do token em si
// (verifySession — garante que não foi forjado, e que não passou de
// 24h); (2) ele precisa bater com o token GRAVADO no banco pra esse
// parceiro — um token antigo (de um "reenviar" anterior) já foi
// substituído lá e para de valer, mesmo ainda "válido" pela assinatura.

import { verifySession } from "./_lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !process.env.ADMIN_SESSION_SECRET) {
    console.error("verify-email: variáveis de ambiente faltando no servidor.");
    return res.status(500).json({ success: false, error: "Servidor mal configurado." });
  }

  const { verifyToken } = req.body || {};
  const payload = verifySession(verifyToken);
  if (!payload || payload.role !== "email-verify" || !payload.partnerId) {
    return res.status(200).json({ success: false, error: "Link inválido ou expirado. Peça um novo e-mail de verificação." });
  }

  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    const partnerRes = await fetch(
      `${SUPABASE_URL}/rest/v1/parceiros?id=eq.${encodeURIComponent(payload.partnerId)}&select=id,name,email_verify_token`,
      { headers }
    );
    if (!partnerRes.ok) throw new Error(`Supabase (buscar parceiro) ${partnerRes.status}`);
    const [partner] = await partnerRes.json();
    if (!partner) return res.status(200).json({ success: false, error: "Empresa não encontrada." });
    if (partner.email_verify_token !== verifyToken) {
      // Token de um "reenviar" mais antigo — já foi substituído.
      return res.status(200).json({ success: false, error: "Este link já não é mais válido. Peça um novo e-mail de verificação." });
    }

    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/parceiros?id=eq.${encodeURIComponent(partner.id)}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ email_verificado: true, email_verify_token: null, email_verify_token_exp: null }),
    });
    if (!patchRes.ok) throw new Error(`Supabase (marcar verificado) ${patchRes.status}`);

    return res.status(200).json({ success: true, partnerId: partner.id, partnerName: partner.name });
  } catch (err) {
    console.error("verify-email: erro:", err);
    return res.status(500).json({ success: false, error: "Não foi possível confirmar o e-mail agora. Tente de novo em instantes." });
  }
}
