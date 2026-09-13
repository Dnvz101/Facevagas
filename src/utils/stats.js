// ---------------------------------------------------------------
// Estatísticas de desempenho de selo — taxa de contato e multiplicador
// de impacto (usado no Dashboard da Empresa e nas Estatísticas do
// Admin).
// ---------------------------------------------------------------

// Taxa de contato (cliques/visualizações) só das vagas que têm um selo
// específico ligado agora — pensado pra empresa enxergar se cada selo
// realmente traz mais gente clicando em "WhatsApp", ou se não faz
// diferença nenhuma. "rate" fica null quando não há visualizações
// suficientes ainda (nenhuma vaga com esse selo, ou 0 views) — mostrado
// como "—" na tela, evitando um "0%" ou porcentagem sem sentido.
export function computeBadgeStats(jobs, key) {
  const badged = jobs.filter((j) => j[key]);
  const clicks = badged.reduce((s, j) => s + (j.clicks || 0), 0);
  const views = badged.reduce((s, j) => s + (j.views || 0), 0);
  const rate = views > 0 ? Math.round((clicks / views) * 100) : null;
  return { count: badged.length, clicks, views, rate };
}

// Multiplicador de impacto — compara a taxa de contato (cliques/views)
// de quem TEM o selo/condição vs. quem NÃO TEM, no site inteiro.
// Ex: 2.3 significa "esses cards recebem 2,3x mais cliques". Fica null
// quando falta dado de um dos dois lados (grupo vazio, poucas
// visualizações, ou taxa "sem" praticamente zero).
//
// ⚠️ MIN_VIEWS_PARA_CONFIAR existe pra evitar um número absurdo tipo
// "279.7x" — achado ao vivo: um grupo com poucas visualizações (ex: 3
// views, 1 clique = taxa de 33%) dividindo outro também pequeno gera
// uma proporção instável que não significa nada de verdade. Exigir um
// mínimo de amostra dos dois lados é o jeito certo de evitar isso, não
// só checar "diferente de zero".
const MIN_VIEWS_PARA_CONFIAR = 20;

export function computeImpactMultiplier(jobs, matcher) {
  const withGroup = jobs.filter(matcher);
  const withoutGroup = jobs.filter((j) => !matcher(j));
  const rateOf = (arr) => {
    const clicks = arr.reduce((s, j) => s + (j.clicks || 0), 0);
    const views = arr.reduce((s, j) => s + (j.views || 0), 0);
    return views >= MIN_VIEWS_PARA_CONFIAR ? clicks / views : null;
  };
  const rateWith = rateOf(withGroup);
  const rateWithout = rateOf(withoutGroup);
  if (rateWith === null || rateWithout === null || rateWithout === 0) return null;
  return rateWith / rateWithout;
}
