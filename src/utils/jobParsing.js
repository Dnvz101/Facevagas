// ---------------------------------------------------------------
// Utilitários de parsing de vaga — salário, texto, província,
// deduplicação. Extraído do NihonVagas.jsx original, linha por linha
// (nada recriado de memória, pra não repetir o bug do ícone do
// WhatsApp que aconteceu quando reconstruí um SVG "de cabeça").
// ---------------------------------------------------------------

import { formatYen } from "./format.js";

// Três faixas: valor baixo = por hora, médio = diária, alto = mensal.
// Sem essa terceira faixa, um salário mensal de escritório (tipo
// ¥450.000, comum em vaga administrativa/RH) caía na mesma regra da
// diária e aparecia como "¥450.000/dia" — um valor absurdo. Acima de
// ¥100.000 é sempre mensal, nunca diária.
export function salaryUnitLabel(n) {
  const v = Number(n);
  if (v > 100000) return "mês";
  if (v > 2500) return "dia";
  return "h";
}

// Simplifica o turno pra caber no card compacto — o scraper às vezes traz
// o horário inteiro ("Diurno / 2 turnos (08:30 às 17:30...)"), o que
// estoura a linha e empurra o texto de baixo pra fora do card.
export function simplifyTurno(turno) {
  const t = (turno || "").toLowerCase();
  if (t.includes("nikoutai") || t.includes("altern") || t.includes("2 turno")) return "2 Turnos";
  if (t.includes("notur")) return "Noturno";
  if (t.includes("diurno")) return "Diurno";
  const clean = (turno || "").trim();
  return clean ? (clean.length > 16 ? clean.slice(0, 16).trim() + "…" : clean) : "—";
}

// Às vezes o scraper joga um pedaço de descrição/anúncio no campo cidade
// por engano — se for grande demais pra ser um nome de cidade, ignora.
export const MAX_CIDADE_LEN = 30;
export function safeCidade(cidade) {
  const c = (cidade || "").trim();
  return c && c.length <= MAX_CIDADE_LEN ? c : null;
}

// Mesma ideia do turno — resume o requisito de nihongo pra uma linha curta na frente do card.
export function simplifyNihongo(nihongo) {
  const t = (nihongo || "").toLowerCase();
  if (t.includes("avan") || t.includes("fluente")) return "Avançado";
  if (t.includes("intermedi")) return "Intermediário";
  if (t.includes("convers")) return "Conversação";
  if (t.includes("bás") || t.includes("nenhum") || t.includes("não exig")) return "Básico";
  const clean = (nihongo || "").trim();
  return clean ? (clean.length > 14 ? clean.slice(0, 14).trim() + "…" : clean) : "—";
}

// ---------------------------------------------------------------
// Aba Indicações (campanha 55+) — duas perguntas diferentes:
//  • isIndicacaoQualificavel: o anúncio MENCIONA idade e aceita pelo
//    menos até "idadeMinima" (ou "sem limite" = 999)? É só o critério
//    de elegibilidade — não decide se aparece pro candidato.
//  • isIndicacaoVisivel: aparece de verdade no feed público? Indicação
//    manual (job.indicacao) sempre aparece. Vaga TRADICIONAL só
//    aparece se além de qualificar, o Admin ativou manualmente
//    (job.indicacoesAtiva) — v23: deixou de ser 100% automático.
// ---------------------------------------------------------------
export function isIndicacaoQualificavel(job, idadeMinima = 55) {
  if (!job) return false;
  if (job.idadeMaxima == null) return false;
  if (job.idadeMaxima >= 999) return true;
  return job.idadeMaxima >= idadeMinima;
}

export function isIndicacaoVisivel(job, idadeMinima = 55) {
  if (!job) return false;
  if (job.indicacao) return true;
  return isIndicacaoQualificavel(job, idadeMinima) && !!job.indicacoesAtiva;
}

