export function toWhatsAppLink(raw, customMessage) {
  if (!raw) return null;

  const defaultMsg = "Olá! Encontrei esta vaga no site NihonVagas.com e gostaria de mais informações.";
  const textToUse = customMessage || defaultMsg;

  // Se o scraper já entregou um link completo
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const existingText = url.searchParams.get("text");

      if (!existingText) {
        // Não tinha mensagem: define a mensagem padrão
        url.searchParams.set("text", textToUse);
      } else if (!existingText.toLowerCase().includes("nihonvagas")) {
        // Já tinha mensagem de origem: anexa a identificação do portal
        url.searchParams.set("text", `${existingText} (Vi no site NihonVagas.com)`);
      }
      return url.toString();
    } catch {
      return raw;
    }
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  const textParam = encodeURIComponent(textToUse);

  // Já vem com o código do Japão (81)
  if (digits.startsWith("81") && digits.length >= 12) {
    return `https://wa.me/${digits}?text=${textParam}`;
  }

  // Remove o 0 inicial e prefixa com 81
  const noLeadingZero = digits.startsWith("0") ? digits.slice(1) : digits;
  return `https://wa.me/81${noLeadingZero}?text=${textParam}`;
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
