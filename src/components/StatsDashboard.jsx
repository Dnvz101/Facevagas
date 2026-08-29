// ---------------------------------------------------------------
// StatsDashboard — Admin: estatísticas de uso do site inteiro
// (contadores, gráfico de barras, impacto dos selos).
// ---------------------------------------------------------------

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { computeImpactMultiplier } from "../utils/stats.js";
import { MAIN_TAB_LABELS } from "../config/constants.js";

export default function StatsDashboard({ siteStats, jobs }) {
  const s = siteStats || {};

  const clickCards = [
    { label: "🌙 Modo Escuro ligado", value: s.darkModeOn || 0 },
    { label: "☀️ Modo Escuro desligado", value: s.darkModeOff || 0 },
    { label: "📲 Cliques em Instalar PWA", value: s.pwaInstallClicks || 0 },
    { label: "💬 Cliques em Fale Conosco", value: s.whatsappSupportClicks || 0 },
    { label: "🔔 Cliques no Banner de Alerta", value: s.alertBannerClicks || 0 },
  ];

  const filterEntries = Object.entries(s.filters || {}).sort((a, b) => b[1] - a[1]);
  const tabEntries = Object.entries(s.tabs || {})
    .map(([key, value]) => [MAIN_TAB_LABELS[key] || key, value])
    .sort((a, b) => b[1] - a[1]);

  const topJobsSite = useMemo(() => {
    return [...jobs]
      .filter((j) => (j.views || 0) > 0 || (j.clicks || 0) > 0)
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5);
  }, [jobs]);

  // Impacto dos selos — quantas vezes mais clique um card promovido
  // recebe em relação a um card comum, no site inteiro.
  const impactPromovidos = useMemo(
    () => computeImpactMultiplier(jobs, (j) => j.isFixado || j.isUrgente || j.isRecomendado || j.isNovo),
    [jobs]
  );
  const impactBadges = useMemo(
    () => [
      { label: "🔥 Destaque", value: computeImpactMultiplier(jobs, (j) => j.isFixado) },
      { label: "⚡ Urgente", value: computeImpactMultiplier(jobs, (j) => j.isUrgente) },
      { label: "⭐ Recomendado", value: computeImpactMultiplier(jobs, (j) => j.isRecomendado) },
      { label: "🆕 Nova Vaga", value: computeImpactMultiplier(jobs, (j) => j.isNovo) },
      { label: "✔️ Verificado", value: computeImpactMultiplier(jobs, (j) => j.seloVerificado) },
      { label: "💎 Top Salário", value: computeImpactMultiplier(jobs, (j) => j.isTopSalario) },
    ],
    [jobs]
  );

  const chartData = clickCards.map((c) => ({ name: c.label.replace(/^\S+\s/, ""), Cliques: c.value }));

  return (
    <div className="space-y-4">
      <p className="nv-body rounded-xl bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
        📊 Contadores simples de uso do site inteiro — sem cookies, sem identificar quem clicou, só totais agregados desde que essa função foi ativada.
      </p>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
        <p className="nv-body text-[10px] font-bold uppercase tracking-wide text-indigo-700">🚀 Impacto dos Selos</p>
        <p className="nv-display mt-1 text-[20px] font-extrabold text-indigo-700">
          {impactPromovidos === null ? "Ainda sem dados suficientes" : `Cards promovidos recebem ${impactPromovidos.toFixed(1)}x mais cliques`}
        </p>
        <p className="nv-body mb-3 text-[10.5px] text-indigo-500">
          Compara a taxa de contato (cliques/visualizações) de vagas com pelo menos 1 selo ativo vs. vagas sem nenhum selo.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {impactBadges.map((b) => (
            <div key={b.label} className="rounded-xl bg-white p-2.5 text-center">
              <p className="nv-display text-[15px] font-extrabold text-slate-800">{b.value === null ? "—" : `${b.value.toFixed(1)}x`}</p>
              <p className="nv-body text-[10px] text-slate-500">{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {clickCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center">
            <p className="nv-display text-[22px] font-extrabold text-slate-900">{c.value}</p>
            <p className="nv-body text-[10.5px] leading-tight text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="nv-display mb-2 text-[12.5px] font-bold text-slate-800">Cliques por ação</p>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 6, right: 10, left: -22, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} angle={-30} textAnchor="end" interval={0} height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="Cliques" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="nv-display mb-2 text-[12.5px] font-bold text-slate-800">🧭 Abas mais visitadas</p>
        {tabEntries.length === 0 ? (
          <p className="nv-body py-4 text-center text-[11px] text-slate-400">Sem dados ainda.</p>
        ) : (
          <div className="space-y-1.5">
            {tabEntries.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="nv-body text-[12px] text-slate-600">{label}</span>
                <span className="nv-display text-[13px] font-bold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="nv-display mb-2 text-[12.5px] font-bold text-slate-800">🔎 Filtros mais usados</p>
        {filterEntries.length === 0 ? (
          <p className="nv-body py-4 text-center text-[11px] text-slate-400">Sem dados ainda.</p>
        ) : (
          <div className="space-y-1.5">
            {filterEntries.slice(0, 10).map(([key, value]) => {
              const [group, val] = key.split(":");
              const groupLabel = group === "sexo" ? "Sexo" : group === "provincia" ? "Província" : "Nihongo";
              return (
                <div key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="nv-body text-[12px] text-slate-600">
                    <span className="text-slate-400">{groupLabel}:</span> {val}
                  </span>
                  <span className="nv-display text-[13px] font-bold text-slate-800">{value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="nv-display mb-2 text-[12.5px] font-bold text-slate-800">🏆 Vagas mais clicadas (site inteiro)</p>
        {topJobsSite.length === 0 ? (
          <p className="nv-body py-4 text-center text-[11px] text-slate-400">Sem dados ainda.</p>
        ) : (
          <div className="space-y-1.5">
            {topJobsSite.map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="nv-body truncate text-[12px] font-semibold text-slate-700">{j.cargo}</p>
                  <p className="nv-body truncate text-[10px] text-slate-400">{j.empresa}</p>
                </div>
                <span className="nv-display flex-shrink-0 text-[12px] font-bold text-emerald-600">{j.clicks || 0} cliques</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
