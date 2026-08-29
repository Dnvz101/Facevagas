// ---------------------------------------------------------------
// Kakeibo — matemática da folha de pagamento japonesa. Validado
// (no arquivo original) contra um holerite real: bateu exato em
// salário base e hora extra noturna, ~1% de diferença no resto —
// copiado linha por linha aqui, sem recriar nada de memória.
// ---------------------------------------------------------------

import { formatYen } from "./format.js";
import { uid } from "./jobParsing.js";

export function calculateNightHours(start = "20:00", end = "04:45") {
  const toMin = (t) => {
    const [h = 0, m = 0] = (t || "0:0").split(":").map(Number);
    return h * 60 + m;
  };
  const s = toMin(start);
  let e = toMin(end);
  if (e <= s) e += 24 * 60;
  let total = 0;
  for (const offset of [-1440, 0, 1440]) {
    const ws = 22 * 60 + offset;
    const we = 29 * 60 + offset;
    total += Math.max(0, Math.min(e, we) - Math.max(s, ws));
  }
  return total / 60;
}

export const yenLabel = (v) => `¥${formatYen(Math.round(v || 0))}`;

// Fábrica de perfil padrão — cada trabalhador da família é um objeto
// independente com sua própria configuração completa.
export function makeDefaultProfile(name) {
  return {
    id: uid(),
    name,
    age: 35,
    standardHours: 7.75,
    hourlyBase: 1500,
    teatePerHour: 0,
    teateRecebido: true, // Bônus condicional (assiduidade/pontualidade): cumpriu os requisitos esse mês? Vale tanto pro tipo "porHora" quanto "fixo".
    bonusCondicionalTipo: "nenhum", // 'nenhum' | 'porHora' (usa teatePerHour) | 'fixo' (usa bonusCondicionalValorFixo)
    bonusCondicionalValorFixo: 0, // valor do bônus condicional quando é do tipo "fixo"
    bonusFixo: 0, // outro bônus genuinamente fixo (opcional), ex: um prêmio único — não depende de horas nem de condição mensal
    zangyoMode: "base", // 'base' | 'baseTeate' | 'hybrid' — ver computeProfilePayslip
    nikoutai: true,
    hirukinStart: "08:00", // turno diurno/asaban — em sistemas asaban/osoban pode encostar na janela noturna também
    hirukinEnd: "17:00",
    yakinStart: "20:00", // turno noturno/osoban
    yakinEnd: "04:45",
    kmPerDay: 10,
    yenPerKm: 15,
    aliquotaShakai: 14.15,
    aliquotaDesemprego: 0.5,
    aliquotaImposto: 3.75,
    applyShakai: true,
    hiruDays: 11,
    yakinDays: 10,
    overtimeNormal: 20,
    overtimeNight: 5,
  };
}

export function makeDefaultExpenses() {
  return [
    { id: uid(), nome: "Aluguel", valor: 0, dia: 5, pago: false },
    { id: uid(), nome: "Luz", valor: 0, dia: 10, pago: false },
    { id: uid(), nome: "Água", valor: 0, dia: 10, pago: false },
    { id: uid(), nome: "Gás", valor: 0, dia: 15, pago: false },
    { id: uid(), nome: "Carro", valor: 0, dia: 20, pago: false },
  ];
}

