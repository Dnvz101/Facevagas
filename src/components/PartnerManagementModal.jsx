// ---------------------------------------------------------------
// PartnerManagementModal — Admin: gerencia TODOS os parceiros
// (filtrar por tipo, Selo Verificado, trocar plano, editar nome,
// excluir).
// ---------------------------------------------------------------

import { useState, useMemo } from "react";
import { Users, X, BadgeCheck, Settings, Trash2, MessageCircle, Eye, Heart, BarChart3 } from "lucide-react";
import { PARTNER_TYPES, partnerTypeLabel, partnerTypeEmoji } from "../config/partnerTypes.js";
import { PLANOS_ORDER } from "../config/plans.js";
import RelatorioDesempenho from "./RelatorioDesempenho.jsx";

// Selo controlável + qual campo de cota do plano ele consome — usado
// só pra montar o resumo "usando X de Y" aqui embaixo. Fonte separada
// do BADGE_DEFS principal (que é sobre TOGGLE de selo, não sobre
// mostrar cota) pra não arriscar mexer em comportamento existente.
const SELO_COTA = [
  { key: "isFixado", label: "Destaque", emoji: "🔥", cotaField: "cotaTopo" },
  { key: "isRecomendado", label: "Recomendado", emoji: "⭐", cotaField: "cotaRecomendado" },
  { key: "isUrgente", label: "Urgente", emoji: "⚡", cotaField: "cotaUrgente" },
];

export default function PartnerManagementModal({ isOpen, onClose, registeredPartners, jobs, planos, onToggleVerificado, onChangePlano, onRename, onDelete }) {
  const [filterTipo, setFilterTipo] = useState("todos"); // "todos" | "empreiteira" | "prestador" | "loja"
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [relatorioPartner, setRelatorioPartner] = useState(null); // parceiro com o modal de Relatório aberto, ou null

  const filtered = useMemo(
    () => (filterTipo === "todos" ? registeredPartners : registeredPartners.filter((p) => p.tipo === filterTipo)),
    [registeredPartners, filterTipo]
  );

  // Resumo por parceiro — mesmo vínculo vaga↔empresa usado em todo o
  // resto do Admin (comparar "empresa" com o nome do parceiro), pra
  // ficar consistente com handleToggleVerificado/handleRenamePartner.
  const resumoPorParceiro = useMemo(() => {
    const map = new Map();
    for (const p of registeredPartners) {
      const vagasDaEmpresa = jobs.filter((j) => j.empresa === p.name);
      map.set(p.id, {
        totalVagas: vagasDaEmpresa.length,
        cliquesWhatsapp: vagasDaEmpresa.reduce((s, j) => s + (j.clicks || 0), 0),
        cliquesCard: vagasDaEmpresa.reduce((s, j) => s + (j.views || 0), 0),
        curtidas: vagasDaEmpresa.reduce((s, j) => s + (j.favoritos || 0), 0),
        selos: SELO_COTA.map(({ key, label, emoji, cotaField }) => ({
          label,
          emoji,
          usando: vagasDaEmpresa.filter((j) => j[key]).length,
          cota: planos[p.planKey]?.[cotaField] ?? 0,
        })).filter((s) => s.cota > 0), // plano sem direito a esse selo nem aparece na lista — não é informação útil
      });
    }
    return map;
  }, [registeredPartners, jobs, planos]);

  const startEditing = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
  };
  const saveEditing = (id) => {
    const trimmed = editName.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  };

  const handleDelete = (p) => {
    const ok = window.confirm(
      `Excluir "${p.name}"? O login dessa conta para de funcionar. As vagas/anúncios já publicados por ela NÃO são apagados — continuam no site, só sem uma conta associada. Essa ação não tem volta.`
    );
    if (ok) onDelete(p.id);
  };

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
              {filtered.map((p) => {
                const resumo = resumoPorParceiro.get(p.id);
                return (
                  <div key={p.id} className="rounded-xl border border-slate-200 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {editingId === p.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveEditing(p.id); if (e.key === "Escape") setEditingId(null); }}
                              maxLength={60}
                              className="nv-body min-w-0 flex-1 rounded-lg border border-blue-300 px-2 py-1 text-[13px] font-bold text-slate-900 outline-none"
                            />
                            <button onClick={() => saveEditing(p.id)} className="flex-shrink-0 rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-bold text-white">
                              Salvar
                            </button>
                            <button onClick={() => setEditingId(null)} className="flex-shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <p className="nv-display flex items-center gap-1 truncate text-[13px] font-bold text-slate-900">
                            {partnerTypeEmoji(p.tipo)} {p.name}
                            {p.seloVerificado && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 fill-blue-500 text-white" />}
                          </p>
                        )}
                        <p className="nv-body text-[11px] text-slate-500">{partnerTypeLabel(p.tipo)} · {p.email}</p>
                        {p.phonePt && <p className="nv-body text-[11px] text-slate-400">🇧🇷 {p.phonePt}</p>}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        {resumo && resumo.totalVagas > 0 && (
                          <button
                            onClick={() => setRelatorioPartner(p)}
                            title="Gerar relatório de desempenho"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-blue-500 hover:bg-blue-50"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {editingId !== p.id && (
                          <button
                            onClick={() => startEditing(p)}
                            title="Editar nome"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(p)}
                          title="Excluir parceiro"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Resumo — cliques/curtidas somados de todas as vagas
                        dessa empresa + uso de cada selo vs. a cota do
                        plano atual dela. Só aparece quando ela já tem
                        pelo menos 1 vaga publicada, pra não mostrar um
                        bloco de zeros sem sentido pra conta recém-criada. */}
                    {resumo && resumo.totalVagas > 0 && (
                      <div className="mt-2.5 rounded-lg bg-slate-50 px-2.5 py-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3 text-emerald-600" /> {resumo.cliquesWhatsapp} WhatsApp</span>
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-blue-500" /> {resumo.cliquesCard} no card</span>
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-500" /> {resumo.curtidas} curtidas</span>
                          <span className="text-slate-400">· {resumo.totalVagas} vaga{resumo.totalVagas === 1 ? "" : "s"}</span>
                        </div>
                        {resumo.selos.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {resumo.selos.map((s) => (
                              <span
                                key={s.label}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  s.usando >= s.cota && s.cota < 999 ? "bg-amber-100 text-amber-700" : "bg-white text-slate-500"
                                }`}
                              >
                                {s.emoji} {s.label} {s.usando}/{s.cota >= 999 ? "∞" : s.cota}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => onToggleVerificado(p.id)}
                        title="Ativar/desativar Selo Verificado"
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          p.seloVerificado ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        ✔️ Verificado
                      </button>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
      {relatorioPartner && (
        <RelatorioDesempenho partner={relatorioPartner} jobs={jobs} onClose={() => setRelatorioPartner(null)} />
      )}
    </div>
  );
}
