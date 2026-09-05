export const NIHONGO_LEVELS = ["Básico", "Intermediário", "Conversação", "Avançado"];

export const FAVORITES_STORAGE_KEY = "favorite-jobs";
export const SERVICE_LIKES_STORAGE_KEY = "service-likes";

export const ADMIN_TOOL_TITLES = {
  planos: "Planos (Configuração/Teste)",
  publicador: "Publicador Mágico",
  comunicados: "Comunicados / Banner",
  vagas: "Todas as Vagas",
  estatisticas: "Estatísticas de Uso",
  comunidade: "Comunidade (Vídeos)",
  prestadores: "Prestadores de Serviço",
  indicacoes: "Indicações (55+)",
};

export const MAIN_TAB_LABELS = {
  vagas: "Vagas",
  empreiteiras: "Rankings",
  calculadora: "Calculadora",
  comunidade: "Comunidade",
  indicacoes: "Indicações",
  minhaempresa: "Minha Empresa",
  admin: "Painel Admin",
};

// Config padrão da aba Indicações antes de carregar do Supabase (mesmo
// texto do mockup aprovado) — evita tela vazia/flash no primeiro render.
export const INDICACOES_CONFIG_DEFAULT = {
  eyebrow: "Uma campanha da comunidade",
  titulo: "Depois dos 55, achar vaga não devia ser tão difícil",
  subtitulo: "Vimos gente comentando isso num grupo do Facebook. Então criamos um jeito de quem já trabalha ajudar quem ainda está procurando — direto, sem burocracia.",
  idadeMinima: 55,
  whatsappIndicar: "",
};
