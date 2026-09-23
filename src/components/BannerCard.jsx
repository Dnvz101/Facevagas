// ---------------------------------------------------------------
// Sistema de Banner (Vagas e Comunidade) — cartão informativo padrão,
// texto de utilidade pública, ou imagem de comunicado. + editor Admin.
// ---------------------------------------------------------------

import { useState, useRef } from "react";
import { UserX, MousePointerClick, MessageCircle, Globe, Building2, Facebook, Star, Users, Heart, Megaphone, Loader2, ImagePlus } from "lucide-react";
import { resizeImageFile } from "../utils/misc.js";

// Fontes de vagas exibidas no diagrama "tudo converge pro NihonVagas"
// abaixo. Coordenadas em um viewBox fixo de 400x230, espelhadas em %
// pros ícones (posicionados em HTML) baterem exatamente com onde a
// linha do SVG chega.
const FLOW_NODES = [
  { id: "facebook", icon: Facebook, label: "Facebook", sub: "dezenas de comunidades", x: 60, y: 46, iconClass: "fill-blue-600 text-blue-600", ring: "ring-blue-100" },
  { id: "sites", icon: Globe, label: "Sites de emprego", x: 340, y: 46, iconClass: "text-slate-500", ring: "ring-slate-100" },
  { id: "empreiteira", icon: Building2, label: "Empreiteira", x: 60, y: 184, iconClass: "text-slate-500", ring: "ring-slate-100" },
  { id: "exclusivas", icon: Star, label: "Exclusivas", x: 340, y: 184, iconClass: "fill-amber-400 text-amber-400", ring: "ring-amber-100", shine: true },
];
const FLOW_VIEWBOX = { w: 400, h: 230 };
const FLOW_CENTER = { x: 200, y: 115 };

// Caminho em "cotovelo" (desce/sobe reto, curva suave, entra reto no
// centro) — mesma ideia visual de diagramas de integração, mas com o
// fluxo sempre apontando PRA DENTRO (fontes → site), não pra fora.
function flowPath(node) {
  const { x, y } = node;
  const midY = y < FLOW_CENTER.y ? y + 50 : y - 50;
  const bendX = x < FLOW_CENTER.x ? x + 20 : x - 20;
  const endX = x < FLOW_CENTER.x ? FLOW_CENTER.x - 28 : FLOW_CENTER.x + 28;
  return `M ${x} ${y} V ${midY} Q ${x} ${FLOW_CENTER.y} ${bendX} ${FLOW_CENTER.y} H ${endX}`;
}

