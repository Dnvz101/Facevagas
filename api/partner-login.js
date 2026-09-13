// api/partner-login.js
// Vercel Serverless Function — login de Empresa/Parceiro (Empreiteira,
// Prestador de Serviço, Loja/Comércio).
//
// ⚠️ ACHADO GRAVE que motivou essa função existir: antes, o login de
// parceiro comparava e-mail/senha DIRETO NO NAVEGADOR
// (PartnerAuthModal.jsx), contra uma lista ("registeredPartners") que
// vinha de "select=*" na tabela `parceiros` — ou seja, a SENHA DE
// TODAS AS EMPRESAS CADASTRADAS chegava em texto puro pro navegador
// de QUALQUER visitante do site (dava pra ver isso abrindo as
// Ferramentas de Desenvolvedor → Rede, sem nem precisar tentar fazer
// login). Igual ao Admin, agora a senha é conferida aqui dentro, com a
// SERVICE ROLE KEY (nunca exposta ao navegador), buscando só a senha
// DAQUELE e-mail específico — nunca a lista inteira.
//
// Emite o mesmo tipo de token assinado que o admin-login (ver
// api/_lib/session.js), com "role: partner" + o ID do parceiro —
// exigido pelo gateway de escrita (api/db-write.js) pra qualquer
// alteração feita pela empresa (publicar vaga própria, editar
// anúncio de serviço, etc.).

import { signSession } from "./_lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "E-mail e senha são obrigatórios." });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !process.env.ADMIN_SESSION_SECRET) {
    const faltando = [];
    if (!SUPABASE_URL) faltando.push("VITE_SUPABASE_URL");
    if (!SERVICE_ROLE_KEY) faltando.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!process.env.ADMIN_SESSION_SECRET) faltando.push("ADMIN_SESSION_SECRET");
    console.error("partner-login: variáveis faltando:", faltando.join(", "));
    return res.status(500).json({ success: false, error: `Faltando no servidor: ${faltando.join(", ")}` });
  }

  try {
    const emailLower = email.trim().toLowerCase();
    const url = `${SUPABASE_URL}/rest/v1/parceiros?email=eq.${encodeURIComponent(emailLower)}&select=id,tipo,name,email,password,phone_pt,phone_jp,plan_key,selo_verificado`;
    const dbRes = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    if (!dbRes.ok) throw new Error(`Supabase respondeu ${dbRes.status}`);

    const rows = await dbRes.json();
    const row = rows?.[0];
    if (!row || row.password !== password) {
      return res.status(200).json({ success: false });
    }

    const token = signSession({ role: "partner", partnerId: row.id });
    // Nunca devolve "password" de volta pro navegador, nem desse
    // parceiro que acabou de logar — ele não precisa disso pra nada.
    const partner = {
      id: row.id,
      tipo: row.tipo,
      name: row.name,
      email: row.email,
      phonePt: row.phone_pt || "",
      phoneJp: row.phone_jp || "",
      planKey: row.plan_key,
      seloVerificado: !!row.selo_verificado,
    };
    return res.status(200).json({ success: true, token, partner });
  } catch (err) {
    console.error("partner-login: erro ao verificar credenciais:", err);
    return res.status(500).json({ success: false, error: "Erro ao verificar login." });
  }
}
