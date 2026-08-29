// api/admin-login.js
// Vercel Serverless Function — roda no servidor, nunca no navegador.
//
// Por que isso é mais seguro que o que existia antes: no artifact, o
// e-mail e a senha do Super Admin ficavam escritos em texto puro
// direto no JavaScript que qualquer visitante podia abrir (F12 →
// Sources) e ler. Aqui, o navegador só manda o que a pessoa digitou
// pra essa função; a comparação de verdade acontece no servidor,
// usando a SERVICE ROLE KEY do Supabase (que ignora as regras de RLS
// e nunca é exposta ao navegador — só existe nas variáveis de
// ambiente da Vercel). A tabela "admin_users" no banco não tem
// NENHUMA política de leitura pública, então nem olhando a requisição
// de rede dá pra ver a senha.
//
// ⚠️ Isso é uma melhoria real, mas ainda não é "Supabase Auth" de
// verdade (senha continua em texto puro na tabela, só que agora
// inacessível ao navegador). A migração pra Auth de verdade — com
// hash de senha, sessão, tudo — é o próximo passo combinado.

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

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    // Diagnóstico temporário: diz exatamente qual variável está faltando,
    // em vez de uma mensagem genérica — reverter pra mensagem genérica
    // depois de resolver (não é sensível, mas não precisa ficar exposto).
    const faltando = [];
    if (!SUPABASE_URL) faltando.push("VITE_SUPABASE_URL");
    if (!SERVICE_ROLE_KEY) faltando.push("SUPABASE_SERVICE_ROLE_KEY");
    console.error("admin-login: variáveis faltando:", faltando.join(", "));
    return res.status(500).json({ success: false, error: `Faltando no servidor: ${faltando.join(", ")}` });
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&select=password`;
    const dbRes = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    if (!dbRes.ok) throw new Error(`Supabase respondeu ${dbRes.status}`);

    const rows = await dbRes.json();
    const match = rows?.[0] && rows[0].password === password;

    return res.status(200).json({ success: !!match });
  } catch (err) {
    console.error("admin-login: erro ao verificar credenciais:", err);
    return res.status(500).json({ success: false, error: "Erro ao verificar login." });
  }
}
