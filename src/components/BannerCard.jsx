// ---------------------------------------------------------------
// Sistema de Banner (Vagas e Comunidade) — cartão informativo padrão,
// texto de utilidade pública, ou imagem de comunicado. + editor Admin.
// ---------------------------------------------------------------

import { useState, useRef } from "react";
import { UserX, MousePointerClick, MessageCircle, Globe, Building2, Facebook, Sparkles, Users, Heart, Megaphone, Loader2, ImagePlus } from "lucide-react";
import { resizeImageFile } from "../utils/misc.js";

// Nós do diagrama "fontes → NihonVagas". Cada um vira um card com
// ícone + título + subtítulo; os 2 primeiros ficam na coluna
// esquerda, os 2 últimos na direita (ver FLOW_LEFT/FLOW_RIGHT).
const FLOW_LEFT = [
  { id: "facebook", icon: Facebook, title: "Facebook", sub: "dezenas de grupos", iconBg: "bg-blue-50", iconColor: "text-blue-600", border: "border-slate-200/90 hover:border-blue-300" },
  { id: "empreiteiras", icon: Building2, title: "Empreiteiras", sub: "parcerias diretas", iconBg: "bg-slate-100", iconColor: "text-slate-600", border: "border-slate-200/90 hover:border-blue-300" },
];
const FLOW_RIGHT = [
  { id: "sites", icon: Globe, title: "Sites Japão", sub: "agregados em um só", iconBg: "bg-slate-100", iconColor: "text-slate-600", border: "border-slate-200/90 hover:border-blue-300" },
  { id: "exclusivas", icon: Sparkles, title: "Exclusivas", sub: "só no NihonVagas", iconBg: "bg-amber-50", iconColor: "text-amber-500", border: "border-amber-200/80 hover:border-amber-400", amber: true },
];

function FlowNodeCard({ icon: Icon, title, sub, iconBg, iconColor, border, amber }) {
  return (
    <div className={`group flex w-full max-w-[190px] items-center gap-2.5 rounded-2xl border bg-white p-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${border}`}>
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 leading-tight">
        <span className={`nv-body block truncate text-[11.5px] font-bold ${amber ? "text-amber-600" : "text-slate-800"}`}>{title}</span>
        <span className={`nv-body block truncate text-[10px] font-medium ${amber ? "text-amber-500" : "text-slate-400"}`}>{sub}</span>
      </div>
    </div>
  );
}

// Conector vertical curto pro layout empilhado (mobile): duas linhas
// convergindo (fileira → hub) ou divergindo (hub → fileira) num
// viewBox pequeno e esticável — não precisa bater pixel a pixel com
// os cards, só guiar o olho de uma fileira até a outra.
function MobileConnector({ direction, colors }) {
  const [colorLeft, colorRight] = colors;
  const paths =
    direction === "in"
      ? ["M20,0 C20,18 70,27 100,32", "M180,0 C180,18 130,27 100,32"]
      : ["M100,0 C100,5 70,14 20,32", "M100,0 C100,5 130,14 180,32"];
  return (
    <svg viewBox="0 0 200 32" preserveAspectRatio="none" className="mx-auto my-1 h-6 w-36" fill="none">
      <path d={paths[0]} stroke={colorLeft} strokeWidth="2.5" strokeLinecap="round" className="nv-flow-line" />
      <path d={paths[1]} stroke={colorRight} strokeWidth="2.5" strokeLinecap="round" className="nv-flow-line" />
    </svg>
  );
}

