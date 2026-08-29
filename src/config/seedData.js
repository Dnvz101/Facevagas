// ---------------------------------------------------------------
// Dados de teste (seed) — parceiros, categorias/anúncios de prestador
// e vagas. Usados como estado inicial ANTES do Supabase carregar (ou
// se ele estiver vazio). Trocar "EMPREITEIRA TESTE" etc por dados
// reais é opcional — o Supabase, uma vez populado, manda mais.
// ---------------------------------------------------------------

import { uid } from "../utils/jobParsing.js";

export const initialRegisteredPartners = [
  {
    id: "seed-jto", tipo: "empreiteira", name: "EMPREITEIRA TESTE", email: "empreiteira@teste.com", password: "123123",
    phonePt: "090-2222-3333", phoneJp: "", planKey: "pro", seloVerificado: true,
  },
  {
    id: "seed-pvision", tipo: "empreiteira", name: "P VISION GROUP", email: "teste@teste.com", password: "123123",
    phonePt: "070-4444-5555", phoneJp: "", planKey: "pro", seloVerificado: true,
  },
  {
    id: "seed-prestador", tipo: "prestador", name: "Konbini Repair Services", email: "prestador@teste.com", password: "123123",
    phonePt: "080-7777-8888", phoneJp: "", planKey: "start", seloVerificado: false,
  },
  {
    id: "seed-loja", tipo: "loja", name: "Mercado Brasil Nagoya", email: "loja@teste.com", password: "123123",
    phonePt: "090-9999-0000", phoneJp: "", planKey: "gratis", seloVerificado: false,
  },
];

// Dados de teste — Prestadores de Serviço da Comunidade (Fase 1, antes
// do cadastro de verdade existir). ~10 prestadores espalhados em ~7
// categorias, pra testar o embaralhamento e o filtro com volume real.
export const SERVICE_CATEGORIES_SEED = [
  { nome: "Tradução", color: "orange", icon: "Languages" },
  { nome: "Mecânica", color: "blue", icon: "Wrench" },
  { nome: "Limpeza", color: "emerald", icon: "Sparkles" },
  { nome: "Contabilidade", color: "violet", icon: "Building2" },
  { nome: "Beleza & Estética", color: "pink", icon: "Scissors" },
  { nome: "Aulas de Japonês", color: "cyan", icon: "GraduationCap" },
  { nome: "Mudança & Transporte", color: "amber", icon: "Truck" },
];
export const SERVICE_LISTINGS_SEED = [
  { id: "svc-1", providerId: null, categoria: "Tradução", nome: "Camila Traduções JP-PT", descricao: "Tradução juramentada e simples de documentos, contratos e certidões.", whatsapp: "090-1111-2222", likes: 4, status: "publicado", createdAt: Date.now() },
  { id: "svc-2", providerId: null, categoria: "Mecânica", nome: "Oficina do Kenji", descricao: "Reparo geral, troca de óleo e revisão pra shaken.", whatsapp: "080-2222-3333", likes: 7, status: "publicado", createdAt: Date.now() },
  { id: "svc-3", providerId: null, categoria: "Limpeza", nome: "Limpeza Brasil Nagoya", descricao: "Faxina residencial e pós-obra, equipe própria e de confiança.", whatsapp: "070-3333-4444", likes: 2, status: "publicado", createdAt: Date.now() },
  { id: "svc-4", providerId: null, categoria: "Contabilidade", nome: "Contabilidade Sato & Silva", descricao: "Declaração de imposto de renda (kakutei shinkoku) e abertura de MEI japonês.", whatsapp: "090-4444-5555", likes: 9, status: "publicado", createdAt: Date.now() },
  { id: "svc-5", providerId: null, categoria: "Beleza & Estética", nome: "Studio Beleza Tropical", descricao: "Corte, escova progressiva e design de sobrancelha.", whatsapp: "080-5555-6666", likes: 5, status: "publicado", createdAt: Date.now() },
  { id: "svc-6", providerId: null, categoria: "Aulas de Japonês", nome: "Sensei Marina - Aulas de Nihongo", descricao: "Aulas particulares online e presenciais, do básico ao N2.", whatsapp: "070-6666-7777", likes: 11, status: "publicado", createdAt: Date.now() },
  { id: "svc-7", providerId: null, categoria: "Mudança & Transporte", nome: "Mudanças Express JP", descricao: "Fretes e mudanças em toda a região de Aichi e Gifu.", whatsapp: "090-7777-8888", likes: 3, status: "publicado", createdAt: Date.now() },
  { id: "svc-8", providerId: null, categoria: "Tradução", nome: "Tradutor Paulo Yamada", descricao: "Acompanhamento em consultas médicas, bancos e prefeitura.", whatsapp: "080-8888-9999", likes: 6, status: "publicado", createdAt: Date.now() },
  { id: "svc-9", providerId: null, categoria: "Mecânica", nome: "Auto Center Brasil", descricao: "Especializado em carros importados e revisão completa.", whatsapp: "070-9999-0000", likes: 1, status: "publicado", createdAt: Date.now() },
  { id: "svc-10", providerId: null, categoria: "Beleza & Estética", nome: "Salão da Fernanda", descricao: "Manicure, pedicure e tranças, atendimento em domicílio.", whatsapp: "090-0000-1111", likes: 8, status: "publicado", createdAt: Date.now() },
];