// Texto amigável do limite de idade pro card da aba Indicações — sempre
// no sentido real do campo (idade MÁXIMA aceita), pra não criar
// ambiguidade tipo "aceita acima de X" (que não é o que o dado guarda).
export function idadeIndicacaoLabel(idadeMaxima) {
  if (idadeMaxima == null) return null;
  return idadeMaxima >= 999 ? "Sem limite de idade" : `Aceita até ${idadeMaxima} anos`;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const DESCRIPTION_MAX_CHARS = 220;

export function clampDescription(text, maxChars = DESCRIPTION_MAX_CHARS) {
  const clean = (text || "").trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/* ---------------------------------------------------------------
   Publicador Mágico — parser local de texto (fallback resiliente)

   Roda em duas situações:
   1) Como REDE DE SEGURANÇA quando a chamada à IA falha (rede caiu,
      API fora do ar, JSON malformado) — nesses casos, em vez de mostrar
      só um erro vermelho e devolver o usuário pro zero, tentamos extrair
      o que der do texto colado com regex/heurísticas.
   2) Como COMPLEMENTO mesmo quando a IA responde bem — preenchendo
      qualquer campo que a IA deixou vazio, e sempre conferindo se o
      valor de salário por hora é plausível (ver reconcileSalary).

   Em qualquer um dos dois casos, a regra de ouro é: nunca falhar
   silenciosamente. Preenche o que encontrar, deixa o resto em branco
   pro usuário completar — nunca trava a tela nem exige tudo de uma vez.
--------------------------------------------------------------- */

// Faixa plausível de salário por hora no Japão. Valores fora dessa faixa
// (tipo ¥500.000 ou ¥1.200.000) quase sempre são prêmio/incentivo, não
// salário — nunca devem ir pro campo de salário por hora.
export const SALARY_HOURLY_MIN = 900;
export const SALARY_HOURLY_MAX = 3500;

// parseSalaryRange — sanitização canônica de salário. Usada tanto na
// importação de JSON (campo salario_hora do scraper) quanto no
// Publicador Mágico. Detecta faixas ("1.500 - 1.600", "1500~1800",
// "1400 a 1600/h") e NUNCA junta os dois números num só (o bug clássico
// de fazer só um replace(/\D/g,"") numa faixa, que vira "15001600").
// Sempre retorna { salarioHora, salarioMax } — salarioMax é null quando
// não há faixa (valor único), garantindo que filtros numéricos e a
// calculadora continuem recebendo só um número em salarioHora.
export function parseSalaryRange(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { salarioHora: 0, salarioMax: null };

  // Dois números separados por hífen, til, "a" ou "até".
  const rangeMatch = text.match(/([\d][\d.,]*)\s*(?:-|~|a\b|até)\s*([\d][\d.,]*)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1].replace(/\D/g, ""), 10) || 0;
    const max = parseInt(rangeMatch[2].replace(/\D/g, ""), 10) || 0;
    if (min && max && max > min) return { salarioHora: min, salarioMax: max };
    if (min) return { salarioHora: min, salarioMax: null }; // faixa malformada — usa só o primeiro número
  }

  // Sem faixa — comportamento de sempre: só limpa os dígitos.
  const single = parseInt(text.replace(/\D/g, ""), 10) || 0;
  return { salarioHora: single, salarioMax: null };
}

// Palavras-chave de benefícios comuns em anúncios de vaga no Japão —
// cada uma que aparecer no texto vira uma tag e, quando fizer sentido,
// também preenche o campo de moradia.
export const BENEFIT_KEYWORDS = [
  { re: /apartamento\s*(gr[aá]tis|gratuito|fornecido|incluso)/i, tag: "Apartamento gratuito", moradia: "Apartamento fornecido" },
  { re: /dormit[oó]rio/i, tag: "Dormitório disponível", moradia: "Dormitório disponível" },
  { re: /transporte\s*(gr[aá]tis|gratuito|fornecido|incluso)/i, tag: "Transporte gratuito" },
  { re: /vale[- ]?refei[cç][aã]o|refeit[oó]rio/i, tag: "Refeitório/Vale-refeição" },
  { re: /seguro\s*(sa[uú]de|social)/i, tag: "Seguro social" },
  { re: /hora\s*extra/i, tag: "Hora extra disponível" },
];

