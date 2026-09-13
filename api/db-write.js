// api/db-write.js
// Vercel Serverless Function — ÚNICO portão de escrita pras tabelas
// sensíveis do banco. Antes dessa função existir, o navegador escrevia
// DIRETO no Supabase usando a "anon key" (pública, visível em qualquer
// requisição de rede), e as políticas de RLS estavam configuradas como
// "using (true)" — ou seja, sem checar login NENHUM. Na prática:
// qualquer pessoa, sem nunca ter feito login, conseguia apagar todas
// as vagas, reescrever o banner, mudar preço de plano, etc., só
// sabendo a URL do projeto no Supabase.
//
// Agora: o navegador manda { token, table, action, rows, match } pra
// cá. Essa função confere o token (ver api/_lib/session.js) — se não
// for válido, recusa tudo. Só DEPOIS disso ela usa a SERVICE ROLE KEY
// (nunca exposta ao navegador) pra gravar de verdade no Supabase.
//
// Dois papéis possíveis no token:
//  • "admin" — pode escrever em qualquer tabela da lista ADMIN_TABLES,
//    sem restrição de linha.
//  • "partner" — só pode escrever nas tabelas de PARTNER_OWNED_TABLES,
//    e SÓ nas próprias linhas — o "dono" (partner_id / provider_id) é
//    sempre decidido por ESSA função a partir do token, nunca por um
//    valor que o navegador mandou (impede uma empresa fingir ser
//    dona da vaga de outra só editando o campo certo no formulário).
//
// Tabelas de baixo risco ficam DE FORA daqui de propósito (continuam
// na política pública antiga): "site_stats" (contador de visitas, sem
// dado sensível) e os campos de clique/visualização/favorito de
// "vagas" (ver GRANT de coluna no schema.sql v24) —ougir por aqui só
// adicionaria uma trava sem necessidade prática nenhuma pra quem só
// está vendo uma vaga, não editando.

import { verifySession } from "./_lib/session.js";

const ADMIN_TABLES = new Set([
  "vagas",
  "banner",
  "alerta_banner",
  "comunidade_banner",
  "indicacoes_config",
  "planos",
  "parceiros",
  "comunidade_conteudo",
  "service_categories",
]);

// tabela -> nome da coluna que identifica o dono (na tabela, snake_case)
const PARTNER_OWNED_TABLES = {
  vagas: "partner_id",
  service_listings: "provider_id",
};

const VALID_ACTIONS = new Set(["insert", "upsert", "update", "delete"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !process.env.ADMIN_SESSION_SECRET) {
    console.error("db-write: variáveis de ambiente faltando no servidor.");
    return res.status(500).json({ error: "Servidor mal configurado." });
  }

  const { token, table, action, rows, match } = req.body || {};

  const session = verifySession(token);
  if (!session) {
    return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login de novo." });
  }
  if (!VALID_ACTIONS.has(action)) {
    return res.status(400).json({ error: "Ação inválida." });
  }
  if (typeof table !== "string") {
    return res.status(400).json({ error: "Tabela inválida." });
  }

  const isAdmin = session.role === "admin";
  const ownerColumn = !isAdmin && session.role === "partner" ? PARTNER_OWNED_TABLES[table] : null;

  const allowed = isAdmin ? ADMIN_TABLES.has(table) : !!ownerColumn;
  if (!allowed) {
    return res.status(403).json({ error: "Sem permissão pra escrever nessa tabela." });
  }

  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    let method;
    let body;
    let preferHeader = "return=representation";

    if (action === "insert" || action === "upsert") {
      const payloadRows = (Array.isArray(rows) ? rows : [rows]).map((r) => {
        const row = { ...r };
        if (ownerColumn) row[ownerColumn] = session.partnerId; // nunca confia no valor vindo do navegador
        return row;
      });
      method = "POST";
      body = JSON.stringify(payloadRows);
      preferHeader = action === "upsert" ? "resolution=merge-duplicates,return=minimal" : "return=representation";
    } else if (action === "update") {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(match || {})) params.append(k, `eq.${v}`);
      if (ownerColumn) {
        // Permite editar uma linha já sua OU "reivindicar" uma linha
        // ainda sem dono (partner_id/provider_id nulo — caso de uma
        // vaga trazida pelo scraper que a empresa está assumindo pela
        // primeira vez) — nunca uma linha que já é de OUTRO parceiro.
        params.append("or", `(${ownerColumn}.is.null,${ownerColumn}.eq.${session.partnerId})`);
      }
      const query = params.toString();
      url += query ? `?${query}` : "";
      method = "PATCH";
      const patch = { ...(rows || {}) };
      // Sempre define o dono como quem está editando agora — nunca
      // aceita um valor vindo do navegador. Isso também é o que faz a
      // "reivindicação" (acima) virar dona de verdade depois do update.
      if (ownerColumn) patch[ownerColumn] = session.partnerId;
      body = JSON.stringify(patch);
      preferHeader = "return=representation";
    } else if (action === "delete") {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(match || {})) params.append(k, `eq.${v}`);
      if (ownerColumn) params.append("or", `(${ownerColumn}.is.null,${ownerColumn}.eq.${session.partnerId})`);
      // Exceção explícita: Admin pode apagar SEM filtro (usado só por
      // "service_categories", que sempre substitui a lista inteira) —
      // parceiro nunca pode (ownerColumn força sempre pelo menos um filtro).
      const query = params.toString();
      url += query ? `?${query}` : "";
      method = "DELETE";
      preferHeader = "return=minimal";
    }

    const dbRes = await fetch(url, {
      method,
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: preferHeader,
      },
      body: method === "DELETE" ? undefined : body,
    });

    if (!dbRes.ok) {
      const errText = await dbRes.text().catch(() => "");
      return res.status(dbRes.status).json({ error: `Supabase: ${errText || dbRes.statusText}` });
    }
    const text = await dbRes.text();
    return res.status(200).json({ data: text ? JSON.parse(text) : null });
  } catch (err) {
    console.error("db-write: erro ao gravar:", err);
    return res.status(500).json({ error: "Erro interno ao gravar." });
  }
}