export const initialJobs = [
  {
    id: uid(), empresa: "EMPREITEIRA A-GOG", cargo: "Separação de peças e transporte com empilhadeira",
    cidade: "Nagoya-shi, Atsuta-ku", provincia: "Aichi", salarioHora: 1450, turno: "Diurno / 2 turnos (08:30 às 17:30 / 20:30 às 29:30)",
    nihongo: "Básico", moradia: "Não incluída", vagaHomens: true, vagaMulheres: false,
    conducao: "Não necessária", tags: ["Empilhadeira", "Exclusivo Homens", "2 Turnos", "Aichi"],
    whatsapp: "080-1111-2222", telefone: "080-1111-2222",
    descricao: "Vaga exclusiva para homens em Nagoya-shi, Atsuta-ku. Separação de peças e transporte usando empilhadeira counter. Peças de 5 a 15 kg. Folgas aos fins de semana. Requer licença de empilhadeira e experiência.",
    status: "publicado", clicks: 27, isTopSalario: false, isRecomendado: true, isUrgente: false, isFixado: false, seloVerificado: true,
  },
  {
    id: uid(), empresa: "EMPREITEIRA TESTE", cargo: "Autopeças",
    cidade: "Toyota", provincia: "Aichi", salarioHora: 1850, turno: "Acima de 40% de hora extra",
    nihongo: "Intermediário", moradia: "Apartamento fornecido", vagaHomens: true, vagaMulheres: true,
    conducao: "Necessária", tags: ["Autopeças", "Toyota", "Aichi", "Apartamento"],
    whatsapp: "090-2222-3333", telefone: "090-2222-3333",
    descricao: "Montagem e inspeção de autopeças em linha de produção na região de Toyota. Empresa oferece apartamento próprio a preço reduzido e treinamento interno para iniciantes.",
    status: "publicado", clicks: 41, isTopSalario: true, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: false,
  },
  {
    id: uid(), empresa: "TOYOTA MOTOMACHI", cargo: "Operador de Lifto e Ereka",
    cidade: "Toyota", provincia: "Aichi", salarioHora: 1500, turno: "Nikoutai (06:25~15:15 / 16:40~01:30)",
    nihongo: "Conversação diária", moradia: "Não incluída", vagaHomens: true, vagaMulheres: true,
    conducao: "Necessária", tags: ["Lifto", "Ereka", "Toyota", "Nikoutai", "Com experiência"],
    whatsapp: "090-3333-4444", telefone: "090-3333-4444",
    descricao: "Operação de lifto e ereka na linha de produção da Toyota Motomachi. Sistema de dois turnos. Necessário nihongo para conversação diária e experiência prévia no equipamento.",
    status: "publicado", clicks: 15, isTopSalario: false, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: true,
  },
  {
    id: uid(), empresa: "P VISION GROUP", cargo: "Montagem de pneus",
    cidade: "Yatomi", provincia: "Aichi", salarioHora: 1700, turno: "Diurno (8:25~17:30)",
    nihongo: "Básico", moradia: "Não incluída", vagaHomens: true, vagaMulheres: false,
    conducao: "Necessária", tags: ["Pneus", "Homens", "Temporário", "Diurno", "Montagem"],
    whatsapp: "070-4444-5555", telefone: "070-4444-5555",
    descricao: "Vaga temporária para montagem de pneus em linha automatizada. Cerca de 40% de horas extras disponíveis. Trabalho em pé durante todo o turno.",
    status: "publicado", clicks: 33, isTopSalario: true, isRecomendado: true, isUrgente: true, isFixado: false, seloVerificado: true,
  },
  {
    id: uid(), empresa: "SAKAI KOGYO", cargo: "Inspeção de peças metálicas",
    cidade: "Kariya", provincia: "Aichi", salarioHora: 1600, turno: "Diurno (08:00~17:00)",
    nihongo: "Básico", moradia: "Não incluída", vagaHomens: true, vagaMulheres: true,
    conducao: "Não necessária", tags: ["Inspeção", "Kariya", "Diurno", "Iniciantes"],
    whatsapp: "080-5555-6666", telefone: "080-5555-6666",
    descricao: "Inspeção visual de peças metálicas usinadas, uso de paquímetro básico. Treinamento oferecido. Ônibus fretado a partir de pontos combinados na região de Kariya.",
    status: "publicado", clicks: 8, isTopSalario: true, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: false,
  },
  {
    id: uid(), empresa: "EMPREITEIRA HAYASHI", cargo: "Linha de produção de alimentos",
    cidade: "Handa", provincia: "Aichi", salarioHora: 1350, turno: "Nikoutai (06:00~15:00 / 15:00~24:00)",
    nihongo: "Básico", moradia: "Dormitório disponível", vagaHomens: true, vagaMulheres: true,
    conducao: "Não necessária", tags: ["Alimentos", "Nikoutai", "Dormitório", "Handa"],
    whatsapp: "090-6666-7777", telefone: "090-6666-7777",
    descricao: "Trabalho em linha de produção de alimentos processados. Ambiente refrigerado, uniforme e touca fornecidos. Dormitório disponível para quem vier de outra província.",
    status: "publicado", clicks: 52, isTopSalario: false, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: false,
  },
  // ---- Vagas extras de teste: mais províncias, salários e perfis, pra
  // dar pra testar de verdade os Top 5 (Zero Nihongo / Maiores Salários /
  // Com Mukae) e o filtro de província na aba "Rankings".
  {
    id: uid(), empresa: "SHIZUOKA FOODS", cargo: "Embalagem de alimentos congelados",
    cidade: "Hamamatsu", provincia: "Shizuoka", salarioHora: 1250, turno: "Diurno (08:00~17:00)",
    nihongo: "Básico", moradia: "Não incluída", vagaHomens: true, vagaMulheres: true,
    conducao: "Não necessária", tags: ["Alimentos", "Embalagem", "Mukae disponível"],
    whatsapp: "080-1010-2020", telefone: "080-1010-2020",
    descricao: "Embalagem de alimentos congelados em ambiente refrigerado. Empresa busca de van até o ponto de ônibus mais próximo (mukae/okuri).",
    status: "publicado", clicks: 19, isTopSalario: false, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: false,
  },
  {
    id: uid(), empresa: "TOKYO LOGISTICS", cargo: "Separação de encomendas em centro de distribuição",
    cidade: "Ota-ku", provincia: "Tóquio", salarioHora: 1650, turno: "Nikoutai (07:00~16:00 / 16:00~01:00)",
    nihongo: "Básico", moradia: "Não incluída", vagaHomens: true, vagaMulheres: true,
    conducao: "Não necessária", tags: ["Logística", "Centro de Distribuição", "Transporte gratuito"],
    whatsapp: "090-1111-3333", telefone: "090-1111-3333",
    descricao: "Separação e conferência de encomendas em centro de distribuição de e-commerce. Transporte gratuito da estação até o local de trabalho.",
    status: "publicado", clicks: 61, isTopSalario: true, isRecomendado: true, isUrgente: false, isFixado: false, seloVerificado: false,
  },
  {
    id: uid(), empresa: "OSAKA AUTO PARTS", cargo: "Soldador de peças automotivas",
    cidade: "Higashiosaka", provincia: "Osaka", salarioHora: 2100, turno: "Diurno (08:30~17:30)",
    nihongo: "Avançado", moradia: "Apartamento fornecido", vagaHomens: true, vagaMulheres: false,
    conducao: "Necessária", tags: ["Solda", "Autopeças", "Experiência exigida"],
    whatsapp: "090-2222-4444", telefone: "090-2222-4444",
    descricao: "Soldagem de peças automotivas em linha de produção. Requer certificação de solda e japonês avançado para leitura de desenhos técnicos.",
    status: "publicado", clicks: 12, isTopSalario: true, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: true,
  },
  {
    id: uid(), empresa: "KANAGAWA BENTO CO.", cargo: "Montagem de marmitas (bento)",
    cidade: "Yokohama", provincia: "Kanagawa", salarioHora: 1150, turno: "Diurno (06:00~15:00)",
    nihongo: "Básico", moradia: "Não incluída", vagaHomens: true, vagaMulheres: true,
    conducao: "Não necessária", tags: ["Alimentos", "Bento", "Mukae disponível", "Iniciantes"],
    whatsapp: "080-3333-5555", telefone: "080-3333-5555",
    descricao: "Montagem de marmitas em linha de produção. Não exige experiência nem japonês. Van da empresa busca em pontos combinados (mukae).",
    status: "publicado", clicks: 24, isTopSalario: false, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: false,
  },
  {
    id: uid(), empresa: "GIFU SEIKI", cargo: "Operador de máquina CNC",
    cidade: "Ogaki", provincia: "Gifu", salarioHora: 1900, turno: "Nikoutai (06:20~15:10 / 15:10~24:00)",
    nihongo: "Intermediário", moradia: "Dormitório disponível", vagaHomens: true, vagaMulheres: true,
    conducao: "Necessária", tags: ["CNC", "Usinagem", "Dormitório"],
    whatsapp: "090-4444-6666", telefone: "090-4444-6666",
    descricao: "Operação de máquinas CNC para usinagem de peças de precisão. Treinamento interno oferecido, mas japonês intermediário é necessário para seguir instruções.",
    status: "publicado", clicks: 7, isTopSalario: true, isRecomendado: false, isUrgente: true, isFixado: false, seloVerificado: false,
  },
  {
    id: uid(), empresa: "MIE HARVEST", cargo: "Colheita e seleção de vegetais",
    cidade: "Yokkaichi", provincia: "Mie", salarioHora: 1050, turno: "Diurno (07:00~16:00)",
    nihongo: "Básico", moradia: "Não incluída", vagaHomens: true, vagaMulheres: true,
    conducao: "Não necessária", tags: ["Agrícola", "Colheita", "Mukae disponível"],
    whatsapp: "080-5555-7777", telefone: "080-5555-7777",
    descricao: "Colheita e seleção de vegetais em estufa. Trabalho ao ar livre/estufa, sem exigência de japonês. Transporte da empresa disponível.",
    status: "publicado", clicks: 33, isTopSalario: false, isRecomendado: true, isUrgente: false, isFixado: false, seloVerificado: false,
  },
  {
    id: uid(), empresa: "SAITAMA ELECTRONICS", cargo: "Montagem de placas eletrônicas",
    cidade: "Kawaguchi", provincia: "Saitama", salarioHora: 1550, turno: "Diurno (08:30~17:15)",
    nihongo: "Básico", moradia: "Não incluída", vagaHomens: true, vagaMulheres: true,
    conducao: "Não necessária", tags: ["Eletrônica", "Montagem", "Transporte gratuito"],
    whatsapp: "090-6666-8888", telefone: "090-6666-8888",
    descricao: "Montagem manual de componentes em placas eletrônicas. Trabalho sentado, minucioso. Ônibus fretado da estação até a fábrica.",
    status: "publicado", clicks: 45, isTopSalario: false, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: false,
  },
  {
    id: uid(), empresa: "CHIBA PORT LOGISTICS", cargo: "Conferente de carga portuária",
    cidade: "Ichikawa", provincia: "Chiba", salarioHora: 1800, turno: "Nikoutai (06:00~15:00 / 15:00~24:00)",
    nihongo: "Conversação", moradia: "Não incluída", vagaHomens: true, vagaMulheres: false,
    conducao: "Necessária", tags: ["Logística", "Porto", "Carga"],
    whatsapp: "080-7777-9999", telefone: "080-7777-9999",
    descricao: "Conferência e organização de cargas na área portuária. Necessário nihongo para conversação com a equipe e leitura de manifestos.",
    status: "publicado", clicks: 5, isTopSalario: true, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: false,
  },
  {
    id: uid(), empresa: "AICHI STEEL WORKS", cargo: "Ajudante de linha de produção de aço",
    cidade: "Tokai", provincia: "Aichi", salarioHora: 1400, turno: "Diurno (08:00~17:00)",
    nihongo: "Básico", moradia: "Dormitório disponível", vagaHomens: true, vagaMulheres: false,
    conducao: "Não necessária", tags: ["Metalurgia", "Ajudante Geral", "Mukae disponível", "Dormitório"],
    whatsapp: "090-8888-0000", telefone: "090-8888-0000",
    descricao: "Ajudante geral em linha de produção de aço. Sem exigência de experiência ou japonês avançado. Empresa oferece dormitório e transporte próprio.",
    status: "publicado", clicks: 38, isTopSalario: false, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: false,
  },
  {
    id: uid(), empresa: "TOKYO WAREHOUSE PLUS", cargo: "Estoquista em galpão de e-commerce",
    cidade: "Adachi-ku", provincia: "Tóquio", salarioHora: 1500, turno: "Diurno (09:00~18:00)",
    nihongo: "Básico", moradia: "Não incluída", vagaHomens: true, vagaMulheres: true,
    conducao: "Não necessária", tags: ["Estoque", "E-commerce", "Mukae disponível"],
    whatsapp: "080-9999-1111", telefone: "080-9999-1111",
    descricao: "Organização e reposição de estoque em galpão de e-commerce. Não exige japonês nem experiência prévia. Van busca em pontos combinados.",
    status: "publicado", clicks: 29, isTopSalario: false, isRecomendado: false, isUrgente: false, isFixado: false, seloVerificado: false,
  },
];
