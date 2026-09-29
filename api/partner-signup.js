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

// Cópia local (não importa de src/) — funções serverless desse projeto
// ficam autocontidas de propósito, sem depender do código do navegador.
const normalizeText = (s) => (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Item 4 da defesa (v2.6.50): nome de empresa com palavra hostil
// ("...é crime", "denúncia", "golpe" etc.) é rejeitado direto aqui —
// pega o ataque preguiçoso/repetido. Lista curta de propósito: só
// termos que são hostis em QUALQUER contexto de nome de empresa —
// evita bloquear negócio legítimo (ex.: escritório de advocacia) por
// coincidência de palavra.
const PALAVRAS_SUSPEITAS = ["crime", "ilegal", "ilicito", "roubo", "ladrao", "golpe", "fraude", "denuncia"];
function nomeSuspeito(nome) {
  const n = normalizeText(nome);
  return PALAVRAS_SUSPEITAS.some((p) => n.includes(p));
}

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

  if (nomeSuspeito(name)) {
    // Não dá detalhe NENHUM do motivo — só "não foi possível". Contar
    // qual palavra pegou ensinaria a burlar a lista na próxima tentativa.
    return res.status(200).json({
      success: false,
      error: "Não foi possível concluir esse cadastro. Se isso for um engano, entre em contato: nihonvagas@gmail.com",
    });
  }

  // Item 5 da defesa (v2.6.50): limita quantos cadastros o MESMO IP
  // consegue criar num período curto — dificulta ataque tipo o que
  // gerou a conta falsa "publicação sem autorização é crime" (criada,
  // reivindicou 334 vagas, tudo em minutos). x-forwarded-for pode vir
  // com vários IPs (proxy/CDN) — o primeiro da lista é o do visitante.
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || "")
    .split(",")[0]
    .trim() || req.socket?.remoteAddress || null;

  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
  const emailLower = email.trim().toLowerCase();

  try {
    if (ip) {
      const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const rateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/parceiros?signup_ip=eq.${encodeURIComponent(ip)}&created_at=gte.${umaHoraAtras}&select=id`,
        { headers }
      );
      if (rateRes.ok) {
        const recentes = await rateRes.json();
        if (recentes?.length >= 3) {
          return res.status(200).json({
            success: false,
            error: "Muitos cadastros em pouco tempo. Aguarde um pouco e tente de novo, ou fale com a gente: nihonvagas@gmail.com",
          });
        }
      } else {
        console.error("partner-signup: falha ao checar limite por IP (segue o cadastro mesmo assim):", rateRes.status);
      }
    }

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
        signup_ip: ip,
        email_verificado: false,
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
      paginaExclusivaAtiva: false, // empresa nova nunca nasce com a Página Exclusiva — sempre liberada manual pelo Admin
      paginaExclusivaSlug: null,
      fundoCardUrl: null,
      emailVerificado: false,
    };

    // Avisa o celular do Leandro via ntfy.sh (app grátis, sem conta).
    // Precisa de AWAIT aqui: numa Serverless Function da Vercel, o
    // processo pode ser congelado logo depois que a resposta é
    // enviada — um fetch "dispara e esquece" (sem await) corria o
    // risco de nunca terminar de sair, mesmo a função respondendo
    // 200 com sucesso (foi exatamente o que aconteceu: log mostrava
    // sucesso, mas a notificação nunca chegava). O timeout de 4s e o
    // try/catch garantem que, mesmo assim, o cadastro da empresa
    // nunca fica mais lento nem falha por causa do ntfy.
    if (process.env.NTFY_TOPIC) {
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 4000);
        await fetch(`https://ntfy.sh/${process.env.NTFY_TOPIC}`, {
          method: "POST",
          headers: { Title: "Nova empresa no NihonVagas", Tags: "moneybag" },
          body: `${row.name} (${tipo}) acabou de se cadastrar — ${emailLower}`,
          signal: ctrl.signal,
        });
        clearTimeout(timeout);
      } catch (err) {
        console.error("partner-signup: falha ao notificar ntfy (não bloqueia o cadastro):", err);
      }
    }

    return res.status(200).json({ success: true, token, partner, listing });
  } catch (err) {
    console.error("partner-signup: erro ao cadastrar:", err);
    return res.status(500).json({ success: false, error: "Não foi possível concluir o cadastro. Tente novamente." });
  }
}