// Lista completa das 47 províncias oficiais do Japão — evita ficar
// adicionando província uma por uma toda vez que aparece um caso não
// coberto (já aconteceu com "Shiga" faltando na lista antiga).
// "Tóquio" e "Tokyo" ficam os dois de propósito — o scraper às vezes
// manda em português, às vezes em inglês/romaji.
export const KNOWN_PROVINCIAS = [
  "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima",
  "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tóquio", "Tokyo", "Kanagawa",
  "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano",
  "Gifu", "Shizuoka", "Aichi", "Mie",
  "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara", "Wakayama",
  "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi",
  "Tokushima", "Kagawa", "Ehime", "Kochi",
  "Fukuoka", "Saga", "Nagasaki", "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa",
];
export const KNOWN_PROVINCIAS_RE = new RegExp(`\\b(${KNOWN_PROVINCIAS.join("|")})\\b`, "i");

// Lista "oficial" de nomes de província, pra distinguir "Aichi" (nome
// único e limpo) de "Aichi e Mie" / "diversas cidades · Aichi e Mie"
// (vaga que atende mais de uma região, texto livre) — essas segundas
// não entram em NENHUMA estatística agrupada por província, porque
// misturariam dado de estados diferentes debaixo de uma "província"
// que não existe de verdade. A vaga continua aparecendo normal na
// lista pública, só fica de fora desse tipo de agregação.
export function isSingleKnownProvince(provincia) {
  const p = (provincia || "").trim().toLowerCase();
  return KNOWN_PROVINCIAS.some((k) => k.toLowerCase() === p);
}

// Normaliza texto de província vindo do scraper — corrige variações
// como "AICHI KEN", "aichi-ken", "Aichi Prefecture" pro nome limpo
// ("Aichi"), sem depender de digitar tudo igual. Se não reconhecer
// nada da lista oficial (ex: veio um texto de outro país por engano,
// tipo "Santa Fe", ou um texto cortado pela metade tipo "Shi"),
// devolve o texto original sem inventar nada — essa vaga só não
// aparece no dropdown de filtro (fica de fora da lista de opções,
// mas continua visível normalmente em "Todas").
export function normalizeProvincia(raw) {
  if (!raw) return raw;
  const cleaned = raw.trim().replace(/[-\s]?ken$/i, "").replace(/\s+prefecture$/i, "").trim();
  const match = KNOWN_PROVINCIAS.find((k) => k.toLowerCase() === cleaned.toLowerCase());
  return match || raw.trim();
}

// Varre texto livre atrás de valores em ¥: primeiro procura uma FAIXA
// plausível de salário por hora ("¥1.500 ~ ¥1.600/h", "¥1.500-1.600/h");
// se achar, os dois números viram salarioHora/salarioMax e são retirados
// do texto antes de procurar o resto — assim nenhum valor de faixa é
// contado de novo como prêmio/incentivo avulso.
export function classifySalaryMentions(text) {
  const clean = text || "";

  let salarioHora = null;
  let salarioMax = null;
  let scanText = clean;

  const rangeMatch = clean.match(/¥\s?([\d][\d.,]*)\s*(?:-|~|a\b|até)\s*¥?\s?([\d][\d.,]*)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1].replace(/\D/g, ""), 10) || 0;
    const max = parseInt(rangeMatch[2].replace(/\D/g, ""), 10) || 0;
    if (min >= SALARY_HOURLY_MIN && min <= SALARY_HOURLY_MAX && max > min) {
      salarioHora = min;
      salarioMax = max;
      scanText = clean.replace(rangeMatch[0], ""); // já usados — não contar de novo abaixo
    }
  }

  const matches = [...scanText.matchAll(/¥\s?([\d][\d.,]*)/g)].map((m) => ({
    raw: m[0],
    value: parseInt(m[1].replace(/\D/g, ""), 10) || 0,
  }));

  const bonuses = [];
  for (const { raw, value } of matches) {
    if (!value) continue;
    if (!salarioHora && value >= SALARY_HOURLY_MIN && value <= SALARY_HOURLY_MAX) {
      salarioHora = value;
    } else if (value > SALARY_HOURLY_MAX) {
      bonuses.push(`${raw} em incentivos`);
    }
  }
  return { salarioHora, salarioMax, bonuses };
}

