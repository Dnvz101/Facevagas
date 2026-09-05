// ---------------------------------------------------------------
// JobCard — o card de vaga, componente mais usado do site inteiro.
// Copiado exato do original: flip 3D, altura dinâmica por conteúdo,
// compartilhar em camadas (Web Share → Clipboard → fallback →
// prompt), favoritar, e o brilho de destaque temporário (ranking).
// ---------------------------------------------------------------

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Heart, Clock, Languages, MapPin, Info, Share2, CheckCircle2, Home, Users, Car, Calendar } from "lucide-react";
import { TopBadge, VerificadoBadge, TopSalarioBadge, UrgenteBadge, RecomendadoBadge, NovoBadge, WhatsAppIcon } from "./Badges.jsx";
import { toWhatsAppLink } from "../utils/format.js";
import { formatYen } from "../utils/format.js";
import { salaryUnitLabel, simplifyTurno, simplifyNihongo, safeCidade, isTopSalarioRule } from "../utils/jobParsing.js";

export default function JobCard({ job, isFlipped, onToggleFlip, onContact, onView, isTop, isHighlighted, onSimulate, isFavorited = false, onToggleFavorite }) {
  const waLink = toWhatsAppLink(job.whatsapp, job.cargo);

  const stop = (e) => e.stopPropagation();

  // Conta 1 visualização por montagem do card no feed público — só
  // dispara se o "onView" for passado (o preview do Publicador Mágico,
  // por exemplo, não passa, então não conta como visualização real).
  useEffect(() => {
    onView?.(job.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  const unit = salaryUnitLabel(job.salarioMax || job.salarioHora);
  const turnoLabel = simplifyTurno(job.turno);
  const nihongoLabel = simplifyNihongo(job.nihongo);
  const cidadeOk = safeCidade(job.cidade);
  const localLabel = [cidadeOk, job.provincia].filter(Boolean).join(" · ");

  // Compartilhar vaga — tenta em camadas, da mais moderna até a que
  // funciona em QUALQUER navegador/sandbox, sem nunca ficar em silêncio:
  // 1) Web Share API nativa (menu de compartilhar do celular)
  // 2) Clipboard API moderna (copia e avisa com "Copiado!")
  // 3) Fallback antigo via textarea + execCommand("copy") — funciona
  //    mesmo quando a Clipboard API é bloqueada por política do iframe
  //    (ex: dentro do sandbox de artifact do Claude)
  // 4) Último recurso: window.prompt com o texto pronto pra copiar
  //    manualmente — não depende de nenhuma permissão de navegador,
  //    então sempre funciona, mesmo no ambiente mais restrito.
  const [shareCopied, setShareCopied] = useState(false);

  const legacyCopy = (text) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleShare = async (e) => {
    stop(e);
    const shareText = `${job.cargo} — ${job.empresa}\n💰 ¥${formatYen(job.salarioHora)}/${unit}${localLabel ? ` · 📍 ${localLabel}` : ""}\nVia nihonvagas.jp`;
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const fullText = `${shareText}\n${shareUrl}`;

    // 1) Web Share API — se existir, tenta primeiro
    if (navigator.share) {
      try {
        await navigator.share({ title: job.cargo, text: shareText, url: shareUrl });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return; // usuário cancelou o menu nativo, tudo certo
        // qualquer outro erro (ex: bloqueado pelo sandbox) cai pros métodos abaixo
      }
    }

    // 2) Clipboard API moderna
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
        return;
      }
    } catch {
      // segue pro fallback legado abaixo
    }

    // 3) Fallback legado (execCommand) — cobre sandboxes que bloqueiam a Clipboard API
    if (legacyCopy(fullText)) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      return;
    }

    // 4) Último recurso — sempre funciona, em qualquer ambiente
    window.prompt("Copie o texto da vaga abaixo:", fullText);
  };

  // O verso (descrição completa + tags) é naturalmente mais alto que a
  // frente (resumo compacto). Em vez de forçar os dois lados a terem a
  // MESMA altura (o que deixa espaço vazio sobrando de um dos lados),
  // medimos a altura real de cada face via ref e ajustamos o card
  // dinamicamente: compacto fechado, expande só quando vira pro verso.
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(null);

  // Mede a altura sempre que "isFlipped" ou o conteúdo relevante do card
  // muda (inclui os campos que ligam/desligam selo, já que isso pode
  // acontecer sem trocar a referência do objeto "job" inteiro em certas
  // passagens de estado). Uma segunda medição via requestAnimationFrame
  // pega qualquer reflow tardio (ex: fonte carregando um instante
  // depois) sem precisar de ResizeObserver.
  useLayoutEffect(() => {
    const el = isFlipped ? backRef.current : frontRef.current;
    if (!el) return;
    setCardHeight(el.scrollHeight);
    const raf = requestAnimationFrame(() => setCardHeight(el.scrollHeight));
    return () => cancelAnimationFrame(raf);
  }, [isFlipped, job, job.isUrgente, job.isRecomendado, job.isNovo, job.preenchida]);

  // top/left/right (sem "bottom") deixa cada face medir sua própria altura
  // de conteúdo, mesmo sendo position:absolute — daí o ref.scrollHeight
  // funciona certo pra cada lado, sem depender um do outro.
  const faceStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    overflow: "hidden",
    transition: "transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)",
  };

  return (
    <div id={`job-${job.id}`} className="nv-rise relative" style={{ perspective: "1600px" }}>
      {isTop && <TopBadge />}
      {onToggleFavorite && (
        <button
          onClick={(e) => { stop(e); onToggleFavorite(job.id); }}
          title={isFavorited ? "Remover dos favoritos" : "Favoritar vaga"}
          className={`absolute -right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 flex-shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors ${
            isFavorited
              ? "border-rose-500 bg-rose-500 text-white"
              : "border-slate-200 bg-white text-slate-300 hover:text-rose-400"
          }`}
        >
          <Heart className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      )}

      <div
        onClick={onToggleFlip}
        className="relative cursor-pointer"
        style={{
          transformStyle: "preserve-3d",
          height: cardHeight ? `${cardHeight}px` : "auto",
          transition: "height 0.4s ease",
        }}
      >
        {/* FRONT */}
        <div
          ref={frontRef}
          style={{ ...faceStyle, transform: isFlipped ? "rotateX(180deg)" : "rotateX(0deg)", pointerEvents: isFlipped ? "none" : "auto" }}
          className="relative rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className={job.preenchida ? "pointer-events-none select-none opacity-60 blur-[3px]" : ""}>
          {/* Topo do card: só empresa, título, Top Salário (se houver) e o preço.
              Recomendado/Urgente moraram pra linha de metadados abaixo — evita
              que o cabeçalho fique alto/apertado quando vários selos se acumulam.
              O selo de verificação (check azul) vai colado ao nome da empresa. */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="nv-body flex items-center gap-1 truncate text-[10px] font-semibold tracking-wide text-slate-400">
                <span className="truncate">{job.empresa}</span>
                {job.seloVerificado && <VerificadoBadge />}
              </p>
              <h3 className="nv-display truncate text-base font-bold leading-snug text-slate-900">{job.cargo}</h3>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1">
              {isTopSalarioRule(job.salarioMax || job.salarioHora) && <TopSalarioBadge />}
              <div className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">
                {job.salarioMax
                  ? `¥${formatYen(job.salarioHora)} ~ ¥${formatYen(job.salarioMax)}/${unit}`
                  : `¥${formatYen(job.salarioHora)}/${unit}`}
              </div>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {turnoLabel}</span>
            <span className="flex items-center gap-1"><Languages className="h-3 w-3" /> {nihongoLabel}</span>
            {localLabel && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {localLabel}</span>}
          </div>

          {(job.isUrgente || job.isRecomendado || job.isNovo) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {job.isUrgente && <UrgenteBadge />}
              {job.isRecomendado && <RecomendadoBadge />}
              {job.isNovo && <NovoBadge />}
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="flex min-w-0 flex-1 items-center gap-1 truncate text-[12px] font-medium text-blue-600">
              <Info className="h-3 w-3 flex-shrink-0" /> Toque para ver a descrição completa
            </p>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { stop(e); onContact(job.id, waLink); }}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
                >
                  <WhatsAppIcon className="h-3 w-3 animate-pulse" /> WhatsApp
                </a>
              )}
              <button
                onClick={handleShare}
                title="Compartilhar vaga"
                className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <Share2 className="h-3 w-3" />
                {shareCopied && (
                  <span className="nv-body absolute -top-8 right-0 whitespace-nowrap rounded-full bg-slate-800 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
                    Copiado!
                  </span>
                )}
              </button>
            </div>
          </div>
          </div>
          {job.preenchida && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1.5 rounded-full bg-slate-900/85 px-4 py-2 shadow-lg">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                <span className="nv-display whitespace-nowrap text-[13px] font-extrabold text-white">Vaga Preenchida</span>
              </div>
            </div>
          )}
        </div>

        {/* BACK */}
        <div
          ref={backRef}
          style={{ ...faceStyle, transform: isFlipped ? "rotateX(360deg)" : "rotateX(180deg)", pointerEvents: isFlipped ? "auto" : "none" }}
          className="flex flex-col rounded-2xl border border-blue-200 bg-white p-3.5 shadow-sm"
        >
          <p className="nv-body flex items-center gap-1 text-[10px] font-semibold tracking-wide text-blue-500">
            {job.empresa}
            {job.seloVerificado && <VerificadoBadge />}
          </p>
          <h3 className="nv-display mt-0.5 text-sm font-bold leading-snug text-slate-900">{job.cargo}</h3>

          <p className="nv-body mt-2 text-xs leading-relaxed text-slate-700">{job.descricao}</p>

          {job.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {job.tags.map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{t}</span>
              ))}
            </div>
          )}

          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" /> Turno: {job.turno || "—"}</span>
            <span className="flex items-center gap-1"><Languages className="h-3 w-3 text-blue-500" /> Nihongo: {job.nihongo}</span>
            <span className="flex items-center gap-1"><Home className="h-3 w-3 text-blue-500" /> Moradia: {job.moradia}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3 text-blue-500" /> H: {job.vagaHomens ? "Sim" : "Não"} · M: {job.vagaMulheres ? "Sim" : "Não"}</span>
            <span className="flex items-center gap-1"><Car className="h-3 w-3 text-blue-500" /> Condução: {job.conducao}</span>
            {job.idadeMaxima != null && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-blue-500" /> Idade: {job.idadeMaxima >= 999 ? "Sem limite" : `Até ${job.idadeMaxima} anos`}
              </span>
            )}
          </div>

          <p className="mt-2 text-center text-[10px] font-medium text-slate-400">Toque no card para voltar</p>
        </div>
      </div>

      {/* GLOW RING — fora do container que tem perspective/preserve-3d de
          propósito. Mesmo sem transform próprio, um elemento DENTRO de um
          contexto 3D ainda é repintado junto quando algo nele anima — o
          navegador trata todo o contexto como uma coisa só. Como irmão do
          container 3D (fora dele), essa camada fica isolada num contexto
          de composição próprio e não afeta o anti-aliasing do conteúdo.
          Dourado (isHighlighted) tem prioridade sobre o vermelho de
          Urgente — é um destaque temporário (vem do clique num ranking),
          só pra ajudar a achar a vaga na tela, então precisa se sobressair. */}
      {isHighlighted ? (
        <div className="nv-card-glow-gold pointer-events-none absolute inset-0 rounded-2xl border-2 border-transparent" />
      ) : (
        job.isUrgente && <div className="nv-card-glow-urgente pointer-events-none absolute inset-0 rounded-2xl border-2 border-transparent" />
      )}
    </div>
  );
}
