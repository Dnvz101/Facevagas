// ---------------------------------------------------------------
// ExclusivePageBanner — substitui o BannerCard normal quando alguém
// chega pelo link da Página Exclusiva de uma empresa (?empresa=slug).
// Deixa claro de quem é a página e dá um jeito fácil de "escapar" pro
// feed completo — além do menu principal, que continua visível
// sempre (candidato nunca fica preso).
// ---------------------------------------------------------------

import { Building2, ArrowLeft, BadgeCheck } from "lucide-react";

export default function ExclusivePageBanner({ partner, count, onClear }) {
  return (
    <div className="nv-rise rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="nv-display flex items-center gap-1 truncate text-[13.5px] font-bold text-indigo-900">
            {partner.name}
            {partner.seloVerificado && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 fill-blue-500 text-white" />}
          </p>
          <p className="nv-body text-[11px] text-indigo-500">Página exclusiva de vagas · NihonVagas.jp</p>
        </div>
      </div>
      <p className="nv-body mt-2.5 text-[12px] leading-relaxed text-slate-600">
        Aqui estão {count} vaga{count === 1 ? "" : "s"} publicada{count === 1 ? "" : "s"} por {partner.name} — atualizado direto por eles, sem cadastro pra você ver.
      </p>
      <button
        onClick={onClear}
        className="nv-body mt-2.5 flex items-center gap-1 text-[11.5px] font-semibold text-indigo-600 hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Ver todas as vagas do NihonVagas.jp
      </button>
    </div>
  );
}
