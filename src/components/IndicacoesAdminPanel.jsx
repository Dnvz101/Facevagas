// ---------------------------------------------------------------
// IndicacoesAdminPanel — gestão completa da campanha Indicações (55+)
// dentro do Painel Admin:
//  1. Editor do hero (eyebrow/título/subtítulo), regra de idade do
//     cross-post e WhatsApp dedicado pra indicar — tudo salvo em
//     indicacoes_config (singleton).
//  2. "Nova indicação manual" — reaproveita o Publicador Mágico
//     (AIPublisher) já existente, só prefixando indicacao:true. É o
//     mesmo fluxo que o Admin já usa pra publicar vaga de empresa: cola
//     o texto que a pessoa mandou, revisa, publica.
//  3. Lista das indicações manuais já publicadas — reaproveita o
//     JobsTable genérico (mesmos selos/preenchida/exclusão de sempre).
//  4. Lista SÓ INFORMATIVA das vagas tradicionais que qualificam pro
//     cross-post por idade — nenhuma ação aqui, é pra o Admin ver o
//     que está entrando automaticamente na aba pública.
// ---------------------------------------------------------------

import { HeartHandshake, ListChecks } from "lucide-react";
import AIPublisher from "./AIPublisher.jsx";
import JobsTable from "./JobsTable.jsx";
import { idadeIndicacaoLabel } from "../utils/jobParsing.js";

export function IndicacoesConfigEditor({ config, setConfig }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="nv-display text-[15px] font-bold text-slate-900">Banner da aba Indicações</h3>
      <p className="nv-body mb-3 text-[12px] text-slate-500">Texto do topo (hero) mostrado pra todo mundo na aba pública.</p>

      <div className="space-y-3">
        <div>
          <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Frase pequena (eyebrow)</label>
          <input
            value={config.eyebrow}
            onChange={(e) => setConfig((c) => ({ ...c, eyebrow: e.target.value }))}
            className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Título</label>
          <textarea
            value={config.titulo}
            onChange={(e) => setConfig((c) => ({ ...c, titulo: e.target.value }))}
            rows={2}
            className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Subtítulo</label>
          <textarea
            value={config.subtitulo}
            onChange={(e) => setConfig((c) => ({ ...c, subtitulo: e.target.value }))}
            rows={3}
            className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Idade mínima do cross-post</label>
            <input
              type="number"
              value={config.idadeMinima}
              onChange={(e) => setConfig((c) => ({ ...c, idadeMinima: parseInt(e.target.value, 10) || 0 }))}
              className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
            />
            <p className="nv-body mt-1 text-[10px] leading-relaxed text-slate-400">
              Vagas tradicionais com idade máxima igual ou maior que isso (ou "sem limite") entram sozinhas aqui.
            </p>
          </div>
          <div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">WhatsApp p/ indicar (opcional)</label>
            <input
              value={config.whatsappIndicar}
              onChange={(e) => setConfig((c) => ({ ...c, whatsappIndicar: e.target.value }))}
              placeholder="Ex: 5511999999999"
              className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
            />
            <p className="nv-body mt-1 text-[10px] leading-relaxed text-slate-400">
              Vazio = botão de WhatsApp fica escondido (função ainda não configurada — combinado pra depois).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IndicacoesAdminPanel({
  config,
  setConfig,
  indicacoesJobs,
  qualifyingTraditionalJobs,
  onPublish,
  currentPlan,
  planKey,
  quotaUsage,
  onToggleBadge,
  onDelete,
  onDeleteMany,
  onTogglePreenchida,
  onToggleArquivada,
}) {
  return (
    <div className="space-y-5">
      <IndicacoesConfigEditor config={config} setConfig={setConfig} />

      <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <HeartHandshake className="h-4 w-4 text-orange-600" /> Nova indicação manual
        </h3>
        <p className="nv-body mb-3 text-[12px] text-slate-500">
          Cole aqui o que a pessoa mandou (WhatsApp, print, texto solto) — publica já marcada como "🤝 Indicado por trabalhador".
        </p>
        <AIPublisher
          onPublish={(formData) => onPublish({ ...formData, indicacao: true })}
          currentPlan={currentPlan}
          planKey={planKey}
          canUseBadge={() => true}
          quotaUsage={quotaUsage}
          prefill={{ indicacao: true }}
        />
      </div>

      <div>
        <h3 className="nv-display mb-2 text-[14px] font-bold text-slate-900">
          🤝 Indicações manuais publicadas ({indicacoesJobs.length})
        </h3>
        {indicacoesJobs.length === 0 ? (
          <p className="nv-body py-4 text-center text-[12px] text-slate-400">Nenhuma indicação manual cadastrada ainda.</p>
        ) : (
          <JobsTable
            jobs={indicacoesJobs}
            onToggleBadge={onToggleBadge}
            onDelete={onDelete}
            onDeleteMany={onDeleteMany}
            canUseBadge={() => true}
            onTogglePreenchida={onTogglePreenchida}
            onToggleArquivada={onToggleArquivada}
          />
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display mb-1 flex items-center gap-2 text-[14px] font-bold text-slate-900">
          <ListChecks className="h-4 w-4 text-blue-600" /> Vagas tradicionais que qualificam ({qualifyingTraditionalJobs.length})
        </h3>
        <p className="nv-body mb-3 text-[12px] text-slate-500">
          Entram sozinhas no feed público de Indicações porque o anúncio original menciona idade — nenhuma ação precisa aqui, é só informativo.
        </p>
        {qualifyingTraditionalJobs.length === 0 ? (
          <p className="nv-body py-4 text-center text-[12px] text-slate-400">Nenhuma vaga tradicional qualificando no momento.</p>
        ) : (
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {qualifyingTraditionalJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2">
                <div className="min-w-0">
                  <p className="nv-body truncate text-[12px] font-semibold text-slate-800">{j.cargo}</p>
                  <p className="nv-body truncate text-[11px] text-slate-400">{j.empresa}</p>
                </div>
                <span className="nv-body flex-shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                  {idadeIndicacaoLabel(j.idadeMaxima)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
