// ---------------------------------------------------------------
// usePermissions — hook central de cotas de plano (Destaque/Urgente/
// Recomendado). Usado tanto pelo ClientDashboard quanto pelo Admin,
// escopado às vagas certas em cada caso — é o que deixa o sistema
// pronto pra virar multi-tenant de verdade sem duplicar lógica.
// ---------------------------------------------------------------

import { useMemo, useCallback } from "react";

// Mapa: chave do selo (igual a BADGE_DEFS) -> chave de cota correspondente no plano.
// isTopSalario fica de fora de propósito: é automático (salário alto), não é
// um selo "vendido" dentro do plano.
export const QUOTA_BADGE_MAP = {
  isFixado: "cotaTopo",
  isRecomendado: "cotaRecomendado",
  isUrgente: "cotaUrgente",
};

// Companheiro do mapa acima: de qual chave do objeto quotaUsage (retornado
// por usePermissions) ler o consumo atual de cada selo.
export const QUOTA_USAGE_KEY_MAP = {
  isFixado: "fixado",
  isRecomendado: "recomendado",
  isUrgente: "urgente",
};

export function usePermissions(planos, planKey, jobs) {
  const plan = planos[planKey] || planos.gratis;

  const quotaUsage = useMemo(() => {
    return {
      fixado: jobs.filter((j) => j.isFixado).length,
      recomendado: jobs.filter((j) => j.isRecomendado).length,
      urgente: jobs.filter((j) => j.isUrgente).length,
    };
  }, [jobs]);

  // canUseBadge(key): true se AINDA HÁ cota livre pra ligar esse selo.
  // Selos fora do QUOTA_BADGE_MAP (isTopSalario) sempre retornam true.
  const canUseBadge = useCallback(
    (key) => {
      const quotaKey = QUOTA_BADGE_MAP[key];
      if (!quotaKey) return true;
      const used = quotaUsage[QUOTA_USAGE_KEY_MAP[key]] || 0;
      return used < (plan[quotaKey] ?? 0);
    },
    [plan, quotaUsage]
  );

  return { plan, quotaUsage, canUseBadge };
}