// Confere se um valor de salário já extraído (pela IA ou de outro lugar)
// é plausível como salário POR HORA. Se não for (provavelmente é prêmio/
// incentivo confundido com salário), descarta do campo de salário, joga
// pra lista de bônus, e tenta achar um salário de hora de verdade no
// texto-fonte (pastedText + descrição) como segunda tentativa. Sempre
// passa o candidato pelo parseSalaryRange primeiro — cobre o caso da IA
// devolver uma faixa (ex: "1500-1600") apesar da instrução de só dígitos.
export function reconcileSalary(candidateRaw, sourceText) {
  const { salarioHora: candidateMin, salarioMax: candidateMax } = parseSalaryRange(candidateRaw);

  if (candidateMin >= SALARY_HOURLY_MIN && candidateMin <= SALARY_HOURLY_MAX) {
    const { salarioMax: textMax, bonuses } = classifySalaryMentions(sourceText);
    return { salarioHora: String(candidateMin), salarioMax: candidateMax || textMax || null, extraBonuses: bonuses };
  }

  const { salarioHora: fromText, salarioMax: fromTextMax, bonuses } = classifySalaryMentions(sourceText);
  const extraBonuses = candidateMin > SALARY_HOURLY_MAX ? [`${formatYen(candidateMin)} em incentivos`, ...bonuses] : bonuses;
  return { salarioHora: fromText ? String(fromText) : "", salarioMax: fromTextMax || null, extraBonuses };
}

// Parser local — a "extractJobFromText" propriamente dita. Roda 100% no
// navegador, sem depender da API: sempre retorna um objeto parcial (só
// com os campos que conseguiu achar), nunca lança erro.
export function extractJobFromText(rawText) {
  const text = (rawText || "").trim();
  if (!text) return {};

  const result = {};

  // 1) Salário por hora vs prêmio/incentivo (e faixa) — nunca confunde os três.
  const { salarioHora, salarioMax, bonuses } = classifySalaryMentions(text);
  if (salarioHora) result.salarioHora = String(salarioHora);
  if (salarioMax) result.salarioMax = String(salarioMax);

  // 2) Cargo padrão — primeira linha que pareça uma função de verdade
  // (ignora linhas que são só números, ¥ ou pontuação).
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const cargoLine = lines.find((l) => l.length >= 4 && !/^[¥\d\s.,\-\/()]+$/.test(l));
  if (cargoLine) result.cargo = cargoLine.length > 80 ? `${cargoLine.slice(0, 80).trim()}…` : cargoLine;

  // 3) Província — best-effort; se não achar, fica em branco pro usuário completar.
  const provinciaMatch = text.match(KNOWN_PROVINCIAS_RE);
  if (provinciaMatch) result.provincia = provinciaMatch[1];

  // 4) Turno
  if (/nikoutai|altern[aâ]ncia|2\s*turnos/i.test(text)) result.turno = "2 Turnos";
  else if (/noturno/i.test(text)) result.turno = "Noturno";
  else if (/diurno/i.test(text)) result.turno = "Diurno";

  // 5) Nihongo
  if (/avan[cç]ado|fluente/i.test(text)) result.nihongo = "Avançado";
  else if (/intermedi[aá]rio/i.test(text)) result.nihongo = "Intermediário";
  else if (/convers[aã]o/i.test(text)) result.nihongo = "Conversação";
  else if (/b[aá]sico|n[aã]o exig/i.test(text)) result.nihongo = "Básico";

  // 6) Benefícios conhecidos -> tags (+ moradia, quando aplicável)
  const foundBenefits = BENEFIT_KEYWORDS.filter(({ re }) => re.test(text));
  const moradiaBenefit = foundBenefits.find((b) => b.moradia);
  if (moradiaBenefit) result.moradia = moradiaBenefit.moradia;
  const tagsList = [...foundBenefits.map((b) => b.tag), ...bonuses];
  if (tagsList.length) result.tags = tagsList.join(", ");

  // 7) Telefone — formato japonês típico, com ou sem traço
  const phoneMatch = text.match(/0\d{1,4}[-\s]?\d{2,4}[-\s]?\d{3,4}/);
  if (phoneMatch) result.telefone = phoneMatch[0];

  // 8) Descrição — usa o próprio texto colado (resumido) como fallback
  result.descricao = clampDescription(text);

  return result;
}

