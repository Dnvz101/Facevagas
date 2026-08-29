// ---------------------------------------------------------------
// PerformanceReportModal — relatório PDF sem biblioteca externa: usa
// window.print() + CSS de impressão (#nv-print-report em index.css).
// ---------------------------------------------------------------

import { Printer, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

export default function PerformanceReportModal({
  isOpen, onClose, company, companyPlan, totalViews, totalContacts, activeJobsCount,
  totalFavorites, topJob, topFavoritedJob, evolutionData,
}) {
  if (!isOpen) return null;
  const today = new Date().toLocaleDateString("pt-BR");
  const conversionRate = totalViews > 0 ? Math.round((totalContacts / totalViews) * 100) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="nv-rise flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
            <Printer className="h-4 w-4 text-blue-600" /> Relatório de Desempenho
          </h3>
          <button onClick={onClose} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div id="nv-print-report">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="nv-display text-[16px] font-extrabold text-slate-900">{company.name}</p>
                <p className="nv-body text-[11px] text-slate-500">Relatório de desempenho · NihonVagas.jp</p>
              </div>
              <p className="nv-body text-[11px] text-slate-400">Gerado em {today}</p>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="nv-display text-[16px] font-extrabold text-slate-900">{totalViews}</p>
                <p className="nv-body text-[9px] text-slate-500">Visualizações</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="nv-display text-[16px] font-extrabold text-emerald-600">{totalContacts}</p>
                <p className="nv-body text-[9px] text-slate-500">Contatos</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="nv-display text-[16px] font-extrabold text-blue-600">{activeJobsCount}</p>
                <p className="nv-body text-[9px] text-slate-500">Vagas no Ar</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="nv-display text-[16px] font-extrabold text-indigo-600">{conversionRate === null ? "—" : `${conversionRate}%`}</p>
                <p className="nv-body text-[9px] text-slate-500">Taxa de Conversão (contatos/visualizações)</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="nv-display text-[16px] font-extrabold text-rose-600">{totalFavorites}</p>
                <p className="nv-body text-[9px] text-slate-500">Favoritos recebidos</p>
              </div>
            </div>

            {topJob && (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <p className="nv-body text-[10px] font-bold uppercase tracking-wide text-amber-700">🏆 Vaga com Maior Desempenho</p>
                <p className="nv-display mt-0.5 text-[13px] font-bold text-slate-900">{topJob.cargo}</p>
                <p className="nv-body text-[11px] text-slate-500">{topJob.clicks} contato{topJob.clicks === 1 ? "" : "s"}</p>
              </div>
            )}

            {topFavoritedJob && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                <p className="nv-body text-[10px] font-bold uppercase tracking-wide text-rose-700">❤️ Vaga Mais Favoritada</p>
                <p className="nv-display mt-0.5 text-[13px] font-bold text-slate-900">{topFavoritedJob.cargo}</p>
                <p className="nv-body text-[11px] text-slate-500">{topFavoritedJob.favoritos} favorito{topFavoritedJob.favoritos === 1 ? "" : "s"}</p>
              </div>
            )}

            <p className="nv-body mb-1.5 text-[11px] font-bold text-slate-700">Evolução — últimos 14 dias</p>
            <div style={{ width: "100%", height: 160 }}>
              <ResponsiveContainer>
                <LineChart data={evolutionData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={22} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Line type="monotone" dataKey="Visualizações" stroke="#64748b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Contatos" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="nv-body mt-4 text-center text-[9px] text-slate-300">nihonvagas.jp — relatório gerado automaticamente</p>
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2 border-t border-slate-100 p-4">
          <button
            onClick={onClose}
            className="nv-body flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Fechar
          </button>
          <button
            onClick={() => window.print()}
            className="nv-body flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" /> Baixar / Imprimir PDF
          </button>
        </div>
      </div>
    </div>
  );
}
