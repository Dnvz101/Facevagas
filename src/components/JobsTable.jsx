// ---------------------------------------------------------------
// JobsTable — tabela de gerenciamento de vagas (Admin e Área do
// Cliente), com toggle de selos respeitando cota do plano.
// ---------------------------------------------------------------

import { useState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import { VerificadoBadge } from "./Badges.jsx";
import { BADGE_DEFS, ADMIN_ONLY_BADGE_DEFS } from "../config/badgeDefs.js";
import { QUOTA_BADGE_MAP } from "../hooks/usePermissions.js";
import { destaqueDiasRestantes, novoHorasRestantes, STALE_THRESHOLD_MS } from "../utils/badgeCycles.js";

export default function JobsTable({ jobs, onToggleBadge, onDelete, canUseBadge, canToggleVerificado = true, quotaSummary = null, showNovoBadge = false, onTogglePreenchida, onToggleArquivada }) {
  // Aviso visível (não é só um tooltip) quando alguém tenta ativar um
  // selo sem cota disponível — some sozinho depois de alguns segundos.
  const [quotaWarning, setQuotaWarning] = useState(null);

  const handleBadgeClick = (job, key, label) => {
    const turningOn = !job[key];
    const isQuotaBadge = key in QUOTA_BADGE_MAP;
    if (turningOn && isQuotaBadge && !canUseBadge(key)) {
      setQuotaWarning(`Limite de cotas de ${label} atingido. Faça upgrade para liberar mais.`);
      setTimeout(() => setQuotaWarning(null), 4000);
      return;
    }
    onToggleBadge(job.id, key);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="nv-display text-[15px] font-bold text-slate-900">Vagas cadastradas</h3>
            <p className="nv-body text-[12px] text-slate-500">{jobs.length} vagas · cliques totais: {jobs.reduce((s, j) => s + j.clicks, 0)}</p>
          </div>
          {quotaSummary && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="nv-body flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-600">
                🔥 Destaque: {quotaSummary.fixado}/{quotaSummary.cotaTopo}
              </span>
              <span className="nv-body flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                ⭐ Recomendado: {quotaSummary.recomendado}/{quotaSummary.cotaRecomendado >= 999 ? "∞" : quotaSummary.cotaRecomendado}
              </span>
              <span className="nv-body flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-600">
                ⚡ Urgente: {quotaSummary.urgente}/{quotaSummary.cotaUrgente >= 999 ? "∞" : quotaSummary.cotaUrgente}
              </span>
            </div>
          )}
        </div>
        {quotaWarning && (
          <p className="nv-body mt-2 flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {quotaWarning}
          </p>
        )}
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        <table className="w-full text-left text-[12px]">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="nv-body px-4 py-2.5 font-semibold">Vaga</th>
              <th className="nv-body px-4 py-2.5 font-semibold">Cliques</th>
              <th className="nv-body px-4 py-2.5 font-semibold">Selos</th>
              <th className="nv-body px-4 py-2.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="nv-body flex items-center gap-1 font-semibold text-slate-800">
                    {j.cargo}
                    {j.preenchida && (
                      <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">Preenchida</span>
                    )}
                  </p>
                  <p className="nv-body flex items-center gap-1 text-[11px] text-slate-400">
                    {j.empresa} {j.seloVerificado && <VerificadoBadge />}
                  </p>
                </td>
                <td className="px-4 py-3 nv-body font-semibold text-slate-700">{j.clicks}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {[...BADGE_DEFS, ...(showNovoBadge ? ADMIN_ONLY_BADGE_DEFS : [])].map(({ key, label, emoji }) => {
                      const isQuotaBadge = key in QUOTA_BADGE_MAP;
                      const blocked = isQuotaBadge && !j[key] && !canUseBadge(key);
                      // Destaque tem ciclo de 7 dias, Nova Vaga tem ciclo
                      // de 48h — mostra quanto falta pro ciclo renovar
                      // (nunca "expira": o selo/cota não se perde, só
                      // libera pra reaplicar na mesma vaga ou em outra).
                      const diasRestantes = key === "isFixado" ? destaqueDiasRestantes(j) : null;
                      const horasRestantes = key === "isNovo" ? novoHorasRestantes(j) : null;
                      return (
                        <button
                          key={key}
                          onClick={() => handleBadgeClick(j, key, label)}
                          title={
                            blocked
                              ? "Cota do plano atual esgotada para este selo"
                              : diasRestantes !== null
                              ? `Renova em ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"} — a cota volta pro seu saldo automaticamente`
                              : horasRestantes !== null
                              ? `Some sozinho em ${horasRestantes}h`
                              : label
                          }
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            j[key]
                              ? "bg-blue-600 text-white"
                              : blocked
                              ? "cursor-not-allowed bg-slate-50 text-slate-300"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {emoji} {label}
                          {diasRestantes !== null && (
                            <span className="ml-1 font-normal opacity-80">
                              · {diasRestantes === 0 ? "renova em breve" : `${diasRestantes}d`}
                            </span>
                          )}
                          {horasRestantes !== null && (
                            <span className="ml-1 font-normal opacity-80">
                              · {horasRestantes === 0 ? "some em breve" : `${horasRestantes}h`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {canToggleVerificado ? (
                      <button
                        onClick={() => onToggleBadge(j.id, "seloVerificado")}
                        title="Selo Verificado"
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${j.seloVerificado ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}
                      >
                        ✔️ Verificado
                      </button>
                    ) : (
                      <span
                        title="Selo Verificado — definido só pelo Admin Master"
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          j.seloVerificado ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-300"
                        }`}
                      >
                        ✔️ Verificado
                      </span>
                    )}
                    {onTogglePreenchida && (
                      <button
                        onClick={() => onTogglePreenchida(j.id)}
                        title={j.preenchida ? "Reabrir vaga (voltar a mostrar como disponível)" : "Marcar como preenchida"}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          j.preenchida ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        ✅ {j.preenchida ? "Preenchida" : "Marcar preenchida"}
                      </button>
                    )}
                    {onToggleArquivada && j.arquivada && (
                      <button
                        onClick={() => onToggleArquivada(j.id)}
                        title={`Arquivada automaticamente — o scraper não viu essa vaga há ${STALE_THRESHOLD_MS / (24 * 60 * 60 * 1000)}+ dias. Toque pra reabrir.`}
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-200"
                      >
                        📦 Arquivada — reabrir
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onDelete(j.id)} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Admin: Planos & Créditos
   - Editor de preços/cotas por plano (salvo via activeAdapter).
   - Seletor de teste (mock) pra simular a troca de plano da conta
     atual e ver o usePermissions reagir em tempo real.
--------------------------------------------------------------- */
