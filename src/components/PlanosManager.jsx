// ---------------------------------------------------------------
// PlanosManager — Admin: editor de preço/cota dos planos (agora
// também com preço "de" riscado e link de pagamento do Stripe) +
// simulador de "conta atual em qual plano" (teste local, não afeta
// vagas publicadas de verdade).
// ---------------------------------------------------------------

import { Settings, CreditCard, BadgeCheck, Loader2 } from "lucide-react";
import { PLANOS_ORDER } from "../config/plans.js";

export default function PlanosManager({ planos, setPlanos, savingPlanos, planKey, setPlanKey, quotaUsage }) {
  const STRING_FIELDS = ["label", "stripeLink"];
  const updatePlano = (id, field, value) => {
    setPlanos((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: STRING_FIELDS.includes(field) ? value : Number(value) || 0 },
    }));
  };

  const numberField = (id, field, label) => (
    <div>
      <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">{label}</label>
      <input
        type="number"
        min={0}
        value={planos[id][field]}
        onChange={(e) => updatePlano(id, field, e.target.value)}
        className="nv-body w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-400"
      />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Seletor de teste (mock) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <Settings className="h-4 w-4 text-blue-600" /> Simular plano da conta atual
        </h3>
        <p className="nv-body mb-3 text-[12px] text-slate-500">
          Troca rápida (só neste navegador) para testar as restrições de cada plano em tempo real — não afeta as vagas já publicadas.
        </p>
        <div className="flex flex-wrap gap-2">
          {PLANOS_ORDER.map((id) => (
            <button
              key={id}
              onClick={() => setPlanKey(id)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${
                planKey === id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {planos[id].label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <span>Destaque: <strong>{quotaUsage.fixado}</strong>/{planos[planKey].cotaTopo}</span>
          <span>Recomendado: <strong>{quotaUsage.recomendado}</strong>/{planos[planKey].cotaRecomendado >= 999 ? "∞" : planos[planKey].cotaRecomendado}</span>
          <span>Urgente: <strong>{quotaUsage.urgente}</strong>/{planos[planKey].cotaUrgente >= 999 ? "∞" : planos[planKey].cotaUrgente}</span>
          <span className="flex items-center gap-1">Selo verificado: {planos[planKey].seloVerificado ? <BadgeCheck className="h-3.5 w-3.5 fill-blue-500 text-white" /> : "Não"}</span>
        </div>
      </div>

      {/* Editor de preços e cotas */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
              <CreditCard className="h-4 w-4 text-blue-600" /> Planos de assinatura
            </h3>
            <p className="nv-body mb-3 text-[12px] text-slate-500">Preços e cotas de visibilidade — editáveis e salvos direto no armazenamento.</p>
          </div>
          {savingPlanos && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-blue-500" />}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PLANOS_ORDER.map((id) => (
            <div key={id} className="rounded-xl border border-slate-200 p-3.5">
              <input
                value={planos[id].label}
                onChange={(e) => updatePlano(id, "label", e.target.value)}
                className="nv-display mb-2 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] font-bold text-slate-900 outline-none focus:border-blue-400"
              />
              <div className="grid grid-cols-2 gap-2">
                {numberField(id, "preco", "Preço (¥)")}
                {numberField(id, "precoOriginal", "Preço \"de\" riscado (¥) — 0 = não mostra")}
                {numberField(id, "cotaTopo", "Cota Destaque")}
                {numberField(id, "cotaRecomendado", "Cota Recomendado (999 = ilimitado)")}
                {numberField(id, "cotaUrgente", "Cota Urgente (999 = ilimitado)")}
              </div>
              <div className="mt-2">
                <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Link de pagamento (Stripe)</label>
                <input
                  value={planos[id].stripeLink || ""}
                  onChange={(e) => updatePlano(id, "stripeLink", e.target.value)}
                  placeholder="https://buy.stripe.com/..."
                  className="nv-body w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-400"
                />
                <p className="nv-body mt-1 text-[10px] text-slate-400">
                  {planos[id].stripeLink ? "✔️ Ativo — o botão \"Quero este\" já abre o Stripe." : "Vazio — o botão \"Quero este\" ainda abre o WhatsApp."}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <label className="nv-body flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={planos[id].iaLiberada}
                    onChange={(e) => setPlanos((prev) => ({ ...prev, [id]: { ...prev[id], iaLiberada: e.target.checked } }))}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                  IA liberada
                </label>
                <label className="nv-body flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={planos[id].seloVerificado}
                    onChange={(e) => setPlanos((prev) => ({ ...prev, [id]: { ...prev[id], seloVerificado: e.target.checked } }))}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                  Selo verificado
                </label>
                <label className="nv-body flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!planos[id].metricas}
                    onChange={(e) => setPlanos((prev) => ({ ...prev, [id]: { ...prev[id], metricas: e.target.checked } }))}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                  Métricas avançadas
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
