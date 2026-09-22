export function toWhatsAppLink(raw, cargo) {
  if (!raw) return null;
  // o scraper às vezes já entrega o link pronto (com mensagem de
  // candidatura pré-preenchida) — MAS essa mensagem nunca menciona o
  // NihonVagas (é só o texto genérico que o scraper monta sozinho).
  // Achado revisando o JSON: quando temos "cargo" (candidato falando
  // com a empresa sobre UMA vaga), sempre reconstrói com a NOSSA
  // mensagem — extrai só o NÚMERO do link pronto (sem tentar
  // "corrigir" prefixo de país, pra nunca piorar um número que já
  // veio errado do scraper) e troca o texto.
  let base;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      const isWhatsApp = host === "wa.me" || host.endsWith(".wa.me") || host === "whatsapp.com" || host.endsWith(".whatsapp.com");
      if (!isWhatsApp) return null; // não é link de WhatsApp de verdade — mais seguro esconder o botão
      const phoneDigits = url.pathname.replace(/\D/g, "");
      if (!phoneDigits) return cargo ? null : raw; // link sem número extraível — sem cargo, ao menos passa reto
      base = `https://wa.me/${phoneDigits}`;
    } catch {
      return null; // URL malformada — mais seguro esconder o botão do que arriscar
    }
  } else {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return null;
    // Já vem com o código do Japão (ex: alguém digitou "819012345678")?
    // Usa direto, sem prefixar de novo — senão viraria "81819012345678".
    base = digits.startsWith("81") && digits.length >= 12
      ? `https://wa.me/${digits}`
      : `https://wa.me/81${digits.startsWith("0") ? digits.slice(1) : digits}`;
  }
  // Mensagem pré-preenchida "veio do NihonVagas" — só quando quem
  // chamou passou o cargo (candidato falando com a empresa sobre UMA
  // vaga específica: JobCard, IndicacaoCard, painel de Indicações).
  // Chamadas de suporte/alerta (ADMIN_WHATSAPP_RAW, alerta de vagas)
  // não passam cargo de propósito: aí devolve o link de origem (com a
  // mensagem própria do scraper, se tinha) ou só o link base, sem
  // texto — elas montam a própria mensagem por fora (ver
  // PlanComparisonCards/AlertBanner), e um "?text=" automático aqui
  // quebraria esse link (viraria dois "?text=" na mesma URL).
  if (!cargo) return /^https?:\/\//i.test(raw) ? raw : base;
  const message = `Olá! Vi a vaga de *${cargo}* no NihonVagas.jp e tenho interesse. Pode me dar mais informações?`;
  return `${base}?text=${encodeURIComponent(message)}`;
}

// WhatsApp oficial do Admin/suporte (Leandro) — número único, reaproveitado
// tanto pelo "Fale Conosco" da Área do Cliente quanto pelo Alerta de Vagas.
export const ADMIN_WHATSAPP_RAW = "07014157833";

export function toTelLink(rawPhone) {
  const digits = (rawPhone || "").replace(/\D/g, "");
  if (!digits) return null;
  return `tel:${digits}`;
}

export function formatYen(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("pt-BR");
}
