// ---------------------------------------------------------------
// Ciclos automáticos de selo (Destaque = 7 dias, Nova Vaga = 48h) +
// arquivamento automático de vaga "sumida" do scraper.
// ---------------------------------------------------------------

export const DESTAQUE_CYCLE_DAYS = 7;
export const DESTAQUE_CYCLE_MS = DESTAQUE_CYCLE_DAYS * 24 * 60 * 60 * 1000;

// Quantos dias faltam pro ciclo atual terminar (null se não estiver ativo
// ou não tiver timestamp — ex: vagas antigas, de antes dessa regra existir).
export function destaqueDiasRestantes(job) {
  if (!job.isFixado || !job.destaqueAtivadoEm) return null;
  const restanteMs = DESTAQUE_CYCLE_MS - (Date.now() - job.destaqueAtivadoEm);
  return Math.max(0, Math.ceil(restanteMs / (24 * 60 * 60 * 1000)));
}

export function isDestaqueCicloConcluido(job) {
  return !!(job.isFixado && job.destaqueAtivadoEm && Date.now() - job.destaqueAtivadoEm >= DESTAQUE_CYCLE_MS);
}

/* ---------------------------------------------------------------
   Ciclo de 48h do 🆕 Nova Vaga — mesma lógica do Destaque, mas mais
   curta. Liga automaticamente quando uma EMPRESA publica pelo próprio
   Publicador Mágico dela (nunca no Publicador do Admin, nem na
   importação em JSON) e também pode ser ligado manualmente pelo Admin
   na tabela de vagas — os dois casos usam o mesmo relógio de 48h.
--------------------------------------------------------------- */
export const NOVO_CYCLE_HOURS = 48;
export const NOVO_CYCLE_MS = NOVO_CYCLE_HOURS * 60 * 60 * 1000;

export function novoHorasRestantes(job) {
  if (!job.isNovo || !job.novoAtivadoEm) return null;
  const restanteMs = NOVO_CYCLE_MS - (Date.now() - job.novoAtivadoEm);
  return Math.max(0, Math.ceil(restanteMs / (60 * 60 * 1000)));
}

export function isNovoCicloConcluido(job) {
  return !!(job.isNovo && job.novoAtivadoEm && Date.now() - job.novoAtivadoEm >= NOVO_CYCLE_MS);
}

/* ---------------------------------------------------------------
   Arquivamento automático de vaga "sumida" do scraper — se uma vaga
   não aparece de novo em ~3 ciclos de scrape seguidos (o scraper roda
   a cada 2-3 dias, então isso dá uns 7-9 dias sem ser vista), ela
   provavelmente saiu do ar na fonte original. Em vez de deletar, ela
   só some da lista pública (fica arquivada, reversível) — o dado
   nunca é perdido.
   ⚠️ NUNCA mexe em vaga sem lastSeenAt (publicada pela empresa via
   Publicador Mágico ou importada manualmente sem esse campo) nem em
   vaga já reivindicada por uma empresa cadastrada — só afeta vaga
   "crua" que ainda veio só do scraper e ninguém assumiu.
--------------------------------------------------------------- */
export const STALE_THRESHOLD_MS = 9 * 24 * 60 * 60 * 1000; // ~9 dias — 3 ciclos de scrape de 2-3 dias

export function isJobStale(job, registeredPartners) {
  if (job.arquivada) return false; // já arquivada, nada a fazer
  if (job.preenchida) return false; // vaga preenchida não precisa arquivar por cima
  if (!job.lastSeenAt) return false; // nunca foi vista pelo scraper (publicada por empresa, etc) — intocável
  if (Date.now() - job.lastSeenAt < STALE_THRESHOLD_MS) return false;
  const claimed = registeredPartners.some((p) => p.name === job.empresa);
  if (claimed) return false; // empresa já assumiu essa vaga — decisão de mantê-la aberta é dela, não do scraper
  return true;
}
