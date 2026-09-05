export function toWhatsAppLink(raw, cargo) {
  if (!raw) return null;
  // o scraper às vezes já entrega o link pronto (com mensagem de
  // candidatura pré-preenchida) — usa direto, MAS só se for de
  // verdade um link do WhatsApp. Sem essa checagem, uma vaga cujo
  // scraper confundiu o campo "whatsapp" com o link da própria
  // página de origem (ex: jobsonline.jp) fazia o botão "WhatsApp"
  // abrir/compartilhar o site errado em vez de puxar uma conversa.
  // ⚠️ Usa a API de URL do navegador pra checar o domínio de verdade
  // (não um regex de texto) — uma tentativa anterior com regex tinha
  // um erro sutil que rejeitava até link de WhatsApp válido, porque
  // "https://wa.me/..." tem "//" antes do domínio, não ".".
  if (/^https?:\/\//i.test(raw)) {
    try {
      const host = new URL(raw).hostname.toLowerCase();
      const isWhatsApp = host === "wa.me" || host.endsWith(".wa.me") || host === "whatsapp.com" || host.endsWith(".whatsapp.com");
      // Já é link do WhatsApp: nunca mexe na mensagem dele (pode já vir
      // com texto pronto do scraper, ou sem nada) — só passa reto.
      return isWhatsApp ? raw : null;
    } catch {
      return null; // URL malformada — mais seguro esconder o botão do que arriscar
    }
  }
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // Já vem com o código do Japão (ex: alguém digitou "819012345678")?
  // Usa direto, sem prefixar de novo — senão viraria "81819012345678".
  const base = digits.startsWith("81") && digits.length >= 12
    ? `https://wa.me/${digits}`
    : `https://wa.me/81${digits.startsWith("0") ? digits.slice(1) : digits}`;
  // Mensagem pré-preenchida "veio do NihonVagas" — só quando quem
  // chamou passou o cargo (candidato falando com a empresa sobre UMA
  // vaga específica: JobCard, IndicacaoCard, painel de Indicações).
  // Chamadas de suporte/alerta (ADMIN_WHATSAPP_RAW, alerta de vagas)
  // não passam cargo de propósito e continuam sem texto nenhum aqui —
  // elas montam a própria mensagem por fora (ver
  // PlanComparisonCards/AlertBanner), e um "?text=" automático aqui
  // quebraria esse link (viraria dois "?text=" na mesma URL).
  if (!cargo) return base;
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
