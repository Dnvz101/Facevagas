// ---------------------------------------------------------------
// Cliente Supabase — camada de acesso ao banco. Copiado linha por
// linha do adapter original (testado e validado ao longo de dezenas
// de versões de schema, v3 até v20) — só troquei as credenciais fixas
// por variáveis de ambiente (.env), já que aqui é um projeto de
// verdade, não o preview do artifact.
// ---------------------------------------------------------------

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function supabaseRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${body || res.statusText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Mapa dos selos: chave usada no app (camelCase) <-> coluna no banco (snake_case).
// Central pra qualquer lugar que precise converter entre os dois (linha 1 de verdade).
export const BADGE_DB_FIELDS = {
  isTopSalario: "top_salario",
  isRecomendado: "recomendado",
  isUrgente: "urgente",
  isFixado: "fixado",
  isNovo: "novo",
};

// DB row (snake_case, campos em português iguais ao scraper) <-> app object (camelCase)
export function rowToJob(row) {
  const job = {
    id: row.id,
    empresa: row.empresa || "",
    cargo: row.cargo || "",
    cidade: row.cidade || "",
    provincia: row.provincia || "",
    salarioHora: row.salario_hora ?? 0,
    salarioMax: row.salario_max ?? null,
    turno: row.turno || "",
    nihongo: row.nihongo || "",
    moradia: row.moradia || "",
    vagaHomens: !!row.vaga_homens,
    vagaMulheres: !!row.vaga_mulheres,
    conducao: row.conducao || "",
    tags: row.tags || [],
    telefone: row.telefone || "",
    whatsapp: row.whatsapp || "",
    descricao: row.descricao || "",
    status: row.status || "publicado",
    clicks: row.clicks ?? 0,
    views: row.views ?? 0,
    favoritos: row.favoritos ?? 0,
    seloVerificado: !!row.selo_verificado,
    destaqueAtivadoEm: row.destaque_ativado_em ? new Date(row.destaque_ativado_em).getTime() : null,
    novoAtivadoEm: row.novo_ativado_em ? new Date(row.novo_ativado_em).getTime() : null,
    preenchida: !!row.preenchida,
    preenchidaEm: row.preenchida_em ? new Date(row.preenchida_em).getTime() : null,
    dailyStats: row.daily_stats || {},
    urlOriginal: row.url_original || null,
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at).getTime() : null,
    arquivada: !!row.arquivada,
    idadeMaxima: row.idade_maxima ?? null,
    indicacao: !!row.indicacao, // origem: cadastrada manualmente via aba Indicações (55+)
    indicacoesAtiva: !!row.indicacoes_ativa, // vaga TRADICIONAL ativada manualmente pro cross-post (indicação manual não depende disso)
  };
  for (const [jsKey, dbKey] of Object.entries(BADGE_DB_FIELDS)) job[jsKey] = !!row[dbKey];
  return job;
}

export function jobToRow(job) {
  const row = {
    empresa: job.empresa || "",
    cargo: job.cargo || "",
    cidade: job.cidade || "",
    provincia: job.provincia || "",
    salario_hora: Number(job.salarioHora) || 0,
    salario_max: job.salarioMax ? Number(job.salarioMax) : null,
    turno: job.turno || "",
    nihongo: job.nihongo || "",
    moradia: job.moradia || "",
    vaga_homens: !!job.vagaHomens,
    vaga_mulheres: !!job.vagaMulheres,
    conducao: job.conducao || "",
    tags: job.tags || [],
    telefone: job.telefone || "",
    whatsapp: job.whatsapp || "",
    descricao: job.descricao || "",
    status: job.status || "publicado",
    clicks: job.clicks ?? 0,
    views: job.views ?? 0,
    favoritos: job.favoritos ?? 0,
    selo_verificado: !!job.seloVerificado,
    destaque_ativado_em: job.destaqueAtivadoEm ? new Date(job.destaqueAtivadoEm).toISOString() : null,
    novo_ativado_em: job.novoAtivadoEm ? new Date(job.novoAtivadoEm).toISOString() : null,
    preenchida: !!job.preenchida,
    preenchida_em: job.preenchidaEm ? new Date(job.preenchidaEm).toISOString() : null,
    daily_stats: job.dailyStats || {},
    url_original: job.urlOriginal || null,
    last_seen_at: job.lastSeenAt ? new Date(job.lastSeenAt).toISOString() : null,
    arquivada: !!job.arquivada,
    idade_maxima: job.idadeMaxima ?? null,
    indicacao: !!job.indicacao,
    indicacoes_ativa: !!job.indicacoesAtiva,
  };
  for (const [jsKey, dbKey] of Object.entries(BADGE_DB_FIELDS)) row[dbKey] = !!job[jsKey];
  return row;
}

