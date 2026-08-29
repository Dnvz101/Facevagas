// ---------------------------------------------------------------
// Tipos de parceiro (Empreiteira/Prestador/Loja) + helpers de
// rótulo/emoji/exemplo — usado no cadastro e em vários painéis.
// ---------------------------------------------------------------

export const PARTNER_TYPES = [
  { key: "empreiteira", label: "Empreiteira", emoji: "🏢", example: "Fujiarte" },
  { key: "prestador", label: "Prestador de Serviço", emoji: "🛠️", example: "Mecânica do Silva" },
  { key: "loja", label: "Loja/Comércio", emoji: "🏪", example: "Supermercado Brasil" },
];
export const partnerTypeLabel = (key) => PARTNER_TYPES.find((t) => t.key === key)?.label || key;
export const partnerTypeEmoji = (key) => PARTNER_TYPES.find((t) => t.key === key)?.emoji || "🏳️";
export const partnerTypeExample = (key) => PARTNER_TYPES.find((t) => t.key === key)?.example || "Nome do seu negócio";
