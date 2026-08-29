// ---------------------------------------------------------------
// Calculadora de Salário Líquido (Tedori) — conteúdo (usado tanto na
// aba pública "Calculadora" quanto dentro do modal) + o modal em si
// (acessível pelo cabeçalho ou por qualquer JobCard).
// ---------------------------------------------------------------

import { useState, useEffect, useMemo } from "react";
import { Calculator, X } from "lucide-react";
import { calculateNightHours, yenLabel } from "../../utils/kakeibo.js";

export function SalaryCalculatorContent({ initialJikyu, watchInitialJikyu = false }) {
  const [hourlyBase, setHourlyBase] = useState(initialJikyu || 1500);
  const [teatePerHour, setTeatePerHour] = useState(0);
  const [standardHours, setStandardHours] = useState(7.75);
  const [age, setAge] = useState(35);
  const [nikoutai, setNikoutai] = useState(true);
  const [yakinStart, setYakinStart] = useState("20:00");
  const [yakinEnd, setYakinEnd] = useState("04:45");
  const [kmPerDay, setKmPerDay] = useState(10);
  const [yenPerKm, setYenPerKm] = useState(15);
  const [hiruDays, setHiruDays] = useState(11);
  const [yakinDays, setYakinDays] = useState(10);
  const [overtimeNormal, setOvertimeNormal] = useState(20);
  const [overtimeNight, setOvertimeNight] = useState(5);
  const [applyShakai, setApplyShakai] = useState(true);

  // Só usado dentro do modal (watchInitialJikyu=true): toda vez que abre
  // vindo de um JobCard diferente, atualiza o Jikyu pro dessa vaga — mas
  // só nesse momento (não fica "grudando" o valor de volta enquanto a
  // pessoa está editando à mão). Na aba fixa "Calculadora" isso não se
  // aplica (não tem "vaga de origem" pra sincronizar).
  useEffect(() => {
    if (watchInitialJikyu) setHourlyBase(initialJikyu || 1500);
  }, [watchInitialJikyu, initialJikyu]);

  const rateUnemployment = 0.5;
  const rateIncomeTax = 3.75;
  const rateShakai = 14.15;
  const kaigoRate = age >= 40 && age <= 64 ? 0.91 : 0;

  const payslip = useMemo(() => {
    const nn = (v) => (typeof v === "number" && !isNaN(v) ? v : Number(v) || 0);
    const days = nn(hiruDays) + nn(yakinDays);
    const normalHours = days * nn(standardHours);
    const totalHours = normalHours + nn(overtimeNormal) + nn(overtimeNight);
    const base = normalHours * nn(hourlyBase);
    const teate = totalHours * nn(teatePerHour);

    const nightPerShift = nikoutai ? calculateNightHours(yakinStart, yakinEnd) : 0;
    const nightBonus = nn(yakinDays) * nightPerShift * nn(hourlyBase) * 0.25;
    const otNormal = nn(overtimeNormal) * nn(hourlyBase) * 1.25;
    const otNight = nn(overtimeNight) * nn(hourlyBase) * 1.5;
    const transport = days * nn(kmPerDay) * nn(yenPerKm);
    const gross = base + teate + nightBonus + otNormal + otNight + transport;

    const unemployment = (gross * rateUnemployment) / 100;
    const incomeTax = (gross * rateIncomeTax) / 100;
    const kaigo = (gross * kaigoRate) / 100;
    const shakai = applyShakai ? (gross * rateShakai) / 100 : 0;
    const deductions = unemployment + incomeTax + kaigo + shakai;

    return {
      days, normalHours, totalHours, base, teate, nightBonus, otNormal, otNight,
      transport, gross, unemployment, incomeTax, kaigo, shakai, deductions,
      net: gross - deductions,
    };
  }, [
    hourlyBase, teatePerHour, standardHours, age, nikoutai, yakinStart, yakinEnd,
    kmPerDay, yenPerKm, hiruDays, yakinDays, overtimeNormal, overtimeNight, applyShakai,
  ]);

  const numField = (label, value, setValue, step = 1) => (
    <div>
      <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">{label}</label>
      <input
        type="number"
        step={step}
        value={value === 0 ? "" : value}
        onChange={(e) => setValue(e.target.value === "" ? 0 : Number(e.target.value))}
        placeholder="0"
        className="nv-body w-full rounded-lg border border-slate-200 px-2.5 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
      />
    </div>
  );

  const timeField = (label, value, setValue) => (
    <div>
      <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="nv-body w-full rounded-lg border border-slate-200 px-2.5 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Destaque: líquido estimado (Tedori) */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-sm">
        <p className="nv-body text-[10px] font-bold uppercase tracking-wide opacity-90">Estimativa líquida na mão (Tedori)</p>
        <p className="nv-display mt-1 text-[32px] font-extrabold leading-none">{yenLabel(payslip.net)}</p>
        <p className="nv-body mt-1.5 text-[11px] opacity-85">
          {payslip.days} dias trabalhados · {payslip.totalHours.toFixed(1)}h totais no mês
        </p>
      </div>

      {/* Dados contratuais */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="nv-display mb-3 text-[13px] font-bold text-slate-900">⚙️ Dados Contratuais</h4>
        <div className="grid grid-cols-2 gap-3">
          {numField("Salário por hora (Jikyu)", hourlyBase, setHourlyBase, 10)}
          {numField("Horas padrão / dia", standardHours, setStandardHours, 0.25)}
          {numField("Idade", age, setAge)}
          {numField("Adicional (teate) por hora", teatePerHour, setTeatePerHour, 10)}
        </div>
        {age >= 40 && age <= 64 && (
          <p className="nv-body mt-2 text-[10.5px] text-slate-400">Kaigo Hoken de 0,91% incluso automaticamente (idade entre 40~64 anos).</p>
        )}
      </div>

      {/* Entradas do mês */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="nv-display mb-3 text-[13px] font-bold text-slate-900">📅 Entradas do Mês</h4>
        <div className="grid grid-cols-2 gap-3">
          {numField("Dias diurnos (Hiru)", hiruDays, setHiruDays)}
          {numField("Dias noturnos (Yakin)", yakinDays, setYakinDays)}
          {numField("Zangyo normal (125%)", overtimeNormal, setOvertimeNormal)}
          {numField("Zangyo noturno (150%)", overtimeNight, setOvertimeNight)}
        </div>
        <label className="mt-3 flex items-center gap-2 text-[12px] font-medium text-slate-700">
          <input
            type="checkbox"
            checked={applyShakai}
            onChange={(e) => setApplyShakai(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
          />
          Descontar Shakai Hoken neste mês (14,15%)
        </label>
      </div>

      {/* Avançado — turno noturno, transporte (só quem quiser ajustar) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="nv-display mb-3 text-[13px] font-bold text-slate-900">🔧 Avançado (opcional)</h4>
        <label className="mb-3 flex items-center gap-2 text-[12px] font-medium text-slate-700">
          <input
            type="checkbox"
            checked={nikoutai}
            onChange={(e) => setNikoutai(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
          />
          Trabalha em regime de turnos (nikoutai/yakin)
        </label>
        {nikoutai && (
          <div className="mb-3 grid grid-cols-2 gap-3">
            {timeField("Início do turno noturno", yakinStart, setYakinStart)}
            {timeField("Fim do turno noturno", yakinEnd, setYakinEnd)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {numField("Deslocamento (km/dia)", kmPerDay, setKmPerDay)}
          {numField("Ajuda de custo (¥/km)", yenPerKm, setYenPerKm)}
        </div>
      </div>

      {/* Proventos / Descontos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
          <h5 className="nv-body mb-2 text-[11px] font-bold text-emerald-700">💰 Proventos</h5>
          <div className="space-y-1 text-[11px] text-slate-500">
            <div className="flex justify-between gap-2"><span>Base</span><span className="font-semibold text-slate-700">{yenLabel(payslip.base)}</span></div>
            <div className="flex justify-between gap-2"><span>Adic. noturno</span><span className="font-semibold text-slate-700">{yenLabel(payslip.nightBonus)}</span></div>
            <div className="flex justify-between gap-2"><span>Zangyo</span><span className="font-semibold text-slate-700">{yenLabel(payslip.otNormal)}</span></div>
            <div className="flex justify-between gap-2"><span>Zangyo noturno</span><span className="font-semibold text-slate-700">{yenLabel(payslip.otNight)}</span></div>
            <div className="flex justify-between gap-2"><span>Transporte</span><span className="font-semibold text-slate-700">{yenLabel(payslip.transport)}</span></div>
          </div>
          <div className="mt-2 flex justify-between gap-2 border-t border-emerald-100 pt-2 text-[11px] font-bold text-emerald-700">
            <span>Total bruto</span><span>{yenLabel(payslip.gross)}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5">
          <h5 className="nv-body mb-2 text-[11px] font-bold text-rose-700">📉 Descontos</h5>
          <div className="space-y-1 text-[11px] text-slate-500">
            <div className="flex justify-between gap-2"><span>Seg. desemprego</span><span className="font-semibold text-slate-700">{yenLabel(payslip.unemployment)}</span></div>
            <div className="flex justify-between gap-2"><span>Imposto de renda</span><span className="font-semibold text-slate-700">{yenLabel(payslip.incomeTax)}</span></div>
            {payslip.kaigo > 0 && (
              <div className="flex justify-between gap-2"><span>Kaigo Hoken</span><span className="font-semibold text-slate-700">{yenLabel(payslip.kaigo)}</span></div>
            )}
            {payslip.shakai > 0 && (
              <div className="flex justify-between gap-2"><span>Shakai Hoken</span><span className="font-semibold text-slate-700">{yenLabel(payslip.shakai)}</span></div>
            )}
          </div>
          <div className="mt-2 flex justify-between gap-2 border-t border-rose-100 pt-2 text-[11px] font-bold text-rose-700">
            <span>Total descontos</span><span>{yenLabel(payslip.deductions)}</span>
          </div>
        </div>
      </div>

      {/* Saldo líquido — repetido AQUI (não só lá em cima) porque é
          logo depois de ver Bruto/Descontos que a pessoa quer saber se
          a conta fecha certo. */}
      <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-center text-white shadow-sm">
        <p className="nv-body flex items-center justify-center gap-1.5 text-[11px] font-medium opacity-90">
          {yenLabel(payslip.gross)} <span className="opacity-70">−</span> {yenLabel(payslip.deductions)} <span className="opacity-70">=</span>
        </p>
        <p className="nv-display mt-1 text-[28px] font-extrabold leading-none">{yenLabel(payslip.net)}</p>
        <p className="nv-body mt-1 text-[10px] font-bold uppercase tracking-wide opacity-90">💰 Saldo Líquido (Tedori)</p>
      </div>

      <p className="nv-body text-center text-[10px] leading-relaxed text-slate-400">
        Valores aproximados, só pra referência — descontos reais variam conforme prefeitura e situação de cada trabalhador.
      </p>
    </div>
  );
}

// Casca fina do modal/gaveta — só cuida do overlay, header e fechar;
// todo o formulário e o cálculo vivem no SalaryCalculatorContent acima,
// reaproveitado também direto (sem modal) na aba fixa "Calculadora".
export default function SalaryCalculatorModal({ isOpen, onClose, initialJikyu }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="nv-rise flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:max-w-md sm:rounded-3xl"
      >
        {/* Header fixo */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calculator className="h-4 w-4" />
            </div>
            <h3 className="nv-display text-[15px] font-bold text-slate-900">Simular Salário Líquido</h3>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo (rola se precisar) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <SalaryCalculatorContent initialJikyu={initialJikyu} watchInitialJikyu />
        </div>
      </div>
    </div>
  );
}
