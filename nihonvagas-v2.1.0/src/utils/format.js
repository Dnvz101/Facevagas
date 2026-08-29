export function toWhatsAppLink(raw) {
  if (!raw) return null;
  // o scraper às vezes já entrega o link pronto (com mensagem de candidatura pré-preenchida) — usa direto
  if (/^https?:\/\//i.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // Já vem com o código do Japão (ex: alguém digitou "819012345678")?
  // Usa direto, sem prefixar de novo — senão viraria "81819012345678".
  if (digits.startsWith("81") && digits.length >= 12) return `https://wa.me/${digits}`;
  const noLeadingZero = digits.startsWith("0") ? digits.slice(1) : digits;
  return `https://wa.me/81${noLeadingZero}`;
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
