// ---------------------------------------------------------------
// Configuração padrão dos planos de assinatura — usado como valor
// inicial até o Admin salvar alguma alteração (o dado de verdade fica
// no Supabase, tabela "planos").
// ---------------------------------------------------------------

export const PLANOS_DEFAULT = {
  gratis: { label: "Grátis", preco: 0, cotaTopo: 0, cotaRecomendado: 1, cotaUrgente: 0, iaLiberada: true, seloVerificado: false, metricas: false },
  start: { label: "Start", preco: 15000, cotaTopo: 0, cotaRecomendado: 3, cotaUrgente: 0, iaLiberada: true, seloVerificado: true, metricas: false },
  pro: { label: "Pro", preco: 30000, cotaTopo: 2, cotaRecomendado: 999, cotaUrgente: 999, iaLiberada: true, seloVerificado: true, metricas: true },
  master: { label: "Master", preco: 50000, cotaTopo: 5, cotaRecomendado: 999, cotaUrgente: 999, iaLiberada: true, seloVerificado: true, metricas: true },
};

// Ordem de exibição fixa dos planos nas telas de Admin.
export const PLANOS_ORDER = ["gratis", "start", "pro", "master"];
