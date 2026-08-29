// ---------------------------------------------------------------
// Sistema de cor + ícone das categorias de Prestadores de Serviço —
// paleta que o Admin escolhe (8 cores) + grade de ícones Lucide.
// ---------------------------------------------------------------

import { Wrench, Scissors, Languages, GraduationCap, Truck, Sparkles, Car, Utensils, Camera, Stethoscope, Baby, Dog, Hammer, Shirt, Music, Palette, Building2, Home } from "lucide-react";

export const CATEGORY_COLOR_OPTIONS = [
  { key: "blue", label: "Azul", swatch: "bg-blue-500", badgeBg: "bg-blue-100", badgeText: "text-blue-800", cardBg: "bg-blue-50", nameText: "text-blue-900", descText: "text-blue-600", iconBg: "bg-blue-200", iconText: "text-blue-800" },
  { key: "emerald", label: "Verde", swatch: "bg-emerald-500", badgeBg: "bg-emerald-100", badgeText: "text-emerald-800", cardBg: "bg-emerald-50", nameText: "text-emerald-900", descText: "text-emerald-600", iconBg: "bg-emerald-200", iconText: "text-emerald-800" },
  { key: "amber", label: "Âmbar", swatch: "bg-amber-500", badgeBg: "bg-amber-100", badgeText: "text-amber-800", cardBg: "bg-amber-50", nameText: "text-amber-900", descText: "text-amber-700", iconBg: "bg-amber-200", iconText: "text-amber-800" },
  { key: "rose", label: "Rosa", swatch: "bg-rose-500", badgeBg: "bg-rose-100", badgeText: "text-rose-800", cardBg: "bg-rose-50", nameText: "text-rose-900", descText: "text-rose-600", iconBg: "bg-rose-200", iconText: "text-rose-800" },
  { key: "violet", label: "Violeta", swatch: "bg-violet-500", badgeBg: "bg-violet-100", badgeText: "text-violet-800", cardBg: "bg-violet-50", nameText: "text-violet-900", descText: "text-violet-600", iconBg: "bg-violet-200", iconText: "text-violet-800" },
  { key: "cyan", label: "Ciano", swatch: "bg-cyan-500", badgeBg: "bg-cyan-100", badgeText: "text-cyan-800", cardBg: "bg-cyan-50", nameText: "text-cyan-900", descText: "text-cyan-600", iconBg: "bg-cyan-200", iconText: "text-cyan-800" },
  { key: "orange", label: "Laranja", swatch: "bg-orange-500", badgeBg: "bg-orange-100", badgeText: "text-orange-800", cardBg: "bg-orange-50", nameText: "text-orange-900", descText: "text-orange-600", iconBg: "bg-orange-200", iconText: "text-orange-800" },
  { key: "pink", label: "Pink", swatch: "bg-pink-500", badgeBg: "bg-pink-100", badgeText: "text-pink-800", cardBg: "bg-pink-50", nameText: "text-pink-900", descText: "text-pink-600", iconBg: "bg-pink-200", iconText: "text-pink-800" },
];
export function getCategoryColor(key) {
  return CATEGORY_COLOR_OPTIONS.find((c) => c.key === key) || CATEGORY_COLOR_OPTIONS[0];
}

// Lista de ícones disponíveis pro Admin escolher por categoria. Salvos
// como STRING (o nome, ex: "Wrench") — não dá pra guardar o componente
// React em si no banco, então na hora de desenhar a gente resolve o
// nome de volta pro ícone através desse mapa.
export const CATEGORY_ICON_MAP = {
  Wrench, Scissors, Languages, GraduationCap, Truck, Sparkles, Car, Utensils,
  Camera, Stethoscope, Baby, Dog, Hammer, Shirt, Music, Palette, Building2, Home,
};
export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICON_MAP);
export function getCategoryIcon(name) {
  return CATEGORY_ICON_MAP[name] || Building2;
}

// Busca a categoria completa (cor + ícone) a partir do nome salvo na
// vaga/anúncio (item.categoria é só o texto). Cai num padrão neutro se
// a categoria tiver sido excluída depois de já usada em algum anúncio.
export function findCategoryStyle(categories, nome) {
  const found = categories?.find((c) => c.nome === nome);
  return {
    nome,
    color: getCategoryColor(found?.color),
    Icon: getCategoryIcon(found?.icon),
  };
}
