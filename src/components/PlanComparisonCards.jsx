// ---------------------------------------------------------------
// PlanComparisonCards — colunas de plano lado a lado (scroll
// horizontal). Botão "Quero este" abre o Stripe (Payment Link) quando
// configurado; senão cai no WhatsApp (furikomi manual) como antes.
// Mostra o preço "de" riscado quando configurado no Admin.
// ---------------------------------------------------------------

import { CheckCircle2, X, MessageCircle } from "lucide-react";
import { formatYen, toWhatsAppLink, ADMIN_WHATSAPP_RAW } from "../utils/format.js";
import { PLANOS_ORDER } from "../config/plans.js";

export default function PlanComparisonCards({ planos, currentPlanKey, companyName }) {
  const FEATURES = [
    { key: "cotaTopo", label: "🔥 Destaque", render: (p) => (p.cotaTopo >= 999 ? "∞" : p.cotaTopo) },
    { key: "cotaUrgente", label: "⚡ Urgente", render: (p) => (p.cotaUrgente >= 999 ? "∞" : p.cotaUrgente) },
    { key: "cotaRecomendado", label: "⭐ Recomendado", render: (p) => (p.cotaRecomendado >= 999 ? "∞" : p.cotaRecomendado) },
    { key: "iaLiberada", label: "✨ Publicador Mágico", render: (p) => p.iaLiberada },
    { key: "seloVerificado", label: "✔️ Verificado", render: (p) => p.seloVerificado },
    { key: "metricas", label: "📊 Métricas", render: (p) => !!p.metricas },
  ];

  const waLinkFor = (plano) => {
    const message = encodeURIComponent(
      `Olá! Sou da empresa ${companyName} (cliente NihonVagas.jp) e quero migrar para o plano ${plano.label} (${
        plano.preco > 0 ? `¥${formatYen(plano.preco)}/mês` : "grátis"
      }). Vou enviar o comprovante do furikomi.`
    );
    return `${toWhatsAppLink(ADMIN_WHATSAPP_RAW)}?text=${message}`;
  };

  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-1">
      <div className="flex gap-2.5" style={{ scrollSnapType: "x mandatory" }}>
        {PLANOS_ORDER.map((id) => {
          const plano = planos[id];
          const isCurrent = id === currentPlanKey;
          return (
            <div
              key={id}
              style={{ scrollSnapAlign: "start" }}
              className={`w-[150px] flex-shrink-0 rounded-2xl border p-3.5 ${
                isCurrent ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-400" : "border-slate-200 bg-white"
              }`}
            >
              {isCurrent && (
                <p className="nv-body mb-1.5 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white">
                  Seu plano
                </p>
              )}
              <p className="nv-display text-[14px] font-extrabold text-slate-900">{plano.label}</p>
              <div className="mb-3">
                {plano.precoOriginal > plano.preco && (
                  <p className="nv-body text-[10px] text-slate-400 line-through">¥{formatYen(plano.precoOriginal)}/mês</p>
                )}
                <p className="nv-body text-[11px] text-slate-500">
                  {plano.preco > 0 ? `¥${formatYen(plano.preco)}/mês` : "Grátis"}
                </p>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-2.5">
                {FEATURES.map(({ key, label, render }) => {
                  const value = render(plano);
                  return (
                    <div key={key} className="flex items-center justify-between gap-1">
                      <span className="nv-body text-[10px] leading-tight text-slate-500">{label}</span>
                      {typeof value === "boolean" ? (
                        value ? (
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                        ) : (
                          <X className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
                        )
                      ) : (
                        <span className="nv-display flex-shrink-0 text-[12px] font-bold text-slate-800">{value}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {isCurrent ? (
                <div className="nv-body mt-3 flex items-center justify-center rounded-xl bg-slate-100 py-2 text-[11px] font-semibold text-slate-400">
                  Plano atual
                </div>
              ) : plano.stripeLink ? (
                <a
                  href={plano.stripeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nv-body mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-[11px] font-bold text-white hover:bg-blue-700"
                >
                  💳 Quero este
                </a>
              ) : (
                <a
                  href={waLinkFor(plano)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nv-body mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-[11px] font-bold text-white hover:bg-blue-700"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Quero este
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
