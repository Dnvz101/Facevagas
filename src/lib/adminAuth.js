// src/lib/adminAuth.js
//
// Verifica login de Super Admin chamando a Vercel Function
// (api/admin-login.js) — NUNCA compara e-mail/senha direto no
// navegador. Se a resposta der erro de rede (ex: rodando só com
// "npm run dev", sem "vercel dev", já que rotas /api só existem no
// ambiente da Vercel), retorna false — login de Admin simplesmente
// não funciona fora do site publicado. Isso é intencional, não bug.
export async function checkSuperAdminLogin(email, password) {
  try {
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("Falha ao verificar login de Admin (normal em 'npm run dev' sem 'vercel dev'):", err);
    return false;
  }
}
