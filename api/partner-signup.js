// api/partner-signup.js
// Vercel Serverless Function — cadastro de nova Empresa/Parceiro.
//
// Por que isso não passa pelo gateway genérico (api/db-write.js): esse
// gateway SEMPRE exige uma sessão válida — e no momento do cadastro,
// a pessoa ainda não tem nenhuma (é literalmente o ato de criar a
// conta). Então esse é o único lugar do sistema onde uma escrita em
// "parceiros" acontece sem login prévio, de propósito, e com bem mais
// cuidado: plano sempre "gratis" e selo sempre "false" são fixados
// AQUI no servidor, nunca aceitos do que o navegador mandar — ninguém
// consegue se autocadastrar já como "Master, verificado" só editando
// o formulário.
//
// Ao final, já emite o token de sessão (mesmo formato de
// api/partner-login.js) — assim a empresa recém-cadastrada já entra
// direto na própria Área do Cliente, sem precisar logar de novo.

import { signSession } from "./_lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !process.env.ADMIN_SESSION_SECRET) {
    console.error("partner-signup: variáveis de ambiente faltando no servidor.");
    return res.status(500).json({ success: false, error: "Servidor mal configurado." });
  }

  const {
    tipo, name, email, password, phonePt, phoneJp,
    listingCategoria, listingDescricao, isNewListingCategory, newCategoryColor,
  } = req.body || {};

  if (!tipo || !name?.trim() || !email?.trim() || !password?.trim() || !phonePt?.trim()) {
    return res.status(400).json({ success: false, error: "Preencha todos os campos obrigatórios." });
  }

  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
  const emailLower = email.trim().toLowerCase();

  try {
    const existsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/parceiros?email=eq.${encodeURIComponent(emailLower)}&select=id`,
      { headers }
    );
    if (!existsRes.ok) throw new Error(`Supabase (checar e-mail) ${existsRes.status}`);
    const existing = await existsRes.json();
    if (existing?.length) {
      return res.status(200).json({ success: false, error: "Já existe um cadastro com esse e-mail." });
    }

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/parceiros`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify([{
        tipo,
        name: name.trim(),
        email: emailLower,
        password, // texto puro por ora — mesmo aviso de sempre (ver admin-login.js)
        phone_pt: phonePt.trim(),
        phone_jp: (phoneJp || "").trim(),
        plan_key: "gratis", // nunca aceito do navegador — toda empresa nova entra no Grátis
        selo_verificado: false,
      }]),
    });
    if (!insertRes.ok) throw new Error(`Supabase (criar parceiro) ${insertRes.status}`);
    const [row] = await insertRes.json();

    // Prestador de serviço: o cadastro já cria a categoria (se for
    // nova) + o primeiro anúncio junto — mesma UX que já existia,
    // só que agora feito aqui no servidor.
    let listing = null;
    if (tipo === "prestador") {
      if (isNewListingCategory && listingCategoria) {
        await fetch(`${SUPABASE_URL}/rest/v1/service_categories`, {
          method: "POST",
          headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify([{ nome: listingCategoria, color: newCategoryColor || "blue", icon: "Building2" }]),
        }).catch((err) => console.error("partner-signup: falha ao criar categoria (não bloqueia o cadastro):", err));
      }
      const listingRes = await fetch(`${SUPABASE_URL}/rest/v1/service_listings`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify([{
          provider_id: row.id,
          categoria: listingCategoria || "",
          nome: name.trim(),
          descricao: listingDescricao || "",
          whatsapp: phonePt.trim(),
          likes: 0,
          status: "publicado",
        }]),
      });
      if (listingRes.ok) {
        const [l] = await listingRes.json();
        listing = {
          id: l.id, providerId: l.provider_id, categoria: l.categoria, nome: l.nome,
          descricao: l.descricao, whatsapp: l.whatsapp, likes: l.likes ?? 0,
          status: l.status, createdAt: new Date(l.created_at).getTime(),
        };
      }
    }

    const token = signSession({ role: "partner", partnerId: row.id });
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

    // Avisa o celular do Leandro via ntfy.sh (app grátis, sem conta) —
    // dispara e não espera resposta: se o ntfy estiver fora do ar, o
    // cadastro da empresa NUNCA pode falhar por causa disso.
    if (process.env.NTFY_TOPIC) {
      fetch(`https://ntfy.sh/${process.env.NTFY_TOPIC}`, {
        method: "POST",
        headers: { Title: "Nova empresa no NihonVagas", Tags: "moneybag" },
        body: `${row.name} (${tipo}) acabou de se cadastrar — ${emailLower}`,
      }).catch((err) => console.error("partner-signup: falha ao notificar ntfy (não bloqueia o cadastro):", err));
    }

    return res.status(200).json({ success: true, token, partner, listing });
  } catch (err) {
    console.error("partner-signup: erro ao cadastrar:", err);
    return res.status(500).json({ success: false, error: "Não foi possível concluir o cadastro. Tente novamente." });
  }
}