// Cálculo completo da folha de UM perfil — inclui a regra nova de
// Zangyo (3 modos) e alíquotas editáveis por pessoa (Kaigo Hoken
// continua automático pela idade, não é editável — é regra fixa do
// governo japonês, não faz sentido deixar configurável).
export function computeProfilePayslip(p) {
  const nn = (v) => (typeof v === "number" && !isNaN(v) ? v : Number(v) || 0);
  const days = nn(p.hiruDays) + nn(p.yakinDays);
  const normalHours = days * nn(p.standardHours);
  const totalHours = normalHours + nn(p.overtimeNormal) + nn(p.overtimeNight);
  const base = normalHours * nn(p.hourlyBase);

  // Bônus condicional (assiduidade/pontualidade) — o tipo escolhido
  // (bonusCondicionalTipo) decide QUAL valor o toggle "cumpriu esse mês"
  // (teateRecebido) afeta: o teate por hora (já calculado sozinho pelas
  // horas do mês) ou um valor fixo configurado à parte. Os dois nunca
  // se aplicam ao mesmo tempo — só um por perfil.
  const bonusCondicionalTipo = p.bonusCondicionalTipo || "nenhum";
  const condicionalCumprida = p.teateRecebido !== false;

  // Teate por hora — some do cálculo (inclusive do zangyo, que usa
  // base+teate nos modos "Base + Teate"/"Híbrido") só quando o tipo é
  // "porHora" E o mês não cumpriu a condição. Fora disso, o teate/hora é
  // sempre um valor contratual normal (não depende de condição nenhuma).
  const teatePerHourEfetivo = (bonusCondicionalTipo === "porHora" && !condicionalCumprida) ? 0 : nn(p.teatePerHour);
  const teate = totalHours * teatePerHourEfetivo;

  // Valor fixo condicional — só entra quando o tipo é "fixo" E cumpriu
  // a condição esse mês.
  const bonusCondicionalFixo = (bonusCondicionalTipo === "fixo" && condicionalCumprida) ? nn(p.bonusCondicionalValorFixo) : 0;

  // Horas noturnas (22h~5h) de CADA tipo de turno — não só do Yakin.
  // Em sistemas asaban/osoban (turno cedo/turno tarde), o turno "diurno"
  // (osoban, ex: 13h~22h) pode encostar na janela noturna também, e
  // isso precisa contar. Se o Hirukin for um turno bem diurno (ex:
  // 08h~17h), essa conta dá zero sozinha — não muda nada pra quem já
  // usava só o turno Yakin fixo.
  const nightHoursPerYakinShift = p.nikoutai ? calculateNightHours(p.yakinStart, p.yakinEnd) : 0;
  const nightHoursPerHirukinShift = p.nikoutai ? calculateNightHours(p.hirukinStart, p.hirukinEnd) : 0;
  const totalNightHours = nn(p.yakinDays) * nightHoursPerYakinShift + nn(p.hiruDays) * nightHoursPerHirukinShift;
  const nightBonus = totalNightHours * nn(p.hourlyBase) * 0.25;

  // Regra de Zangyo — 3 modos, conforme como a empreiteira calcula:
  const baseRate = nn(p.hourlyBase);
  const baseTeateRate = baseRate + teatePerHourEfetivo;
  let otNormal, otNight;
  if (p.zangyoMode === "baseTeate") {
    otNormal = nn(p.overtimeNormal) * baseTeateRate * 1.25;
    otNight = nn(p.overtimeNight) * baseTeateRate * 1.5;
  } else if (p.zangyoMode === "hybrid") {
    otNormal = nn(p.overtimeNormal) * baseTeateRate * 1.25; // diurno: base + teate
    otNight = nn(p.overtimeNight) * baseRate * 1.5;          // noturno: só base
  } else {
    otNormal = nn(p.overtimeNormal) * baseRate * 1.25;
    otNight = nn(p.overtimeNight) * baseRate * 1.5;
  }

  const transport = days * nn(p.kmPerDay) * nn(p.yenPerKm);
  const bonusFixo = nn(p.bonusFixo); // outro bônus fixo, se houver — sem condição mensal
  const gross = base + teate + bonusCondicionalFixo + bonusFixo + nightBonus + otNormal + otNight + transport;

  const kaigoRate = p.age >= 40 && p.age <= 64 ? 0.91 : 0;
  const unemployment = (gross * nn(p.aliquotaDesemprego)) / 100;
  const incomeTax = (gross * nn(p.aliquotaImposto)) / 100;
  const kaigo = (gross * kaigoRate) / 100;
  const shakai = p.applyShakai ? (gross * nn(p.aliquotaShakai)) / 100 : 0;
  const deductions = unemployment + incomeTax + kaigo + shakai;

  return {
    days, normalHours, totalHours, base, teate, bonusCondicionalFixo, bonusFixo, nightBonus, otNormal, otNight,
    transport, gross, unemployment, incomeTax, kaigo, shakai, deductions,
    net: gross - deductions,
  };
}

export const ZANGYO_MODES = [
  { key: "base", label: "Apenas Salário Base", desc: "Zangyo = Jikyu × 1,25 (noturno ×1,50)" },
  { key: "baseTeate", label: "Base + Teate (Sempre)", desc: "Zangyo = (Jikyu + Teate) × 1,25 (noturno ×1,50)" },
  { key: "hybrid", label: "Híbrido (Hiru c/ Teate / Yakin s/ Teate)", desc: "Diurno usa Jikyu + Teate · Noturno usa só o Jikyu Base" },
];
