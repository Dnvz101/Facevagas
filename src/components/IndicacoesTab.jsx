// ---------------------------------------------------------------
// IndicacoesTab — aba pública da campanha 55+. Layout aprovado depois
// de várias rodadas de ajuste num mockup HTML publicado à parte (ver
// histórico de conversa) — página inteira com fundo azul-marinho
// contínuo (mesma cor do herói, sem costura), herói como IMAGEM fixa
// (gerada por IA de imagem, texto já embutido nos pixels — ver nota
// abaixo), cards de atalho com gradiente vívido + botão de seta, e
// "Como funciona" em 3 colunas centralizadas dentro de um card escuro
// translúcido que funde com o fundo. Cards da lista de vagas
// continuam brancos, flutuando por cima do fundo escuro.
//
// ⚠️ IMPORTANTE: como o texto do herói (eyebrow/título/subtítulo)
// agora está DESENHADO na imagem /public/indicacoes-hero.png (pixels,
// não texto real), os campos de texto do herói em
// indicacoes_config NÃO mudam mais nada visualmente aqui — só
// "idadeMinima" e "whatsappIndicar" de fato têm efeito nesta versão.
// Pra trocar o texto do herói de verdade, é preciso gerar uma imagem
// nova e trocar o arquivo em /public/indicacoes-hero.png.
// ---------------------------------------------------------------

import { useRef } from "react";
import { Info } from "lucide-react";
import IndicacaoCard from "./IndicacaoCard.jsx";
import { WhatsAppIcon } from "./Badges.jsx";
import { toWhatsAppLink } from "../utils/format.js";

const STEPS = [
  <>Manda uma mensagem no <b>WhatsApp</b> contando sobre a vaga</>,
  <>Inclui <b>empresa, salário</b> e o WhatsApp de quem contrata</>,
  <>A gente confirma e publica — seu nome fica <b>anônimo</b>, se preferir</>,
];

export default function IndicacoesTab({ config, jobs, onContact }) {
  const listRef = useRef(null);
  const indicarLink = toWhatsAppLink(config.whatsappIndicar);
  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    // -mx-5 -mt-6 cancela o padding do <main> (px-5 py-6 no App.jsx) só
    // pra ESSA aba, fazendo o fundo escuro e a imagem do herói baterem
    // na borda da tela (full-bleed) em vez de ficarem com uma margem
    // clara ao redor, como as outras abas usam.
    <div className="-mx-5 -mt-6 pb-8" style={{ background: "linear-gradient(180deg, rgb(3,20,53) 0%, rgb(9,26,62) 35%, rgb(14,33,78) 100%)" }}>
      <img src="/indicacoes-hero.png" alt="Depois dos 55, achar vaga não devia ser tão difícil" className="block w-full" />

      <div className="px-5 pt-5">
        {/* Split cards */}
        <div className="mb-5 flex gap-2.5">
          <a
            href={indicarLink || undefined}
            target={indicarLink ? "_blank" : undefined}
            rel="noopener noreferrer"
            onClick={(e) => { if (!indicarLink) { e.preventDefault(); scrollToList(); } }}
            className="relative flex flex-1 items-start gap-2.5 overflow-hidden rounded-2xl p-3.5"
            style={{ background: "linear-gradient(135deg, #ff9a5a 0%, #e8623d 100%)" }}
          >
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-white/20 text-[17px]">❤️</div>
            <div className="min-w-0 flex-1 pr-6">
              <p className="nv-display text-[13px] font-extrabold text-white">Indique aqui</p>
              <p className="nv-body text-[10px] font-bold leading-snug text-white/85">Viu uma vaga na sua fábrica? Manda pra gente</p>
            </div>
            <div className="absolute right-2.5 top-1/2 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-[14px] font-bold text-white">
              →
            </div>
          </a>

          <button
            onClick={scrollToList}
            className="relative flex flex-1 items-start gap-2.5 overflow-hidden rounded-2xl p-3.5 text-left"
            style={{ background: "linear-gradient(135deg, #4f83f2 0%, #2563eb 100%)" }}
          >
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-white/20 text-[17px]">📋</div>
            <div className="min-w-0 flex-1 pr-6">
              <p className="nv-display text-[13px] font-extrabold text-white">Ver Indicações</p>
              <p className="nv-body text-[10px] font-bold leading-snug text-white/85">Vagas confirmadas, indicadas por trabalhadores</p>
            </div>
            <div className="absolute right-2.5 top-1/2 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-[14px] font-bold text-white">
              →
            </div>
          </button>
        </div>

        {/* Como funciona */}
        <div className="mb-5 rounded-[18px] border border-white/[.14] bg-white/[.06] p-4">
          <p className="nv-display mb-3.5 text-[13.5px] font-extrabold text-white">Como funciona</p>
          <div className="flex gap-2.5">
            {STEPS.map((text, i) => (
              <div key={i} className="flex flex-1 flex-col items-center text-center">
                <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[11px] font-extrabold text-white">
                  {i + 1}
                </span>
                <p className="nv-body text-[10.5px] leading-snug text-[#dbe3f5]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {indicarLink ? (
          <a
            href={indicarLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-[13.5px] font-bold text-white shadow-lg shadow-emerald-500/30"
          >
            <WhatsAppIcon className="h-4 w-4" /> Indicar uma vaga pelo WhatsApp
          </a>
        ) : (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-dashed border-white/20 px-4 py-3.5 text-[12px] text-white/50">
            <Info className="h-4 w-4 flex-shrink-0" /> Indicação por WhatsApp em breve — por enquanto, fale com o nosso suporte.
          </div>
        )}

        {/* Lista */}
        <div ref={listRef} className="mb-3 flex items-baseline justify-between">
          <h2 className="nv-display text-[17px] font-bold text-white">Vagas indicadas</h2>
          <span className="nv-body text-[13px] text-white/60">
            {jobs.length} confirmada{jobs.length === 1 ? "" : "s"}
          </span>
        </div>

        {jobs.length === 0 ? (
          <p className="nv-body py-8 text-center text-[13px] text-white/50">
            Nenhuma vaga com idade flexível no momento — volte em breve.
          </p>
        ) : (
          <div className="space-y-2.5">
            {jobs.map((job) => (
              <IndicacaoCard key={job.id} job={job} onContact={onContact} />
            ))}
          </div>
        )}

        <p className="nv-body pb-1 pt-4 text-center text-[12px] leading-relaxed text-white/40">
          Só entram aqui vagas que mencionam idade explicitamente no anúncio (limite alto ou sem limite) — nunca por ausência de menção.
        </p>
      </div>
    </div>
  );
}
