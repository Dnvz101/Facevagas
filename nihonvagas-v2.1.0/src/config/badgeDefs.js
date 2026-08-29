// ---------------------------------------------------------------
// Lista central dos selos controláveis manualmente + os exclusivos
// do Admin (Nova Vaga) — fonte única usada por JobsTable e AIPublisher.
// ---------------------------------------------------------------

import { RecomendadoBadge, UrgenteBadge } from "../components/Badges.jsx";

// Lista central dos selos CONTROLÁVEIS MANUALMENTE — usada tanto no
// Admin (toggles) quanto, no futuro, na Área do Cliente. Adicionar um
// selo novo é só acrescentar uma entrada aqui. isFixado/isRecomendado/
// isUrgente também consomem cota de plano (ver QUOTA_BADGE_MAP).
// 💎 Top Salário NÃO está aqui de propósito: é 100% automático (ver
// isTopSalarioRule), sem toggle em lugar nenhum do Admin.
// 🆕 Nova Vaga (isNovo) também NÃO está aqui de propósito: é exclusivo
// do Admin, então fica de fora do BADGE_DEFS compartilhado com a Área
// do Cliente/Publicador Mágico — ver ADMIN_ONLY_BADGE_DEFS mais abaixo.
export const BADGE_DEFS = [
  { key: "isRecomendado", label: "Recomendado", emoji: "⭐", Component: RecomendadoBadge },
  { key: "isUrgente", label: "Urgente", emoji: "🔥", Component: UrgenteBadge },
  { key: "isFixado", label: "Destaque", emoji: "🔥", Component: null },
];

// Selo(s) exclusivos do Admin — só entram no toggle do JobsTable quando
// ele é renderizado no contexto Admin (prop showNovoBadge). Nunca
// aparecem no formulário do Publicador Mágico nem no JobsTable da Área
// do Cliente, e nunca são setados pela importação em JSON.
export const ADMIN_ONLY_BADGE_DEFS = [
  { key: "isNovo", label: "Nova Vaga", emoji: "🆕", Component: null },
];
