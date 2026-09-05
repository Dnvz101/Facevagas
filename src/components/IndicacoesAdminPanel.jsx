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

import { useState } from "react";
import { HeartHandshake, ListChecks, Check } from "lucide-react";
import AIPublisher from "./AIPublisher.jsx";
import JobsTable from "./JobsTable.jsx";
import { WhatsAppIcon } from "./Badges.jsx";
import { toWhatsAppLink } from "../utils/format.js";
import { idadeIndicacaoLabel } from "../utils/jobParsing.js";

// Uma vaga TRADICIONAL que qualifica por idade — o Admin decide aqui,
// vaga a vaga, se ela é "ativada" pro cross-post (v23: deixou de ser
// automático), pode corrigir o WhatsApp (o scraper às vezes não pega
// esse campo) e testar o contato com o mesmo botão/ícone oficial do
// WhatsApp usado no card da vaga.
function QualifyingJobRow({ job, onToggleBadge, onUpdateWhatsapp }) {
  const [whatsappInput, setWhatsappInput] = useState(job.whatsapp || "");
  const [saved, setSaved] = useState(false);
  const dirty = whatsappInput !== (job.whatsapp || "");
  const waLink = toWhatsAppLink(job.whatsapp, job.cargo);

  const handleSave = () => {
    onUpdateWhatsapp(job.id, whatsappInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="nv-body truncate text-[12.5px] font-semibold text-slate-800">{job.cargo}</p>
          <p className="nv-body truncate text-[11px] text-slate-400">{job.empresa}</p>
        </div>
        <span className="nv-body flex-shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
          {idadeIndicacaoLabel(job.idadeMaxima)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Ativar/desativar cross-post — mesmo handler genérico de sempre
            (handleToggleBadge), só que numa chave nova (indicacoesAtiva)
            em vez de um selo pago. */}
        <button
          onClick={() => onToggleBadge(job.id, "indicacoesAtiva")}
          className={`nv-body flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
            job.indicacoesAtiva ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          {job.indicacoesAtiva && <Check className="h-3 w-3" />}
          {job.indicacoesAtiva ? "Ativa na aba pública" : "Ativar na aba pública"}
        </button>

        <input
          value={whatsappInput}
          onChange={(e) => setWhatsappInput(e.target.value)}
          placeholder="WhatsApp (ex: 819012345678)"
          className="nv-body min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] text-slate-700 outline-none focus:border-blue-400"
        />
        {dirty ? (
          <button
            onClick={handleSave}
            className="nv-body flex-shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white"
          >
            Salvar
          </button>
        ) : saved ? (
          <span className="nv-body flex-shrink-0 text-[11px] font-semibold text-emerald-600">Salvo!</span>
        ) : waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
          </a>
        ) : (
          <span className="nv-body flex-shrink-0 text-[10.5px] text-slate-400">Sem WhatsApp cadastrado</span>
        )}
      </div>
    </div>
  );
}

export function IndicacoesConfigEditor({ config, setConfig }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="nv-display text-[15px] font-bold text-slate-900">Configuração da aba Indicações</h3>
      <p className="nv-body mb-3 text-[12px] text-slate-500">
        O texto do herói (título "Depois dos 55...") agora é uma <b>imagem fixa</b> (
        <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">/public/indicacoes-hero.png</code>), gerada por IA — pra
        trocar esse texto, é preciso gerar uma imagem nova e substituir o arquivo. Os dois campos abaixo continuam funcionando de
        verdade.
      </p>

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
            Critério de elegibilidade das vagas tradicionais na lista "qualificam" — a ativação de cada uma continua manual.
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
  onUpdateWhatsapp,
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
          O anúncio original menciona idade — mas só entram na aba pública de verdade as que você <b>ativar</b> aqui. Aproveite pra
          conferir/corrigir o WhatsApp antes de ativar.
        </p>
        {qualifyingTraditionalJobs.length === 0 ? (
          <p className="nv-body py-4 text-center text-[12px] text-slate-400">Nenhuma vaga tradicional qualificando no momento.</p>
        ) : (
          <div className="max-h-[28rem] space-y-2 overflow-y-auto">
            {qualifyingTraditionalJobs.map((j) => (
              <QualifyingJobRow key={j.id} job={j} onToggleBadge={onToggleBadge} onUpdateWhatsapp={onUpdateWhatsapp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
