// ---------------------------------------------------------------
// Selos/badges — componentes pequenos e reutilizados em vários
// lugares (cards de vaga, cards de prestador, tabelas do Admin).
// WhatsAppIcon copiado EXATO (path do Font Awesome, já corrigido de
// um bug de corte visual que apareceu com um SVG reconstruído de
// memória antes) — nunca recriar esse path de cabeça de novo.
// ---------------------------------------------------------------

import { Flame, BadgeCheck, Sparkles, Zap } from "lucide-react";

export const TopBadge = () => (
  <div
    className="nv-stamp nv-top-badge absolute -left-2 -top-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg"
    style={{ transform: "rotate(-6deg)" }}
  >
    <Flame className="h-3 w-3 animate-pulse" />
    Destaque
  </div>
);

/* ---------------------------------------------------------------
   Selo de Verificação — igual ao "check azul" de redes sociais,
   mostrado ao lado do nome da empresa quando o plano dela inclui
   verificação (seloVerificado: true na vaga).
--------------------------------------------------------------- */
export function VerificadoBadge() {
  return (
    <span title="Empresa verificada" className="inline-flex flex-shrink-0 items-center">
      <BadgeCheck className="h-3.5 w-3.5 fill-blue-500 text-white" />
    </span>
  );
}

/* ---------------------------------------------------------------
   Selos de vaga — componentes isolados e reutilizáveis.
   Pensados pra serem reaproveitados depois na Área do Cliente/
   Recrutador (mesmo visual, mesma lógica, só o toggle muda de lugar).
--------------------------------------------------------------- */
export function TopSalarioBadge() {
  return (
    <div className="nv-salario-badge flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
      <span className="animate-pulse">💎</span> Top Salário
    </div>
  );
}

export function RecomendadoBadge() {
  return (
    <div className="nv-recommended-badge flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
      <Sparkles className="h-2.5 w-2.5 animate-pulse" /> Recomendado
    </div>
  );
}

// Zap em vez de Flame aqui de propósito — Flame já é usado no selo de
// ranking (Destaque), então usar o mesmo ícone pra "Urgente" confundiria
// os dois selos visualmente.
export function UrgenteBadge() {
  return (
    <div className="nv-urgente-badge flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
      <Zap className="h-2.5 w-2.5 animate-pulse" /> Urgente
    </div>
  );
}

// Selo "Nova Vaga" — 100% editorial, controlado SÓ pelo Admin (nunca
// aparece como opção na Área do Cliente nem é setado automaticamente
// pela importação em JSON ou pelo Publicador Mágico). Existe pra
// destacar manualmente uma vaga que acabou de entrar no site.
export function NovoBadge() {
  return (
    <div className="nv-novo-badge flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
      <Sparkles className="h-2.5 w-2.5" /> Nova Vaga
    </div>
  );
}

// Selo de canto — cantos arredondados só no topo-esquerdo e
// baixo-direita, criando o efeito de "etiqueta grudada" saindo do
// canto do card, parecido com marcador de pasta de arquivo antigo.
export function CategoryTab({ categoria, color }) {
  return (
    <div className={`absolute left-0 top-0 z-10 rounded-tl-2xl rounded-br-lg ${color.badgeBg} ${color.badgeText} px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide`}>
      {categoria}
    </div>
  );
}

// Ícone de verdade do WhatsApp — o Lucide não tem ícones de marca (só
// contorno genérico), então esse é o glifo oficial embutido como SVG.
export function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 448 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
  );
}