// Diagrama "fontes de vagas convergindo pro NihonVagas" — Facebook e
// Empreiteiras à esquerda, Sites Japão e Exclusivas à direita, hub
// central com o "N" no meio.
//
// Dois layouts de verdade, não só classes responsivas: em telas sm+
// as linhas são curvas absolutas por cima de uma grade de 3 colunas
// (viewBox esticado, preserveAspectRatio="none"); no mobile os cards
// empilham em 3 fileiras (par esquerdo / hub / par direito) e cada
// conector vertical mora no próprio fluxo do documento, no espaço
// entre as fileiras — por isso são dois blocos JSX separados
// (hidden sm:block / sm:hidden) em vez de só esconder um SVG.
function SourcesFlowDiagram() {
  const hub = (
    <div className="relative">
      <span className="nv-orbit-ping absolute -inset-1 rounded-2xl bg-blue-500" />
      <div className="relative flex flex-col items-center rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-md">
        <div className="nv-display mb-1.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-[17px] font-extrabold text-white shadow-inner">
          N
        </div>
        <span className="nv-body whitespace-nowrap text-[11.5px] font-bold text-slate-900">NihonVagas.jp</span>
        <span className="nv-body mt-1 whitespace-nowrap rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-blue-600">
          Hub Central
        </span>
      </div>
    </div>
  );

  return (
    <div className="relative py-3">
      {/* sm+ : 3 colunas lado a lado, linhas curvas absolutas por cima */}
      <div className="relative hidden sm:block">
        <svg
          viewBox="0 0 700 90"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          fill="none"
        >
          <path d="M 175 22 C 260 22, 280 40, 345 45" stroke="#bfdbfe" strokeWidth="1.5" className="nv-flow-line" />
          <path d="M 175 68 C 260 68, 280 50, 345 45" stroke="#bfdbfe" strokeWidth="1.5" className="nv-flow-line" />
          <path d="M 525 22 C 440 22, 420 40, 355 45" stroke="#bfdbfe" strokeWidth="1.5" className="nv-flow-line" />
          <path d="M 525 68 C 440 68, 420 50, 355 45" stroke="#fcd34d" strokeWidth="1.5" className="nv-flow-line" />
        </svg>
        <div className="relative z-10 mx-auto grid max-w-2xl grid-cols-3 items-center gap-3">
          <div className="flex flex-col items-end gap-2.5">
            {FLOW_LEFT.map((n) => <FlowNodeCard key={n.id} {...n} />)}
          </div>
          <div className="flex flex-col items-center justify-center">{hub}</div>
          <div className="flex flex-col items-start gap-2.5">
            {FLOW_RIGHT.map((n) => <FlowNodeCard key={n.id} {...n} />)}
          </div>
        </div>
      </div>

      {/* <sm : empilhado (par / hub / par), conector vertical entre cada fileira */}
      <div className="sm:hidden">
        <div className="flex flex-row justify-center gap-2.5">
          {FLOW_LEFT.map((n) => <FlowNodeCard key={n.id} {...n} />)}
        </div>
        <MobileConnector direction="in" colors={["#bfdbfe", "#bfdbfe"]} />
        <div className="flex justify-center">{hub}</div>
        <MobileConnector direction="out" colors={["#bfdbfe", "#fcd34d"]} />
        <div className="flex flex-row justify-center gap-2.5">
          {FLOW_RIGHT.map((n) => <FlowNodeCard key={n.id} {...n} />)}
        </div>
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
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex-shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-blue-500 text-white shadow-md ring-4 ring-blue-50">
            <span className="nv-display text-[16px] font-extrabold">N</span>
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </span>
        </div>
        <div>
          <h3 className="nv-display text-[17px] font-extrabold leading-tight text-slate-900">
            <span className="text-slate-900">{vagasRecentes}</span> <span className="text-blue-600">vagas adicionadas</span> nos últimos 7 dias
          </h3>
          <p className="nv-body mt-1 text-[12px] leading-snug text-slate-500">
            Agora você não perde mais tempo navegando pelo Facebook — já está tudo aqui, <span className="font-semibold text-blue-600">atualizado diariamente</span>.
          </p>
        </div>
      </div>

      <div className="my-4 border-t border-slate-100" />
      <SourcesFlowDiagram />
      <div className="mb-1 border-t border-slate-100" />

      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 text-center">
        <div className="px-1.5">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <UserX className="h-5 w-5 text-blue-600" />
          </div>
          <p className="nv-body text-[11px] font-bold leading-tight text-slate-900">Sem cadastro</p>
          <p className="nv-body mt-0.5 text-[10px] leading-tight text-slate-500">Nada de criar conta ou preencher dados cadastrais longos.</p>
        </div>
        <div className="px-1.5">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <MousePointerClick className="h-5 w-5 text-blue-600" />
          </div>
          <p className="nv-body text-[11px] font-bold leading-tight text-slate-900">Um toque</p>
          <p className="nv-body mt-0.5 text-[10px] leading-tight text-slate-500">Toque no botão e inicie o contato instantaneamente via WhatsApp.</p>
        </div>
        <div className="px-1.5">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <MessageCircle className="h-5 w-5 text-blue-600" />
          </div>
          <p className="nv-body text-[11px] font-bold leading-tight text-slate-900">
            Fale com o <span className="text-blue-600">担当者 (tantousha)</span>
          </p>
          <p className="nv-body mt-0.5 text-[10px] leading-tight text-slate-500">Converse diretamente com o responsável real por contratar na vaga.</p>
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