// Diagrama "fontes de vagas convergindo pro NihonVagas" — substitui a
// lista simples: mostra visualmente de onde as vagas vêm e que tudo
// desagua num lugar só (o site), com linhas animadas fluindo pro
// centro.
function SourcesFlowDiagram() {
  return (
    <div className="relative mx-auto mt-1 w-full max-w-[360px]" style={{ aspectRatio: `${FLOW_VIEWBOX.w} / ${FLOW_VIEWBOX.h}` }}>
      <svg viewBox={`0 0 ${FLOW_VIEWBOX.w} ${FLOW_VIEWBOX.h}`} className="absolute inset-0 h-full w-full" fill="none">
        {FLOW_NODES.map((node) => (
          <g key={node.id}>
            <path d={flowPath(node)} stroke="#e2e8f0" strokeWidth="1.5" fill="none" />
            <path d={flowPath(node)} stroke={node.shine ? "#f59e0b" : "#2563eb"} strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" fill="none" className="nv-flow-line" />
          </g>
        ))}
      </svg>

      {FLOW_NODES.map(({ id, icon: Icon, label, sub, x, y, iconClass, ring }) => (
        <div
          key={id}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
          style={{ left: `${(x / FLOW_VIEWBOX.w) * 100}%`, top: `${(y / FLOW_VIEWBOX.h) * 100}%` }}
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ${ring}`}>
            <Icon className={`h-4 w-4 ${iconClass}`} />
          </div>
          <p className={`nv-body whitespace-nowrap text-center text-[10px] font-bold leading-tight ${id === "exclusivas" ? "nv-text-shine" : "text-slate-700"}`}>
            {label}
          </p>
          {sub && <p className="nv-body -mt-0.5 max-w-[90px] text-center text-[8.5px] leading-tight text-slate-400">{sub}</p>}
        </div>
      ))}

      {/* Centro: o site */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
        style={{ left: `${(FLOW_CENTER.x / FLOW_VIEWBOX.w) * 100}%`, top: `${(FLOW_CENTER.y / FLOW_VIEWBOX.h) * 100}%` }}
      >
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span className="nv-orbit-ping absolute inset-0 rounded-2xl bg-blue-500" />
          <div className="nv-display relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-[20px] font-extrabold text-white shadow-md">
            N
          </div>
        </div>
        <p className="nv-display whitespace-nowrap text-[10.5px] font-extrabold text-slate-900">NihonVagas.jp</p>
      </div>
    </div>
  );
}

export function InfoBanner({ jobs = [] }) {
  // "adicionadas" aqui conta vaga NOVA e vaga ATUALIZADA igual — as
  // duas passam por mapScrapedJob no import (JSONImporter.jsx), que
  // sempre atualiza lastSeenAt pra "agora". Não é um número fixo nem
  // aleatório: é a contagem de verdade de quantas vagas foram tocadas
  // por um import nos últimos 7 dias.
  const seteDiasMs = 7 * 24 * 60 * 60 * 1000;
  const vagasRecentes = jobs.filter((j) => j.lastSeenAt && Date.now() - j.lastSeenAt < seteDiasMs).length;

  return (
    <div className="nv-rise rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
          <span className="h-3 w-3 animate-pulse rounded-full bg-white" />
        </div>
        <h3 className="nv-display text-[17px] font-extrabold leading-tight text-slate-900">
          <span className="text-slate-900">{vagasRecentes}</span> <span className="text-blue-600">vagas adicionadas nos últimos 7 dias</span>
        </h3>
      </div>
      <p className="nv-body mt-1.5 text-[12px] text-slate-500">
        Novas oportunidades todos os dias, incluindo <span className="font-semibold text-blue-600">vagas exclusivas</span>.
      </p>

      <SourcesFlowDiagram />

      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 text-center">
        <div className="px-1.5">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <UserX className="h-5 w-5 text-blue-600" />
          </div>
          <p className="nv-body text-[11px] font-bold leading-tight text-slate-900">Sem cadastro</p>
          <p className="nv-body mt-0.5 text-[10px] leading-tight text-slate-500">Nada de criar conta ou preencher dados.</p>
        </div>
        <div className="px-1.5">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <MousePointerClick className="h-5 w-5 text-blue-600" />
          </div>
          <p className="nv-body text-[11px] font-bold leading-tight text-slate-900">Um toque</p>
          <p className="nv-body mt-0.5 text-[10px] leading-tight text-slate-500">Toque no botão e entre em contato.</p>
        </div>
        <div className="px-1.5">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <MessageCircle className="h-5 w-5 text-blue-600" />
          </div>
          <p className="nv-body text-[11px] font-bold leading-tight text-slate-900">
            Fale direto com o <span className="text-blue-600">担当者 (tantousha)</span>
          </p>
          <p className="nv-body mt-0.5 text-[10px] leading-tight text-slate-500">Você fala diretamente com o responsável pela vaga.</p>
        </div>
      </div>
    </div>
  );
}

// Versão da InfoBanner pro topo da aba Comunidade — mesma linguagem
// visual (cartão branco, ícone azul, grade de diferenciais), só que
// menor e mais simples, com uma chamada pra ação de cadastro no final
// (já que hoje não tem nenhum outro jeito de a pessoa começar o
// cadastro de prestador a não ser pelo botão "Sou Empreiteira" do
// topo, que nem menciona prestador).
export function CommunityInfoBanner({ onCadastrar }) {
  return (
    <div className="nv-rise rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
          <Users className="h-4.5 w-4.5 text-white" />
        </div>
        <h3 className="nv-display text-[15px] font-extrabold leading-tight text-slate-900">
          Prestadores <span className="text-blue-600">da Comunidade</span>
        </h3>
      </div>
      <p className="nv-body mt-1.5 text-[11.5px] text-slate-500">
        Divulgue seu serviço pra milhares de brasileiros no Japão — <span className="font-semibold text-blue-600">sempre gratuito</span>.
      </p>

      <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 text-center">
        <div className="px-1">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
            <Heart className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <p className="nv-body text-[10px] font-bold leading-tight text-slate-900">Sempre grátis</p>
        </div>
        <div className="px-1">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
            <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <p className="nv-body text-[10px] font-bold leading-tight text-slate-900">Contato direto</p>
        </div>
        <div className="px-1">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
            <Heart className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <p className="nv-body text-[10px] font-bold leading-tight text-slate-900">Comunidade unida</p>
        </div>
      </div>

      {onCadastrar && (
        <button
          onClick={onCadastrar}
          className="nv-body mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-[12px] font-bold text-white hover:bg-blue-700"
        >
          <Building2 className="h-3.5 w-3.5 flex-shrink-0" /> Cadastre-se clicando aqui
        </button>
      )}
    </div>
  );
}

export default function BannerCard({ banner, variant = "vagas", onCadastrar, jobs = [] }) {
  if (banner.mode === "image" && banner.imageUrl) {
    return (
      <div className="nv-rise flex max-h-72 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
        <img src={banner.imageUrl} alt="Comunicado" className="max-h-72 w-full object-contain" />
      </div>
    );
  }
  if (banner.mode === "text") {
    return (
      <div className="nv-rise flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <Megaphone className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <p className="nv-body text-[13px] leading-relaxed text-amber-900">{banner.text}</p>
      </div>
    );
  }
  return variant === "comunidade" ? <CommunityInfoBanner onCadastrar={onCadastrar} /> : <InfoBanner jobs={jobs} />;
}

/* ---------------------------------------------------------------
   Admin: Banner editor
--------------------------------------------------------------- */
export function BannerEditor({ banner, setBanner, title = "Comunicado principal", description = "Controla o primeiro card exibido para todos os visitantes.", variant = "vagas", jobs = [] }) {
  const fileRef = useRef(null);
  const [resizing, setResizing] = useState(false);
  const [resizeError, setResizeError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setResizing(true);
    setResizeError(null);
    try {
      const dataUrl = await resizeImageFile(file);
      setBanner((b) => ({ ...b, mode: "image", imageUrl: dataUrl }));
    } catch (err) {
      console.error(err);
      setResizeError("Não foi possível processar essa imagem. Tente outro arquivo.");
    } finally {
      setResizing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="nv-display text-[15px] font-bold text-slate-900">{title}</h3>
      <p className="nv-body mb-3 text-[12px] text-slate-500">{description}</p>

      {"enabled" in banner && (
        <button
          onClick={() => setBanner((b) => ({ ...b, enabled: !b.enabled }))}
          className={`mb-4 rounded-full px-3 py-1.5 text-[11px] font-bold ${
            banner.enabled ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {banner.enabled ? "✓ Banner ativado" : "Banner desativado — toque pra ativar"}
        </button>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setBanner((b) => ({ ...b, mode: "info" }))}
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${banner.mode === "info" || !banner.mode ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Cartão informativo (padrão)
        </button>
        <button
          onClick={() => setBanner((b) => ({ ...b, mode: "text" }))}
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${banner.mode === "text" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Texto de utilidade pública
        </button>
        <button
          onClick={() => setBanner((b) => ({ ...b, mode: "image" }))}
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${banner.mode === "image" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Imagem de comunicado
        </button>
      </div>

      {banner.mode === "text" ? (
        <textarea
          value={banner.text}
          onChange={(e) => setBanner((b) => ({ ...b, text: e.target.value }))}
          rows={4}
          className="nv-body w-full rounded-xl border border-slate-200 p-3 text-[13px] text-slate-700 outline-none focus:border-blue-400"
        />
      ) : banner.mode === "image" ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 py-8 text-center hover:border-blue-400"
        >
          {resizing ? (
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-500" />
          ) : (
            <ImagePlus className="mb-2 h-6 w-6 text-slate-400" />
          )}
          <p className="nv-body text-[12px] font-medium text-slate-500">
            {resizing ? "Redimensionando imagem..." : "Tocar para enviar a imagem do comunicado"}
          </p>
          <p className="nv-body text-[11px] text-slate-400">Imagens maiores são redimensionadas automaticamente para caber no espaço do banner.</p>
          {resizeError && <p className="nv-body mt-1 text-[11px] font-medium text-rose-600">{resizeError}</p>}
          {banner.imageUrl && !resizing && (
            <div className="mt-3 flex max-h-24 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
              <img src={banner.imageUrl} alt="preview" className="max-h-24 w-auto object-contain" />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-4">
          <p className="nv-body mb-3 text-[12px] text-slate-500">
            Este é o cartão fixo com os diferenciais da plataforma. Não é editável por texto — para uma mensagem
            personalizada, use os modos "Texto de utilidade pública" ou "Imagem de comunicado" acima.
          </p>
          <div className="scale-[0.85] origin-top">
            {variant === "comunidade" ? <CommunityInfoBanner /> : <InfoBanner jobs={jobs} />}
          </div>
        </div>
      )}
    </div>
  );
}
