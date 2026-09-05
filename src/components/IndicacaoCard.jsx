// ---------------------------------------------------------------
// IndicacaoCard — card compacto (sem flip, diferente do JobCard) usado
// só na aba Indicações. Segue o mockup aprovado (indicacoes.html):
// tag de origem no topo (🤝 indicação manual vs 📋 vaga tradicional
// que qualificou por idade), cargo, local + idade, salário e CTA de
// WhatsApp. Deliberadamente mais simples que o JobCard — essa aba é
// sobre achar rápido, não sobre explorar descrição completa.
// ---------------------------------------------------------------

import { MapPin } from "lucide-react";
import { WhatsAppIcon, VerificadoBadge } from "./Badges.jsx";
import { toWhatsAppLink, formatYen } from "../utils/format.js";
import { salaryUnitLabel, safeCidade, idadeIndicacaoLabel } from "../utils/jobParsing.js";

export default function IndicacaoCard({ job, onContact }) {
  const waLink = toWhatsAppLink(job.whatsapp, job.cargo);
  const unit = salaryUnitLabel(job.salarioMax || job.salarioHora);
  const cidadeOk = safeCidade(job.cidade);
  const localLabel = [cidadeOk, job.provincia].filter(Boolean).join(" · ");
  const idadeLabel = idadeIndicacaoLabel(job.idadeMaxima);
  const origemManual = !!job.indicacao;

  return (
    <div className="nv-rise rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span
        className={`nv-body mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          origemManual ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
        }`}
      >
        {origemManual ? "🤝 Indicado por trabalhador" : "📋 Menciona idade no anúncio"}
      </span>

      <p className="nv-body flex items-center gap-1 text-[10px] font-semibold text-slate-400">
        <span className="truncate">{job.empresa}</span>
        {job.seloVerificado && <VerificadoBadge />}
      </p>
      <h3 className="nv-display text-[14.5px] font-bold leading-snug text-slate-900">{job.cargo}</h3>

      <p className="nv-body mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] text-slate-500">
        {localLabel && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" /> {localLabel}
          </span>
        )}
        {localLabel && idadeLabel && <span>·</span>}
        {idadeLabel && <span>{idadeLabel}</span>}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="nv-body flex-shrink-0 text-[13px] font-bold text-blue-600">
          {job.salarioMax
            ? `¥${formatYen(job.salarioHora)} ~ ¥${formatYen(job.salarioMax)}/${unit}`
            : `¥${formatYen(job.salarioHora)}/${unit}`}
        </span>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation(); onContact?.(job.id, waLink); }}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
