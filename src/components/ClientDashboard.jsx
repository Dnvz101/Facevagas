// ---------------------------------------------------------------
// ClientDashboard — Área do Cliente (painel da Empreiteira). O maior
// componente do site: dashboard executivo, Publicador Mágico,
// comparador de planos, tabela de vagas.
// ---------------------------------------------------------------

import { useState, useEffect, useMemo } from "react";
import { Home, Sparkles, CreditCard, Briefcase, Eye, MessageCircle, BadgeCheck, Heart, Zap, Flame, Star, Lock, Printer, TrendingUp, MapPin, Info, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { usePermissions } from "../hooks/usePermissions.js";
import { computeBadgeStats } from "../utils/stats.js";
import { localDateKey } from "../utils/misc.js";
import { ADMIN_WHATSAPP_RAW } from "../utils/format.js";
import { safeCidade } from "../utils/jobParsing.js";
import { partnerTypeEmoji } from "../config/partnerTypes.js";
import AIPublisher from "./AIPublisher.jsx";
import JobsTable from "./JobsTable.jsx";
import PlanComparisonCards from "./PlanComparisonCards.jsx";
import ClaimJobsModal from "./ClaimJobsModal.jsx";
import PerformanceReportModal from "./PerformanceReportModal.jsx";

export default function ClientDashboard({ company, jobs, planos, registeredPartners, onPublish, onToggleBadge, onDelete, onClaimJobs, onTogglePreenchida, onTrackWhatsappSupport }) {
  const [clientTab, setClientTab] = useState("inicio");
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimNotice, setClaimNotice] = useState(null); // toast de sucesso, exibido DEPOIS que o modal já fechou

  // Mesmo cuidado do painel principal: rola de volta pro topo ao trocar
  // de sub-aba dentro da Área do Cliente (Início/Publicador/Planos/Vagas).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [clientTab]);

  const companyJobs = useMemo(
    () => jobs.filter((j) => j.empresa === company.name),
    [jobs, company.name]
  );

  // Mesmo hook usado no Admin, só que escopado às vagas dessa empresa —
  // é assim que o sistema de cotas fica pronto pra virar multi-tenant de
  // verdade no futuro, sem duplicar a lógica de permissões.
  const { plan: companyPlan, quotaUsage, canUseBadge } = usePermissions(planos, company.planKey, companyJobs);

  // Verificado é PERMANENTE uma vez concedido pelo Super Admin — não
  // depende do plano atual nem expira com o tempo. A empresa é
  // considerada verificada se o plano já incluir o selo (Pro/Master) OU
  // se o Admin tiver concedido manualmente em Parceiros & Selos
  // (company.seloVerificado); essa concessão manual nunca é revogada por
  // downgrade de plano — só se o próprio Admin desmarcar de propósito.
  const isVerificado = company.seloVerificado || companyPlan.seloVerificado;

  // WhatsApp oficial cadastrado — é o que vai pras vagas reivindicadas
  // (o telefone JP, quando existe, é só recepção adicional, exibido à parte).
  const contactPhone = company.phonePt || "";

  // "Fale Conosco" — WhatsApp direto do suporte (não é o da empresa, é o
  // seu). Mensagem pré-formatada já identifica de qual empresa é o
  // contato, pra você não precisar perguntar quem está falando.
  const SUPPORT_WHATSAPP_RAW = ADMIN_WHATSAPP_RAW;
  const supportWaLink = useMemo(() => {
    const digits = SUPPORT_WHATSAPP_RAW.replace(/\D/g, "");
    const intl = digits.startsWith("0") ? `81${digits.slice(1)}` : digits;
    const message = encodeURIComponent(
      `Olá! Sou da empresa ${company.name} (cliente NihonVagas.jp) e gostaria de falar sobre o sistema.`
    );
    return `https://wa.me/${intl}?text=${message}`;
  }, [company.name]);

  // Métricas do Dashboard Executivo (aba Início) — sempre derivadas de
  // companyJobs, nunca de um número fixo/inventado.
  const totalViews = useMemo(() => companyJobs.reduce((sum, j) => sum + (j.views || 0), 0), [companyJobs]);
  const totalContacts = useMemo(() => companyJobs.reduce((sum, j) => sum + (j.clicks || 0), 0), [companyJobs]);
  const activeJobsCount = useMemo(() => companyJobs.filter((j) => j.status !== "rascunho").length, [companyJobs]);
  const topJob = useMemo(() => {
    const withClicks = companyJobs.filter((j) => (j.clicks || 0) > 0);
    if (withClicks.length === 0) return null;
    return [...withClicks].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];
  }, [companyJobs]);

  // 2ª linha de métricas — Favoritos (contador compartilhado, somado de
  // todas as vagas da empresa), vagas em Destaque ativo, taxa de contato
  // (contatos/visualizações, um indicador de conversão) e rascunhos.
  const totalFavorites = useMemo(() => companyJobs.reduce((sum, j) => sum + (j.favoritos || 0), 0), [companyJobs]);
  const urgenteStats = useMemo(() => computeBadgeStats(companyJobs, "isUrgente"), [companyJobs]);
  const destaqueStats = useMemo(() => computeBadgeStats(companyJobs, "isFixado"), [companyJobs]);
  const recomendadoStats = useMemo(() => computeBadgeStats(companyJobs, "isRecomendado"), [companyJobs]);
  const topFavoritedJob = useMemo(() => {
    const withFavorites = companyJobs.filter((j) => (j.favoritos || 0) > 0);
    if (withFavorites.length === 0) return null;
    return [...withFavorites].sort((a, b) => (b.favoritos || 0) - (a.favoritos || 0))[0];
  }, [companyJobs]);

  // Gráfico de Evolução — soma views/clicks de TODAS as vagas da empresa,
  // dia a dia, últimos 14 dias (preenchendo com 0 os dias sem nenhum
  // registro). Vem do histórico novo (job.dailyStats) — só existe a
  // partir de quando essa função foi ativada, sem retroagir: dias
  // anteriores a isso aparecem zerados porque não havia esse registro
  // ainda, não porque não teve movimento.
  const EVOLUTION_DAYS = 14;
  const evolutionData = useMemo(() => {
    const days = [];
    for (let i = EVOLUTION_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      let views = 0;
      let clicks = 0;
      companyJobs.forEach((j) => {
        const stat = j.dailyStats?.[key];
        if (stat) {
          views += stat.views || 0;
          clicks += stat.clicks || 0;
        }
      });
      days.push({ date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, Visualizações: views, Contatos: clicks });
    }
    return days;
  }, [companyJobs]);
  const hasEvolutionData = evolutionData.some((d) => d.Visualizações > 0 || d.Contatos > 0);

  const [reportOpen, setReportOpen] = useState(false);

  // Reivindicação: fecha o modal (feito dentro do próprio ClaimJobsModal)
  // e só então mostra o aviso de sucesso aqui fora, na aba Vagas.
  const handleConfirmClaim = async (jobIds) => {
    await onClaimJobs(company.name, jobIds, contactPhone);
    setClaimNotice("Vagas vinculadas com sucesso!");
    setTimeout(() => setClaimNotice(null), 4000);
  };

  const CLIENT_SECTIONS = [
    { key: "inicio", label: "Início", icon: Home },
    { key: "publicador", label: "Publicador ✨", icon: Sparkles },
    { key: "planos", label: "Planos", icon: CreditCard },
    { key: "vagas", label: "Vagas", icon: Briefcase },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[16px]">{partnerTypeEmoji(company.tipo)}</span>
        <div className="min-w-0">
          <p className="nv-body text-[10px] font-semibold uppercase tracking-wide text-blue-500">Área do Cliente</p>
          <h2 className="nv-display truncate text-[16px] font-extrabold text-slate-900">{company.name}</h2>
        </div>
      </div>

      {/* Submenu interno — restrito a esta área, não mexe na navegação global */}
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1">
        {CLIENT_SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setClientTab(key)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-colors ${
              clientTab === key ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {clientTab === "inicio" && (
        <div className="space-y-4">
          {/* 1) Resumo de métricas */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <p className="nv-display text-[18px] font-extrabold text-slate-900">{totalViews}</p>
              <p className="nv-body flex items-center justify-center gap-1 text-[9px] font-medium text-slate-500">
                <Eye className="h-3 w-3 flex-shrink-0" /> Visualizações
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <p className="nv-display text-[18px] font-extrabold text-emerald-600">{totalContacts}</p>
              <p className="nv-body flex items-center justify-center gap-1 text-[9px] font-medium text-slate-500">
                <MessageCircle className="h-3 w-3 flex-shrink-0" /> Contatos
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <p className="nv-display text-[18px] font-extrabold text-blue-600">{activeJobsCount}</p>
              <p className="nv-body flex items-center justify-center gap-1 text-[9px] font-medium text-slate-500">
                <Briefcase className="h-3 w-3 flex-shrink-0" /> Vagas no Ar
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <p className="nv-display truncate text-[14px] font-extrabold text-slate-900">
                {companyPlan.label}
                {isVerificado && <BadgeCheck className="ml-0.5 inline h-3 w-3 fill-blue-500 text-white" />}
              </p>
              <p className="nv-body flex items-center justify-center gap-1 text-[9px] font-medium text-slate-500">
                <CreditCard className="h-3 w-3 flex-shrink-0" /> Plano
              </p>
            </div>
          </div>

          {companyPlan.metricas ? (
            <>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                <p className="nv-display text-[18px] font-extrabold text-rose-600">{totalFavorites}</p>
                <p className="nv-body flex items-center justify-center gap-1 text-[9px] font-medium text-slate-500">
                  <Heart className="h-3 w-3 flex-shrink-0" /> Favoritos
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center" title={`${urgenteStats.count} vaga${urgenteStats.count === 1 ? "" : "s"} com este selo`}>
                <p className="nv-display text-[18px] font-extrabold text-rose-600">{urgenteStats.rate === null ? "—" : `${urgenteStats.rate}%`}</p>
                <p className="nv-body flex items-center justify-center gap-1 text-[9px] font-medium text-slate-500">
                  <Zap className="h-3 w-3 flex-shrink-0" /> Cliques · Urgente
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center" title={`${destaqueStats.count} vaga${destaqueStats.count === 1 ? "" : "s"} com este selo`}>
                <p className="nv-display text-[18px] font-extrabold text-orange-600">{destaqueStats.rate === null ? "—" : `${destaqueStats.rate}%`}</p>
                <p className="nv-body flex items-center justify-center gap-1 text-[9px] font-medium text-slate-500">
                  <Flame className="h-3 w-3 flex-shrink-0" /> Cliques · Destaque
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center" title={`${recomendadoStats.count} vaga${recomendadoStats.count === 1 ? "" : "s"} com este selo`}>
                <p className="nv-display text-[18px] font-extrabold text-amber-600">{recomendadoStats.rate === null ? "—" : `${recomendadoStats.rate}%`}</p>
                <p className="nv-body flex items-center justify-center gap-1 text-[9px] font-medium text-slate-500">
                  <Star className="h-3 w-3 flex-shrink-0" /> Cliques · Recomendado
                </p>
              </div>
            </div>

            {/* Gráfico de Evolução — últimos 14 dias */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="nv-display flex items-center gap-1.5 text-[12.5px] font-bold text-slate-800">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" /> Evolução — últimos 14 dias
                </p>
                <button
                  onClick={() => setReportOpen(true)}
                  className="nv-body flex flex-shrink-0 items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[10.5px] font-semibold text-slate-500 hover:bg-slate-50"
                >
                  <Printer className="h-3 w-3" /> Relatório PDF
                </button>
              </div>
              {hasEvolutionData ? (
                <div style={{ width: "100%", height: 170 }}>
                  <ResponsiveContainer>
                    <LineChart data={evolutionData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="Visualizações" stroke="#64748b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Contatos" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="nv-body py-8 text-center text-[11px] text-slate-400">
                  Ainda sem movimento registrado nesse período. O gráfico começa a preencher a partir de agora.
                </p>
              )}
            </div>
            </>
          ) : (
            <div>
              <button onClick={() => setClientTab("planos")} className="grid w-full grid-cols-4 gap-2 text-left">
                {[
                  { icon: Heart, label: "Favoritos" },
                  { icon: Zap, label: "Urgente" },
                  { icon: Flame, label: "Destaque" },
                  { icon: Star, label: "Recomendado" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p aria-hidden className="nv-display select-none text-[18px] font-extrabold text-slate-300 blur-[3px]">88</p>
                    <Lock className="absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 text-slate-400" />
                    <p className="nv-body mt-0.5 flex items-center justify-center gap-1 text-[9px] font-medium text-slate-400">
                      <Icon className="h-3 w-3 flex-shrink-0" /> {label}
                    </p>
                  </div>
                ))}
              </button>
              <button
                onClick={() => setClientTab("planos")}
                className="nv-body mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-50 py-2 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
              >
                🔒 Métricas Avançadas — disponível nos planos Pro e Master. Toque pra ver os planos.
              </button>
            </div>
          )}

          {/* 2) Barra de ações rápidas */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setClientTab("publicador")}
              className="nv-body flex flex-1 items-center justify-center gap-1.5 rounded-full bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-blue-700"
            >
              <Sparkles className="h-3.5 w-3.5" /> Publicador Mágico (IA)
            </button>
            <button
              onClick={() => setClaimModalOpen(true)}
              className="nv-body flex flex-1 items-center justify-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-600 hover:bg-blue-100"
            >
              📥 Reivindicar Vagas
            </button>
            <button
              onClick={() => setClientTab("vagas")}
              className="nv-body flex flex-1 items-center justify-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-700 hover:bg-amber-100"
            >
              ⭐ Distribuir Selos
            </button>
          </div>

          {/* 3) Vaga com maior desempenho */}
          {topJob && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="nv-body flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                🏆 Vaga com Maior Desempenho
              </p>
              <p className="nv-display mt-1 truncate text-[14px] font-bold text-slate-900">{topJob.cargo}</p>
              <p className="nv-body flex items-center gap-1.5 text-[12px] text-slate-500">
                {safeCidade(topJob.cidade) && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {safeCidade(topJob.cidade)}</span>
                )}
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <MessageCircle className="h-3 w-3" /> {topJob.clicks} contato{topJob.clicks === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          )}

          {/* 3b) Vaga mais favoritada */}
          {topFavoritedJob && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
              <p className="nv-body flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-rose-700">
                ❤️ Vaga Mais Favoritada
              </p>
              <p className="nv-display mt-1 truncate text-[14px] font-bold text-slate-900">{topFavoritedJob.cargo}</p>
              <p className="nv-body flex items-center gap-1.5 text-[12px] text-slate-500">
                {safeCidade(topFavoritedJob.cidade) && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {safeCidade(topFavoritedJob.cidade)}</span>
                )}
                <span className="flex items-center gap-1 font-semibold text-rose-600">
                  <Heart className="h-3 w-3" fill="currentColor" /> {topFavoritedJob.favoritos} favorito{topFavoritedJob.favoritos === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          )}

          {/* 4) Fale Conosco — sugestões, dúvidas ou problemas, direto no seu WhatsApp */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="nv-display text-[14px] font-bold text-slate-900">Fale Conosco</p>
                <p className="nv-body text-[11px] text-slate-500">Dúvidas, problemas ou sugestões? Manda pra gente.</p>
              </div>
            </div>
            <a
              href={supportWaLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrackWhatsappSupport?.()}
              className="nv-body mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
          </div>

          {/* Propaganda do próprio desenvolvimento sob demanda — agora como card, não mais texto apagado */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="nv-display text-[14px] font-bold text-slate-900">Precisa de um sistema assim?</p>
                <p className="nv-body text-[11px] leading-snug text-slate-500">
                  Desenvolvemos soluções sob encomenda, a preços acessíveis.
                </p>
              </div>
            </div>
            <a
              href={supportWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="nv-body mt-3 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-[13px] font-bold text-white hover:bg-indigo-700"
            >
              <MessageCircle className="h-4 w-4" /> Fale Conosco
            </a>
          </div>
        </div>
      )}

      {clientTab === "publicador" && (
        <AIPublisher
          onPublish={onPublish}
          currentPlan={{ ...companyPlan, seloVerificado: isVerificado }}
          planKey={company.planKey}
          canUseBadge={canUseBadge}
          quotaUsage={quotaUsage}
          prefill={{ empresa: company.name, telefone: contactPhone, whatsapp: contactPhone }}
          lockedFields={["empresa"]}
          autoNovo
        />
      )}

      {clientTab === "planos" && (
        <div className="space-y-4">
          <div>
            <h3 className="nv-display mb-0.5 flex items-center gap-2 text-[15px] font-bold text-slate-900">
              <CreditCard className="h-4 w-4 text-blue-600" /> Planos
            </h3>
            <p className="nv-body mb-3 text-[12px] text-slate-500">
              Arraste pros lados pra comparar. Toque em "Quero este" pra falar com a gente pelo WhatsApp — o pagamento é
              confirmado por furikomi, sem cartão.
            </p>
          </div>

          <PlanComparisonCards planos={planos} currentPlanKey={company.planKey} companyName={company.name} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="nv-body mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Seu uso agora — {companyPlan.label}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="nv-display text-[18px] font-extrabold text-slate-800">
                  {quotaUsage.fixado}/{companyPlan.cotaTopo}
                </p>
                <p className="nv-body text-[10px] text-slate-500">🔥 Destaque</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="nv-display text-[18px] font-extrabold text-slate-800">
                  {quotaUsage.recomendado}/{companyPlan.cotaRecomendado >= 999 ? "∞" : companyPlan.cotaRecomendado}
                </p>
                <p className="nv-body text-[10px] text-slate-500">⭐ Recomendado</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="nv-display text-[18px] font-extrabold text-slate-800">
                  {quotaUsage.urgente}/{companyPlan.cotaUrgente >= 999 ? "∞" : companyPlan.cotaUrgente}
                </p>
                <p className="nv-body text-[10px] text-slate-500">🔥 Urgente</p>
              </div>
            </div>
            {isVerificado && (
              <p className="nv-body mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                <BadgeCheck className="h-3.5 w-3.5 fill-blue-500 text-white" /> Com selo verificado
                {company.seloVerificado && !companyPlan.seloVerificado && (
                  <span className="font-normal text-slate-400">(concedido pelo Admin)</span>
                )}
              </p>
            )}
          </div>

          {/* Dicas Rápidas — "Como funcionam seus benefícios" */}
          <div>
            <p className="nv-body mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              <Info className="h-3.5 w-3.5" /> Como funcionam seus benefícios
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rose-50 text-[16px]">🔥</div>
                  <p className="nv-display text-[12.5px] font-bold leading-tight text-slate-900">Slots de Destaque Reutilizáveis</p>
                </div>
                <p className="nv-body mt-2 text-[11px] leading-relaxed text-slate-500">
                  Seus selos de Destaque funcionam como fichas dinâmicas. Você pode ativar, desativar e transferir para qualquer vaga da sua lista com 1 clique.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-[16px]">⏳</div>
                  <p className="nv-display text-[12.5px] font-bold leading-tight text-slate-900">Ciclo de 7 Dias & Renovação Livre</p>
                </div>
                <p className="nv-body mt-2 text-[11px] leading-relaxed text-slate-500">
                  Cada impulso dura 7 dias no topo da primeira página e volta para o seu saldo quando o prazo termina. Você pode replicar o selo na mesma vaga novamente ou transferir para outra.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[16px]">📲</div>
                  <p className="nv-display text-[12.5px] font-bold leading-tight text-slate-900">Contato Direto no WhatsApp</p>
                </div>
                <p className="nv-body mt-2 text-[11px] leading-relaxed text-slate-500">
                  Todos os botões de candidatura conectam o trabalhador direto ao WhatsApp oficial do atendente cadastrado na sua conta.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {clientTab === "vagas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="nv-display text-[15px] font-bold text-slate-900">Suas vagas</h2>
            <button
              onClick={() => setClaimModalOpen(true)}
              className="nv-body flex flex-shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-100"
            >
              📥 Reivindicar Vagas Importadas
            </button>
          </div>

          {claimNotice && (
            <p className="nv-body flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[12px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {claimNotice}
            </p>
          )}

          {companyJobs.length === 0 ? (
            <p className="nv-body py-8 text-center text-[13px] text-slate-400">Nenhuma vaga associada a "{company.name}" ainda.</p>
          ) : (
            <JobsTable
              jobs={companyJobs}
              onToggleBadge={onToggleBadge}
              onDelete={onDelete}
              canUseBadge={canUseBadge}
              canToggleVerificado={false}
              onTogglePreenchida={onTogglePreenchida}
              quotaSummary={{
                fixado: quotaUsage.fixado,
                cotaTopo: companyPlan.cotaTopo,
                recomendado: quotaUsage.recomendado,
                cotaRecomendado: companyPlan.cotaRecomendado,
                urgente: quotaUsage.urgente,
                cotaUrgente: companyPlan.cotaUrgente,
              }}
            />
          )}
        </div>
      )}

      {/* Claim direto — sem formulário, a empresa já está logada, então
          nome oficial e WhatsApp já são conhecidos (company.name /
          contactPhone) e são aplicados automaticamente na confirmação. */}
      <ClaimJobsModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        jobs={jobs}
        companyName={company.name}
        companyPhone={contactPhone}
        registeredPartners={registeredPartners}
        onConfirm={handleConfirmClaim}
      />

      <PerformanceReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        company={company}
        companyPlan={companyPlan}
        totalViews={totalViews}
        totalContacts={totalContacts}
        activeJobsCount={activeJobsCount}
        totalFavorites={totalFavorites}
        topJob={topJob}
        topFavoritedJob={topFavoritedJob}
        evolutionData={evolutionData}
      />
    </div>
  );
}
