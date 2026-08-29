// ---------------------------------------------------------------
// PartnerManagementModal — Admin: gerencia TODOS os parceiros
// (filtrar por tipo, Selo Verificado, trocar plano).
// ---------------------------------------------------------------

import { useState, useMemo } from "react";
import { Users, X, BadgeCheck } from "lucide-react";
import { PARTNER_TYPES, partnerTypeLabel, partnerTypeEmoji } from "../config/partnerTypes.js";
import { PLANOS_ORDER } from "../config/plans.js";

export default function PartnerManagementModal({ isOpen, onClose, registeredPartners, onToggleVerificado, onChangePlano }) {
  const [filterTipo, setFilterTipo] = useState("todos"); // "todos" | "empreiteira" | "prestador" | "loja"

  const filtered = useMemo(
    () => (filterTipo === "todos" ? registeredPartners : registeredPartners.filter((p) => p.tipo === filterTipo)),
    [registeredPartners, filterTipo]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="nv-rise flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
            <Users className="h-4 w-4 text-blue-600" /> Parceiros & Selos
          </h3>
          <button onClick={onClose} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-5 py-3">
          {[{ key: "todos", label: "Todos" }, ...PARTNER_TYPES.map((t) => ({ key: t.key, label: `${t.emoji} ${t.label}` }))].map(
            (opt) => (
              <button
                key={opt.key}
                onClick={() => setFilterTipo(opt.key)}
                className={`nv-body flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  filterTipo === opt.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {opt.label}
              </button>
            )
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {filtered.length === 0 ? (
            <p className="nv-body py-8 text-center text-[13px] text-slate-400">Nenhum parceiro nessa categoria ainda.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="nv-display flex items-center gap-1 truncate text-[13px] font-bold text-slate-900">
                        {partnerTypeEmoji(p.tipo)} {p.name}
                        {p.seloVerificado && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 fill-blue-500 text-white" />}
                      </p>
                      <p className="nv-body text-[11px] text-slate-500">{partnerTypeLabel(p.tipo)} · {p.email}</p>
                      {p.phonePt && <p className="nv-body text-[11px] text-slate-400">🇧🇷 {p.phonePt}</p>}
                    </div>
                    <button
                      onClick={() => onToggleVerificado(p.id)}
                      title="Ativar/desativar Selo Verificado"
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        p.seloVerificado ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      ✔️ Verificado
                    </button>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {PLANOS_ORDER.map((planKey) => (
                      <button
                        key={planKey}
                        onClick={() => onChangePlano(p.id, planKey)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          p.planKey === planKey ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {planKey === "gratis" ? "Grátis" : planKey === "start" ? "Start" : planKey === "pro" ? "Pro" : "Master"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
