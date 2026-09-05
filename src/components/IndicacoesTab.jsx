// ---------------------------------------------------------------
// IndicacoesTab — aba pública da campanha 55+. Layout copiado do
// mockup aprovado (indicacoes.html): hero gradiente escuro, 2 cards
// de atalho (Indicar/Ver), "Como funciona" em 3 passos, botão grande
// de WhatsApp, e a lista de vagas (indicações manuais + vagas
// tradicionais que qualificam por idade, já vindo mesclada e
// ordenada do App.jsx via isIndicacaoElegivel).
//
// O texto do hero (eyebrow/título/subtítulo) e o WhatsApp dedicado
// vêm de "config" (tabela indicacoes_config, editável no Admin) — só
// o "Como funciona" fica fixo no código por enquanto (é sobre o
// processo, não sobre a campanha em si; dá pra tornar editável depois
// se algum dia o passo a passo mudar).
// ---------------------------------------------------------------

import { useRef } from "react";
import { HeartHandshake, ClipboardList, Info } from "lucide-react";
import IndicacaoCard from "./IndicacaoCard.jsx";
import { WhatsAppIcon } from "./Badges.jsx";
import { toWhatsAppLink } from "../utils/format.js";

const COMO_FUNCIONA_STEPS = [
  <>Manda uma mensagem no <b>WhatsApp</b> contando sobre a vaga</>,
  <>Inclui <b>empresa, salário e o WhatsApp</b> de quem contrata</>,
  <>A gente confirma e publica — <b>seu nome fica anônimo</b>, se preferir</>,
];

export default function IndicacoesTab({ config, jobs, onContact }) {
  const listRef = useRef(null);
  const indicarLink = toWhatsAppLink(config.whatsappIndicar);

  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div
        className="nv-rise relative overflow-hidden rounded-2xl p-6 text-white shadow-sm"
        style={{ background: "linear-gradient(150deg, #12203f 0%, #1d3466 55%, #2563eb 100%)" }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(232,98,61,.35), transparent 70%)" }}
        />
        <p className="nv-body relative mb-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-blue-100">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" /> {config.eyebrow}
        </p>
        <h1 className="nv-display relative max-w-[300px] text-[21px] font-extrabold leading-snug">{config.titulo}</h1>
        <p className="nv-body relative mt-2 max-w-[320px] text-[12.5px] leading-relaxed text-blue-100/90">{config.subtitulo}</p>
      </div>

      {/* Split cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {indicarLink ? (
          <a
            href={indicarLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-orange-200 bg-orange-50 p-3.5 text-left"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
              <HeartHandshake className="h-4 w-4" />
            </div>
            <p className="nv-display text-[13px] font-bold text-slate-900">Indique aqui</p>
            <p className="nv-body mt-0.5 text-[11px] leading-snug text-slate-500">Viu uma vaga na sua fábrica? Manda pra gente</p>
          </a>
        ) : (
          <button onClick={scrollToList} className="rounded-2xl border border-orange-200 bg-orange-50 p-3.5 text-left">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
              <HeartHandshake className="h-4 w-4" />
            </div>
            <p className="nv-display text-[13px] font-bold text-slate-900">Indique aqui</p>
            <p className="nv-body mt-0.5 text-[11px] leading-snug text-slate-500">Viu uma vaga na sua fábrica? Manda pra gente</p>
          </button>
        )}
        <button onClick={scrollToList} className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-left">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ClipboardList className="h-4 w-4" />
          </div>
          <p className="nv-display text-[13px] font-bold text-slate-900">Ver indicações</p>
          <p className="nv-body mt-0.5 text-[11px] leading-snug text-slate-500">Vagas confirmadas, indicadas por trabalhadores</p>
        </button>
      </div>

      {/* Como funciona */}
      <div>
        <p className="nv-display mb-2 text-[13px] font-bold text-slate-900">Como funciona</p>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
          {COMO_FUNCIONA_STEPS.map((text, i) => (
            <div key={i} className="flex items-start gap-3 py-3.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-50 text-[11px] font-bold text-orange-600">
                {i + 1}
              </span>
              <p className="nv-body text-[12.5px] leading-relaxed text-slate-700">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {indicarLink ? (
        <a
          href={indicarLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-emerald-500/20"
        >
          <WhatsAppIcon className="h-4 w-4" /> Indicar uma vaga pelo WhatsApp
        </a>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-3.5 text-[12px] text-slate-400">
          <Info className="h-4 w-4 flex-shrink-0" /> Indicação por WhatsApp em breve — por enquanto, fale com o nosso suporte.
        </div>
      )}

      {/* Lista */}
      <div ref={listRef} className="flex items-baseline justify-between pt-2">
        <h2 className="nv-display text-[15px] font-bold text-slate-900">Vagas indicadas</h2>
        <span className="nv-body text-[11.5px] text-slate-500">
          {jobs.length} confirmada{jobs.length === 1 ? "" : "s"}
        </span>
      </div>

      {jobs.length === 0 ? (
        <p className="nv-body py-8 text-center text-[13px] text-slate-400">
          Nenhuma vaga com idade flexível no momento — volte em breve.
        </p>
      ) : (
        <div className="space-y-2.5">
          {jobs.map((job) => (
            <IndicacaoCard key={job.id} job={job} onContact={onContact} />
          ))}
        </div>
      )}

      <p className="nv-body pb-2 text-center text-[10.5px] leading-relaxed text-slate-400">
        Só entram aqui vagas que mencionam idade explicitamente no anúncio (limite alto ou sem limite) — nunca por ausência de menção.
      </p>
    </div>
  );
}