export const supabaseAdapter = {
  async fetchJobs() {
    const rows = await supabaseRequest("vagas?select=*&order=created_at.desc");
    return rows.map(rowToJob);
  },
  async insertJob(job) {
    const rows = await supabaseRequest("vagas", { method: "POST", body: JSON.stringify(jobToRow(job)) });
    return rowToJob(rows[0]);
  },
  async insertJobsBulk(jobsArr) {
    const rows = await supabaseRequest("vagas", { method: "POST", body: JSON.stringify(jobsArr.map(jobToRow)) });
    return rows.map(rowToJob);
  },
  async updateJob(id, patch) {
    const dbPatch = {};
    if ("clicks" in patch) dbPatch.clicks = patch.clicks;
    if ("views" in patch) dbPatch.views = patch.views;
    if ("favoritos" in patch) dbPatch.favoritos = patch.favoritos;
    if ("seloVerificado" in patch) dbPatch.selo_verificado = patch.seloVerificado;
    if ("destaqueAtivadoEm" in patch) dbPatch.destaque_ativado_em = patch.destaqueAtivadoEm ? new Date(patch.destaqueAtivadoEm).toISOString() : null;
    if ("novoAtivadoEm" in patch) dbPatch.novo_ativado_em = patch.novoAtivadoEm ? new Date(patch.novoAtivadoEm).toISOString() : null;
    if ("preenchida" in patch) dbPatch.preenchida = patch.preenchida;
    if ("preenchidaEm" in patch) dbPatch.preenchida_em = patch.preenchidaEm ? new Date(patch.preenchidaEm).toISOString() : null;
    if ("dailyStats" in patch) dbPatch.daily_stats = patch.dailyStats;
    // Campos usados na deduplicação do scraper (JSONImporter atualiza a
    // vaga inteira quando acha uma já existente por url_original/
    // impressão digital) — o resto dos campos "de conteúdo" já é
    // coberto pelo loop de BADGE_DB_FIELDS + os campos abaixo.
    if ("empresa" in patch) dbPatch.empresa = patch.empresa;
    if ("cargo" in patch) dbPatch.cargo = patch.cargo;
    if ("cidade" in patch) dbPatch.cidade = patch.cidade;
    if ("provincia" in patch) dbPatch.provincia = patch.provincia;
    if ("salarioHora" in patch) dbPatch.salario_hora = Number(patch.salarioHora) || 0;
    if ("salarioMax" in patch) dbPatch.salario_max = patch.salarioMax ? Number(patch.salarioMax) : null;
    if ("turno" in patch) dbPatch.turno = patch.turno;
    if ("nihongo" in patch) dbPatch.nihongo = patch.nihongo;
    if ("moradia" in patch) dbPatch.moradia = patch.moradia;
    if ("vagaHomens" in patch) dbPatch.vaga_homens = !!patch.vagaHomens;
    if ("vagaMulheres" in patch) dbPatch.vaga_mulheres = !!patch.vagaMulheres;
    if ("conducao" in patch) dbPatch.conducao = patch.conducao;
    if ("tags" in patch) dbPatch.tags = patch.tags || [];
    if ("telefone" in patch) dbPatch.telefone = patch.telefone;
    if ("whatsapp" in patch) dbPatch.whatsapp = patch.whatsapp;
    if ("descricao" in patch) dbPatch.descricao = patch.descricao;
    if ("urlOriginal" in patch) dbPatch.url_original = patch.urlOriginal || null;
    if ("lastSeenAt" in patch) dbPatch.last_seen_at = patch.lastSeenAt ? new Date(patch.lastSeenAt).toISOString() : null;
    if ("arquivada" in patch) dbPatch.arquivada = !!patch.arquivada;
    if ("indicacao" in patch) dbPatch.indicacao = !!patch.indicacao;
    if ("indicacoesAtiva" in patch) dbPatch.indicacoes_ativa = !!patch.indicacoesAtiva;
    for (const [jsKey, dbKey] of Object.entries(BADGE_DB_FIELDS)) {
      if (jsKey in patch) dbPatch[dbKey] = patch[jsKey];
    }
    await supabaseRequest(`vagas?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(dbPatch), prefer: "return=minimal" });
  },
  async deleteJob(id) {
    await supabaseRequest(`vagas?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
  },
  async incrementClicks(id) {
    await supabaseRequest("rpc/increment_vaga_clicks", { method: "POST", body: JSON.stringify({ vaga_id: id }), prefer: "return=minimal" });
  },
  async fetchBanner() {
    const rows = await supabaseRequest("banner?select=*&id=eq.1");
    if (!rows?.[0]) return null;
    return { mode: rows[0].mode, text: rows[0].text || "", imageUrl: rows[0].image_url || null };
  },
  async upsertBanner(banner) {
    await supabaseRequest("banner?id=eq.1", {
      method: "PATCH",
      body: JSON.stringify({ mode: banner.mode, text: banner.text, image_url: banner.imageUrl }),
      prefer: "return=minimal",
    });
  },
  // Usa a tabela `comunidade_banner` (singleton igual à `banner`) do
  // supabase-schema.sql (v17).
  async fetchCommunityBanner() {
    const rows = await supabaseRequest("comunidade_banner?select=*&id=eq.1");
    if (!rows?.[0]) return null;
    return { mode: rows[0].mode, text: rows[0].text || "", imageUrl: rows[0].image_url || null, enabled: rows[0].enabled !== false };
  },
  async upsertCommunityBanner(banner) {
    await supabaseRequest("comunidade_banner?id=eq.1", {
      method: "PATCH",
      body: JSON.stringify({ mode: banner.mode, text: banner.text, image_url: banner.imageUrl, enabled: banner.enabled !== false }),
      prefer: "return=minimal",
    });
  },
  // Usa a tabela `alerta_banner` (singleton igual à `banner`) do supabase-schema.sql (v8).
  async fetchAlertBanner() {
    const rows = await supabaseRequest("alerta_banner?select=*&id=eq.1");
    if (!rows?.[0]) return null;
    return { text: rows[0].text || "", enabled: !!rows[0].enabled };
  },
  async upsertAlertBanner(config) {
    await supabaseRequest("alerta_banner?id=eq.1", {
      method: "PATCH",
      body: JSON.stringify({ text: config.text, enabled: config.enabled }),
      prefer: "return=minimal",
    });
  },
  // Usa a tabela `alertas_vagas` do supabase-schema.sql (v8).
  async fetchAlertSubscriptions() {
    const rows = await supabaseRequest("alertas_vagas?select=*&order=created_at.desc");
    return (rows || []).map((r) => ({
      id: r.id, provincia: r.provincia, sexo: r.sexo, nihongo: r.nihongo,
      whatsapp: r.whatsapp, createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    }));
  },
  async insertAlertSubscription(sub) {
    const rows = await supabaseRequest("alertas_vagas", {
      method: "POST",
      body: JSON.stringify({ provincia: sub.provincia, sexo: sub.sexo, nihongo: sub.nihongo, whatsapp: sub.whatsapp }),
    });
    const r = rows[0];
    return { id: r.id, provincia: r.provincia, sexo: r.sexo, nihongo: r.nihongo, whatsapp: r.whatsapp, createdAt: new Date(r.created_at).getTime() };
  },
  // Usa a tabela `site_stats` do supabase-schema.sql (v14) — singleton
  // (id=1) com uma única coluna jsonb guardando todo o objeto de
  // estatísticas, mesmo padrão simplificado de "banner"/"alerta_banner".
  async fetchSiteStats() {
    const rows = await supabaseRequest("site_stats?select=*&id=eq.1");
    return rows?.[0]?.data || null;
  },
  async upsertSiteStats(stats) {
    await supabaseRequest("site_stats?id=eq.1", {
      method: "PATCH",
      body: JSON.stringify({ data: stats }),
      prefer: "return=minimal",
    });
  },
  // Usa a tabela `comunidade_conteudo` do supabase-schema.sql (v15).
  async fetchCommunityContent() {
    const rows = await supabaseRequest("comunidade_conteudo?select=*&order=created_at.desc");
    return (rows || []).map((r) => ({
      id: r.id, categoria: r.categoria, titulo: r.titulo, descricao: r.descricao,
      youtubeId: r.youtube_id, createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    }));
  },
  async insertCommunityContent(item) {
    const rows = await supabaseRequest("comunidade_conteudo", {
      method: "POST",
      body: JSON.stringify({ categoria: item.categoria, titulo: item.titulo, descricao: item.descricao, youtube_id: item.youtubeId }),
    });
    const r = rows[0];
    return { id: r.id, categoria: r.categoria, titulo: r.titulo, descricao: r.descricao, youtubeId: r.youtube_id, createdAt: new Date(r.created_at).getTime() };
  },
  async deleteCommunityContent(id) {
    await supabaseRequest(`comunidade_conteudo?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
  },
  // Usa as tabelas `service_categories`, `service_listings` do
  // supabase-schema.sql (v16).
  async fetchServiceCategories() {
    const rows = await supabaseRequest("service_categories?select=*&order=created_at.asc");
    return (rows || []).map((r) => ({ nome: r.nome, color: r.color || "blue", icon: r.icon || "Building2" }));
  },
  async upsertServiceCategories(categories) {
    // "Substitui tudo" — mais simples e seguro do que tentar diffar (a
    // lista de categorias costuma ser pequena e mudar raramente).
    await supabaseRequest("service_categories", { method: "DELETE", prefer: "return=minimal" }).catch(() => {});
    if (categories.length) {
      await supabaseRequest("service_categories", {
        method: "POST",
        body: JSON.stringify(categories.map((c) => ({ nome: c.nome, color: c.color, icon: c.icon }))),
        prefer: "return=minimal",
      });
    }
  },
  async fetchServiceListings() {
    const rows = await supabaseRequest("service_listings?select=*&order=created_at.desc");
    return (rows || []).map((r) => ({
      id: r.id, providerId: r.provider_id, categoria: r.categoria, nome: r.nome,
      descricao: r.descricao, whatsapp: r.whatsapp, likes: r.likes ?? 0,
      status: r.status || "publicado", createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    }));
  },
  async insertServiceListing(item) {
    const rows = await supabaseRequest("service_listings", {
      method: "POST",
      body: JSON.stringify({
        provider_id: item.providerId, categoria: item.categoria, nome: item.nome,
        descricao: item.descricao, whatsapp: item.whatsapp, likes: item.likes || 0, status: item.status || "publicado",
      }),
    });
    const r = rows[0];
    return { id: r.id, providerId: r.provider_id, categoria: r.categoria, nome: r.nome, descricao: r.descricao, whatsapp: r.whatsapp, likes: r.likes ?? 0, status: r.status, createdAt: new Date(r.created_at).getTime() };
  },
  async updateServiceListing(id, patch) {
    const dbPatch = {};
    if ("categoria" in patch) dbPatch.categoria = patch.categoria;
    if ("nome" in patch) dbPatch.nome = patch.nome;
    if ("descricao" in patch) dbPatch.descricao = patch.descricao;
    if ("whatsapp" in patch) dbPatch.whatsapp = patch.whatsapp;
    if ("likes" in patch) dbPatch.likes = patch.likes;
    if ("status" in patch) dbPatch.status = patch.status;
    await supabaseRequest(`service_listings?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(dbPatch), prefer: "return=minimal" });
  },
  async deleteServiceListing(id) {
    await supabaseRequest(`service_listings?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
  },
  // Usa a tabela `planos` do supabase-schema.sql (v11).
  async fetchPlanos() {
    const rows = await supabaseRequest("planos?select=*");
    if (!rows?.length) return null;
    const planos = {};
    rows.forEach((r) => {
      planos[r.id] = {
        label: r.label,
        preco: r.preco,
        precoOriginal: r.preco_original || null,
        stripeLink: r.stripe_link || "",
        cotaTopo: r.cota_topo,
        cotaRecomendado: r.cota_recomendado,
        cotaUrgente: r.cota_urgente,
        iaLiberada: !!r.ia_liberada,
        seloVerificado: !!r.selo_verificado,
        metricas: !!r.metricas,
      };
    });
    return planos;
  },
  async upsertPlanos(planos) {
    const rows = Object.entries(planos).map(([id, p]) => ({
      id,
      label: p.label,
      preco: p.preco,
      preco_original: p.precoOriginal || null,
      stripe_link: p.stripeLink || "",
      cota_topo: p.cotaTopo,
      cota_recomendado: p.cotaRecomendado,
      cota_urgente: p.cotaUrgente,
      ia_liberada: p.iaLiberada,
      selo_verificado: p.seloVerificado,
      metricas: !!p.metricas,
    }));
    await supabaseRequest("planos", {
      method: "POST",
      body: JSON.stringify(rows),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  },
  // Usa a tabela `parceiros` do supabase-schema.sql (v5) — ainda não
  // existe até você rodar o SQL atualizado.
  async fetchPartners() {
    const rows = await supabaseRequest("parceiros?select=*");
    if (!rows?.length) return null;
    return rows.map((r) => ({
      id: r.id,
      tipo: r.tipo,
      name: r.name,
      email: r.email,
      password: r.password, // ⚠️ texto puro — troque por Supabase Auth antes de ir pra produção de verdade
      phonePt: r.phone_pt || "",
      phoneJp: r.phone_jp || "",
      planKey: r.plan_key,
      seloVerificado: !!r.selo_verificado,
    }));
  },
  async upsertPartners(partners) {
    const rows = partners.map((p) => ({
      id: p.id,
      tipo: p.tipo,
      name: p.name,
      email: p.email,
      password: p.password,
      phone_pt: p.phonePt,
      phone_jp: p.phoneJp,
      plan_key: p.planKey,
      selo_verificado: p.seloVerificado,
    }));
    await supabaseRequest("parceiros", {
      method: "POST",
      body: JSON.stringify(rows),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  },
  // upsertPartners (acima) NUNCA apaga linha nenhuma — é um upsert puro
  // (insere/atualiza por ID). Excluir um parceiro de verdade do banco
  // precisa desse DELETE explícito.
  async deletePartner(id) {
    await supabaseRequest(`parceiros?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
  },
  // Usa a tabela `indicacoes_config` (singleton igual à `banner`) do
  // supabase-schema.sql (v22) — texto do hero + regra de idade da aba Indicações.
  async fetchIndicacoesConfig() {
    const rows = await supabaseRequest("indicacoes_config?select=*&id=eq.1");
    if (!rows?.[0]) return null;
    const r = rows[0];
    return {
      eyebrow: r.eyebrow || "",
      titulo: r.titulo || "",
      subtitulo: r.subtitulo || "",
      idadeMinima: r.idade_minima ?? 55,
      whatsappIndicar: r.whatsapp_indicar || "",
    };
  },
  async upsertIndicacoesConfig(config) {
    await supabaseRequest("indicacoes_config?id=eq.1", {
      method: "PATCH",
      body: JSON.stringify({
        eyebrow: config.eyebrow,
        titulo: config.titulo,
        subtitulo: config.subtitulo,
        idade_minima: config.idadeMinima,
        whatsapp_indicar: config.whatsappIndicar,
      }),
      prefer: "return=minimal",
    });
  },
};



// Sempre "pronto" nesse projeto — não existe mais alternância
// claude/supabase, é sempre Supabase de verdade aqui.
export const backendReady = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function fetchJobsFromDB() { return supabaseAdapter.fetchJobs(); }
export async function insertJobToDB(job) { return supabaseAdapter.insertJob(job); }
export async function insertJobsBulkToDB(jobsArr) { return supabaseAdapter.insertJobsBulk(jobsArr); }
export async function updateJobInDB(id, patch) { return supabaseAdapter.updateJob(id, patch); }
export async function deleteJobFromDB(id) { return supabaseAdapter.deleteJob(id); }
export async function incrementClicksInDB(id) { return supabaseAdapter.incrementClicks(id); }
export async function fetchBannerFromDB() { return supabaseAdapter.fetchBanner(); }
export async function upsertBannerInDB(banner) { return supabaseAdapter.upsertBanner(banner); }
export async function fetchCommunityBannerFromDB() { return supabaseAdapter.fetchCommunityBanner(); }
export async function upsertCommunityBannerInDB(banner) { return supabaseAdapter.upsertCommunityBanner(banner); }
export async function fetchAlertBannerFromDB() { return supabaseAdapter.fetchAlertBanner(); }
export async function upsertAlertBannerInDB(config) { return supabaseAdapter.upsertAlertBanner(config); }
export async function fetchAlertSubscriptionsFromDB() { return supabaseAdapter.fetchAlertSubscriptions(); }
export async function insertAlertSubscriptionToDB(sub) { return supabaseAdapter.insertAlertSubscription(sub); }
export async function fetchSiteStatsFromDB() { return supabaseAdapter.fetchSiteStats(); }
export async function upsertSiteStatsInDB(stats) { return supabaseAdapter.upsertSiteStats(stats); }
export async function fetchCommunityContentFromDB() { return supabaseAdapter.fetchCommunityContent(); }
export async function insertCommunityContentToDB(item) { return supabaseAdapter.insertCommunityContent(item); }
export async function deleteCommunityContentFromDB(id) { return supabaseAdapter.deleteCommunityContent(id); }
export async function fetchServiceCategoriesFromDB() { return supabaseAdapter.fetchServiceCategories(); }
export async function upsertServiceCategoriesInDB(categories) { return supabaseAdapter.upsertServiceCategories(categories); }
export async function fetchServiceListingsFromDB() { return supabaseAdapter.fetchServiceListings(); }
export async function insertServiceListingToDB(item) { return supabaseAdapter.insertServiceListing(item); }
export async function updateServiceListingInDB(id, patch) { return supabaseAdapter.updateServiceListing(id, patch); }
export async function deleteServiceListingFromDB(id) { return supabaseAdapter.deleteServiceListing(id); }
export async function fetchPlanosFromDB() { return supabaseAdapter.fetchPlanos(); }
export async function upsertPlanosInDB(planos) { return supabaseAdapter.upsertPlanos(planos); }
export async function fetchPartnersFromDB() { return supabaseAdapter.fetchPartners(); }
export async function upsertPartnersInDB(partners) { return supabaseAdapter.upsertPartners(partners); }
export async function deletePartnerFromDB(id) { return supabaseAdapter.deletePartner(id); }
export async function fetchIndicacoesConfigFromDB() { return supabaseAdapter.fetchIndicacoesConfig(); }
export async function upsertIndicacoesConfigInDB(config) { return supabaseAdapter.upsertIndicacoesConfig(config); }