// Regra do selo 💎 Top Salário — automática, não é mais um toggle manual.
// Qualquer vaga com salarioHora (ou salarioMax, quando há faixa) acima do
// limiar entra com o selo; abaixo, não entra. Um só lugar de verdade,
// usado no scraper, no Publicador Mágico e na renderização do card
// (JobCard sempre recalcula a partir do salário atual, então não depende
// de um campo salvo desatualizado).
export const TOP_SALARIO_THRESHOLD = 1600;
export const isTopSalarioRule = (salarioHora) => Number(salarioHora) >= TOP_SALARIO_THRESHOLD;

// Converte um item cru do JSON do scraper para o formato interno do app.
export function mapScrapedJob(item) {
  const yesNo = (v) => String(v || "").trim().toLowerCase() === "sim";
  // parseSalaryRange cobre o caso do scraper mandar uma faixa (ex:
  // "1.500 - 1.600") no campo salario_hora — nunca junta os dois números.
  const { salarioHora, salarioMax } = parseSalaryRange(item.salario_hora);
  return {
    empresa: (item.empresa || "").trim(),
    cargo: (item.cargo || "").trim(),
    cidade: (item.cidade || "").trim(),
    provincia: normalizeProvincia((item.provincia || "").trim()),
    salarioHora,
    salarioMax, // null quando não há faixa — só um valor único
    turno: (item.turno || "").trim(),
    nihongo: (item.nihongo || "").trim(),
    moradia: (item.moradia || "").trim(),
    vagaHomens: yesNo(item.vaga_homens),
    vagaMulheres: yesNo(item.vaga_mulheres),
    conducao: (item.conducao || "").trim(),
    tags: String(item.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    telefone: (item.telefone || "").trim(),
    whatsapp: (item.whatsapp || "").trim(),
    descricao: clampDescription(item.descricao || ""),
    urlOriginal: (item.url_original || "").trim() || null, // link direto do anúncio na fonte — base da deduplicação (ver handleBulkImport)
    lastSeenAt: Date.now(), // "visto pela última vez" — vagas manuais/reivindicadas nunca ganham isso, só o que passa pelo scraper
    status: "publicado",
    clicks: 0,
    isTopSalario: isTopSalarioRule(salarioMax || salarioHora), // automático — ver TOP_SALARIO_THRESHOLD acima
    isRecomendado: false,
    isUrgente: false,
    isFixado: false,
    seloVerificado: false,
    // 999 = anúncio diz explicitamente "sem limite de idade" | número =
    // limite específico mencionado (ex: até 55) | null = não menciona
    // nada sobre idade (nunca vira "sem limite" por omissão — ver
    // extrair_idade_maxima no scraper).
    idadeMaxima: item.idade_maxima != null ? Number(item.idade_maxima) : null,
  };
}

// Impressão digital de uma vaga — usada como PLANO B pra achar
// duplicata quando a vaga não tem url_original (nem toda fonte expõe
// link individual). Normaliza acento/maiúscula/espaço e combina
// empresa+cargo+cidade+salário. Não é infalível (duas vagas bem
// parecidas podem colidir por coincidência), mas é bem melhor que nada
// — e só entra em ação quando a URL (o método confiável) não existe.
export function jobFingerprint(job) {
  const norm = (s) => (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return [norm(job.empresa), norm(job.cargo), norm(job.cidade), Math.round(Number(job.salarioHora) || 0)].join("|");
}
