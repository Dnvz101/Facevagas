// ---------------------------------------------------------------
// ProfileEditor — editor de um perfil salarial do Kakeibo (usado
// dentro de PerfisTab, um por membro da família/perfil cadastrado).
// ---------------------------------------------------------------

import { useMemo } from "react";
import { computeProfilePayslip, yenLabel, ZANGYO_MODES, calculateNightHours, calculateShiftNetHours } from "../../utils/kakeibo.js";
import { formatYen } from "../../utils/format.js";
import { fieldSuffix, timeFieldKakeibo, breaksEditor } from "./fields.jsx";

export default function ProfileEditor({ profile, onChange }) {
  const payslip = useMemo(() => computeProfilePayslip(profile), [profile]);
  const set = (key) => (val) => onChange({ ...profile, [key]: val });

  return (
    <div className="space-y-4">
      {/* Resumo — fixo na tela ao rolar (igual o cabeçalho do site),
          compacto, com bruto−descontos=líquido junto (informação que
          antes só aparecia lá embaixo, no card verde de fechamento).
          "top-[142px]" é a altura estimada do cabeçalho do site (logo +
          abas) — se não bater 100% certinho na borda, é só ajustar esse
          número depois de ver ao vivo. */}
      <div className="sticky top-[142px] z-10 flex items-center justify-between gap-2 rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2.5 text-white shadow-md">
        <p className="nv-body min-w-0 flex-shrink-0 truncate text-[10px] font-bold uppercase tracking-wide opacity-90">
          {profile.name}
        </p>
        <p className="nv-body flex flex-wrap items-baseline justify-end gap-x-1.5 gap-y-0 text-right">
          <span className="whitespace-nowrap text-[10.5px] font-medium opacity-85">
            {yenLabel(payslip.gross)} − {yenLabel(payslip.deductions)} =
          </span>
          <span className="nv-display whitespace-nowrap text-[18px] font-extrabold leading-none">{yenLabel(payslip.net)}</span>
        </p>
      </div>

      {/* Dados contratuais */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="nv-display mb-3 text-[13px] font-bold text-slate-900">⚙️ Dados Contratuais</h4>
        <div className="grid grid-cols-2 gap-3">
          {fieldSuffix("Salário base (Jikyu)", profile.hourlyBase, set("hourlyBase"), "¥", 10)}
          {fieldSuffix("Idade", profile.age, set("age"), "anos")}
          {fieldSuffix("Horas padrão/dia (Hiru)", profile.standardHoursHiru ?? profile.standardHours, set("standardHoursHiru"), "h", 0.25)}
          {fieldSuffix("Horas padrão/dia (Yakin)", profile.standardHoursYakin ?? profile.standardHours, set("standardHoursYakin"), "h", 0.25)}
          {fieldSuffix("Adicional (Teate)/hora", profile.teatePerHour, set("teatePerHour"), "¥", 10)}
        </div>

        {/* "Turno de 8h" — quando a empresa paga o turno cheio sem
            descontar pausa (nem do salário nem do adicional noturno),
            não faz diferença nenhuma digitar os horários de pausa — daí
            esse Sim/Não decide se o editor de pausas aparece lá embaixo
            (seção Turnos Nikoutai) ou fica escondido. */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Turno Hiru de 8h (empresa paga cheio)?</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => set("hirukinTurno8h")(true)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-[11.5px] font-semibold ${
                  profile.hirukinTurno8h ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"
                }`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => set("hirukinTurno8h")(false)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-[11.5px] font-semibold ${
                  !profile.hirukinTurno8h ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"
                }`}
              >
                Não
              </button>
            </div>
          </div>
          <div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Turno Yakin de 8h (empresa paga cheio)?</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => set("yakinTurno8h")(true)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-[11.5px] font-semibold ${
                  profile.yakinTurno8h ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"
                }`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => set("yakinTurno8h")(false)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-[11.5px] font-semibold ${
                  !profile.yakinTurno8h ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"
                }`}
              >
                Não
              </button>
            </div>
          </div>
        </div>

        {/* Editor de pausas abre bem aqui, logo abaixo do Sim/Não —
            antes ficava lá embaixo, na seção "Turnos Nikoutai", longe
            de onde a decisão é tomada. */}
        {!profile.hirukinTurno8h && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="nv-body mb-1.5 text-[10px] text-slate-400">Pausas do Hirukin (deixe em branco a que não usar):</p>
            {breaksEditor(profile.hirukinBreaks, set("hirukinBreaks"))}
          </div>
        )}
        {!profile.yakinTurno8h && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="nv-body mb-1.5 text-[10px] text-slate-400">Pausas do Yakin (deixe em branco a que não usar):</p>
            {breaksEditor(profile.yakinBreaks, set("yakinBreaks"))}
          </div>
        )}

        {/* Referência (não trava nada) — compara o número digitado com
            span do turno menos as pausas, só pra ajudar a pegar erro de
            digitação. Não aparece pro turno marcado como "8h cheio" —
            nesse caso a pausa não importa, comparar não faz sentido. */}
        {profile.nikoutai && (!profile.hirukinTurno8h || !profile.yakinTurno8h) && (
          <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2.5 text-[10.5px]">
            {(() => {
              const hiruCalc = calculateShiftNetHours(profile.hirukinStart, profile.hirukinEnd, profile.hirukinBreaks);
              const hiruDigitado = Number(profile.standardHoursHiru ?? profile.standardHours) || 0;
              const hiruDivergente = Math.abs(hiruCalc - hiruDigitado) > 0.1;
              const yakinCalc = calculateShiftNetHours(profile.yakinStart, profile.yakinEnd, profile.yakinBreaks);
              const yakinDigitado = Number(profile.standardHoursYakin ?? profile.standardHours) || 0;
              const yakinDivergente = Math.abs(yakinCalc - yakinDigitado) > 0.1;
              return (
                <>
                  {!profile.hirukinTurno8h && (
                    <p className={hiruDivergente ? "font-medium text-amber-600" : "text-slate-400"}>
                      {hiruDivergente ? "⚠️ " : ""}Hiru: entrada−saída menos pausas dá {hiruCalc.toFixed(2)}h (você digitou {hiruDigitado.toFixed(2)}h)
                      {hiruDivergente ? " — confira se é erro de digitação ou se a empresa paga diferente do líquido mesmo" : ""}.
                    </p>
                  )}
                  {!profile.yakinTurno8h && (
                    <p className={yakinDivergente ? "font-medium text-amber-600" : "text-slate-400"}>
                      {yakinDivergente ? "⚠️ " : ""}Yakin: entrada−saída menos pausas dá {yakinCalc.toFixed(2)}h (você digitou {yakinDigitado.toFixed(2)}h)
                      {yakinDivergente ? " — confira se é erro de digitação ou se a empresa paga diferente do líquido mesmo" : ""}.
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Bônus condicional (assiduidade/pontualidade) — pergunta primeiro
          COMO funciona o seu, só então mostra o campo certo. Cobre os
          dois casos reais: quem ganha por hora trabalhada (ex: ¥100/h) e
          quem ganha um valor fixo se cumprir os requisitos do mês. Nada
          de IA interpretando regra em texto livre — você já sabe o
          fato (cumpriu ou não), o cálculo é sempre determinístico. */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="nv-display mb-1 text-[13px] font-bold text-slate-900">🎯 Bônus Condicional (assiduidade, pontualidade...)</h4>
        <p className="nv-body mb-3 text-[11px] text-slate-500">
          Some se faltar, sair antes do fim do expediente ou passar do limite de yukyu do mês. Como funciona o seu?
        </p>
        <div className="space-y-2">
          {[
            { key: "nenhum", label: "Não tenho esse tipo de bônus" },
            { key: "porHora", label: "Teate por hora trabalhada", desc: "Ex: ¥100 por cada hora do mês" },
            { key: "fixo", label: "Valor fixo mensal", desc: "Um valor único se cumprir os requisitos" },
          ].map((opt) => (
            <label
              key={opt.key}
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 transition-colors ${
                (profile.bonusCondicionalTipo || "nenhum") === opt.key ? "border-blue-300 bg-blue-50/60" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name={`bonuscond-${profile.id}`}
                checked={(profile.bonusCondicionalTipo || "nenhum") === opt.key}
                onChange={() => set("bonusCondicionalTipo")(opt.key)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 focus:ring-blue-400"
              />
              <div className="min-w-0">
                <p className="nv-body text-[12px] font-semibold text-slate-800">{opt.label}</p>
                {opt.desc && <p className="nv-body text-[10.5px] text-slate-400">{opt.desc}</p>}
              </div>
            </label>
          ))}
        </div>

        {/* Sub-painel: Teate por hora — usa o mesmo "Adicional (Teate)/hora"
            já preenchido em Dados Contratuais, só liga/desliga se cumpriu. */}
        {profile.bonusCondicionalTipo === "porHora" && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="nv-body mb-2 text-[11px] text-slate-500">
              Usa o campo "Adicional (Teate)/hora" de Dados Contratuais. Já calculado automaticamente pelas horas do
              mês (¥{formatYen(profile.teatePerHour)}/h × {payslip.totalHours.toFixed(2)}h = {yenLabel(payslip.totalHours * profile.teatePerHour)}).
            </p>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Cumpriu a condição esse mês?</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => set("teateRecebido")(true)}
                className={`flex-1 rounded-lg border px-2 py-2 text-[12px] font-semibold ${
                  profile.teateRecebido !== false ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400"
                }`}
              >
                Sim, recebi
              </button>
              <button
                type="button"
                onClick={() => set("teateRecebido")(false)}
                className={`flex-1 rounded-lg border px-2 py-2 text-[12px] font-semibold ${
                  profile.teateRecebido === false ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-400"
                }`}
              >
                Não, perdi
              </button>
            </div>
          </div>
        )}

        {/* Sub-painel: Valor fixo — campo próprio, não depende de horas. */}
        {profile.bonusCondicionalTipo === "fixo" && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="mb-3">
              {fieldSuffix("Valor quando recebido", profile.bonusCondicionalValorFixo, set("bonusCondicionalValorFixo"), "¥", 1000)}
            </div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Cumpriu a condição esse mês?</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => set("teateRecebido")(true)}
                className={`flex-1 rounded-lg border px-2 py-2 text-[12px] font-semibold ${
                  profile.teateRecebido !== false ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400"
                }`}
              >
                Sim, recebi
              </button>
              <button
                type="button"
                onClick={() => set("teateRecebido")(false)}
                className={`flex-1 rounded-lg border px-2 py-2 text-[12px] font-semibold ${
                  profile.teateRecebido === false ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-400"
                }`}
              >
                Não, perdi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Regra do Zangyo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="nv-display mb-1 text-[13px] font-bold text-slate-900">⏱️ Como sua empreiteira calcula as horas extras (Zangyo)?</h4>
        <p className="nv-body mb-3 text-[11px] text-slate-500">Isso muda o valor da hora extra — confira no seu contrato ou pergunte no RH.</p>
        <div className="space-y-2">
          {ZANGYO_MODES.map((opt) => (
            <label
              key={opt.key}
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 transition-colors ${
                profile.zangyoMode === opt.key ? "border-blue-300 bg-blue-50/60" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name={`zangyo-${profile.id}`}
                checked={profile.zangyoMode === opt.key}
                onChange={() => set("zangyoMode")(opt.key)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 focus:ring-blue-400"
              />
              <div className="min-w-0">
                <p className="nv-body text-[12px] font-semibold text-slate-800">{opt.label}</p>
                <p className="nv-body text-[10.5px] text-slate-400">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Turnos Nikoutai */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="nv-display mb-3 text-[13px] font-bold text-slate-900">🌙 Turnos Nikoutai</h4>
        <label className="mb-3 flex items-center gap-2 text-[12px] font-medium text-slate-700">
          <input
            type="checkbox"
            checked={profile.nikoutai}
            onChange={(e) => set("nikoutai")(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
          />
          Trabalha em regime de turnos (Hirukin/Yakin — inclui asaban/osoban)
        </label>
        {profile.nikoutai && (
          <>
            <p className="nv-body mb-1.5 text-[10.5px] font-semibold text-slate-500">☀️ Hirukin (turno diurno/asaban)</p>
            <div className="mb-4 grid grid-cols-2 gap-3">
              {timeFieldKakeibo("Início Hirukin", profile.hirukinStart, set("hirukinStart"))}
              {timeFieldKakeibo("Fim Hirukin", profile.hirukinEnd, set("hirukinEnd"))}
            </div>

            <p className="nv-body mb-1.5 text-[10.5px] font-semibold text-slate-500">🌙 Yakin (turno noturno/osoban)</p>
            <div className="grid grid-cols-2 gap-3">
              {timeFieldKakeibo("Início Yakin", profile.yakinStart, set("yakinStart"))}
              {timeFieldKakeibo("Fim Yakin", profile.yakinEnd, set("yakinEnd"))}
            </div>
            <p className="nv-body mt-2 text-[10px] leading-relaxed text-slate-400">
              Pausas de cada turno: lá em cima, em "⚙️ Dados Contratuais", logo abaixo do Sim/Não "Turno de 8h". Só a
              parte de cada pausa que cai DENTRO do 22h~5h é descontada do adicional noturno; o resto não muda nada.
            </p>

            <div className="mt-2.5 space-y-0.5 text-[10.5px] text-slate-400">
              <p>Hirukin: {calculateNightHours(profile.hirukinStart, profile.hirukinEnd, profile.hirukinTurno8h ? [] : profile.hirukinBreaks).toFixed(2)}h por turno caem no adicional noturno (22h~5h), já descontadas as pausas.</p>
              <p>Yakin: {calculateNightHours(profile.yakinStart, profile.yakinEnd, profile.yakinTurno8h ? [] : profile.yakinBreaks).toFixed(2)}h por turno caem no adicional noturno (22h~5h), já descontadas as pausas.</p>
            </div>
            {calculateNightHours(profile.hirukinStart, profile.hirukinEnd, profile.hirukinTurno8h ? [] : profile.hirukinBreaks) > 0 && (
              <p className="nv-body mt-1.5 text-[10.5px] font-medium text-amber-600">
                ⚠️ Seu turno Hirukin também encosta na janela noturna — comum em sistemas asaban/osoban. Isso já está sendo somado corretamente.
              </p>
            )}
          </>
        )}
      </div>

      {/* Transporte */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="nv-display mb-3 text-[13px] font-bold text-slate-900">🚗 Transporte</h4>
        <div className="grid grid-cols-2 gap-3">
          {fieldSuffix("Deslocamento", profile.kmPerDay, set("kmPerDay"), "km/dia")}
          {fieldSuffix("Ajuda de custo", profile.yenPerKm, set("yenPerKm"), "¥/km")}
        </div>
      </div>

      {/* Alíquotas */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="nv-display mb-1 text-[13px] font-bold text-slate-900">📋 Alíquotas de Desconto</h4>
        <p className="nv-body mb-3 text-[11px] leading-relaxed text-slate-500">
          Essas taxas variam de pessoa pra pessoa (idade, província, faixa salarial) — os valores aqui são só um
          ponto de partida. Pra achar a sua de verdade: pegue seu holerite e calcule <span className="font-semibold text-slate-600">desconto ÷ salário bruto × 100</span>.
          Ex: desconto de ¥13.182 num bruto de ¥408.387 → 13182 ÷ 408387 × 100 ≈ <span className="font-semibold text-slate-600">3,2%</span>.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {fieldSuffix("Shakai Hoken", profile.aliquotaShakai, set("aliquotaShakai"), "%", 0.01)}
          {fieldSuffix("Seg. Desemprego", profile.aliquotaDesemprego, set("aliquotaDesemprego"), "%", 0.01)}
          {fieldSuffix("Imposto de Renda", profile.aliquotaImposto, set("aliquotaImposto"), "%", 0.01)}
          <div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Kaigo Hoken</label>
            <div className="flex h-[37px] items-center rounded-lg border border-slate-100 bg-slate-50 px-2.5 text-[12px] text-slate-500">
              {profile.age >= 40 && profile.age <= 64 ? "0,91% (automático)" : "Não se aplica"}
            </div>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[12px] font-medium text-slate-700">
          <input
            type="checkbox"
            checked={profile.applyShakai}
            onChange={(e) => set("applyShakai")(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
          />
          Descontar Shakai Hoken neste mês
        </label>
      </div>

      {/* Entradas do mês */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="nv-display mb-3 text-[13px] font-bold text-slate-900">📅 Entradas do Mês</h4>
        <div className="grid grid-cols-2 gap-3">
          {fieldSuffix("Dias diurnos (Hiru)", profile.hiruDays, set("hiruDays"), "dias")}
          {fieldSuffix("Dias noturnos (Yakin)", profile.yakinDays, set("yakinDays"), "dias")}
          {fieldSuffix("Zangyo normal", profile.overtimeNormal, set("overtimeNormal"), "h")}
          {fieldSuffix("Zangyo noturno", profile.overtimeNight, set("overtimeNight"), "h")}
        </div>
      </div>

      {/* Proventos / Descontos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
          <h5 className="nv-body mb-2 text-[11px] font-bold text-emerald-700">💰 Proventos</h5>
          <div className="space-y-1 text-[11px] text-slate-500">
            <div className="flex justify-between gap-2"><span>Base</span><span className="font-semibold text-slate-700">{yenLabel(payslip.base)}</span></div>
            {profile.teatePerHour > 0 && (
              <div className={`flex justify-between gap-2 ${profile.bonusCondicionalTipo === "porHora" && profile.teateRecebido === false ? "text-rose-500" : ""}`}>
                <span>Teate/hora{profile.bonusCondicionalTipo === "porHora" && profile.teateRecebido === false ? " (perdido)" : ""}</span>
                <span className="font-semibold">{yenLabel(payslip.teate)}</span>
              </div>
            )}
            {profile.bonusCondicionalTipo === "fixo" && profile.bonusCondicionalValorFixo > 0 && (
              <div className={`flex justify-between gap-2 ${profile.teateRecebido === false ? "text-rose-500" : ""}`}>
                <span>Bônus condicional{profile.teateRecebido === false ? " (perdido)" : ""}</span>
                <span className="font-semibold">{yenLabel(payslip.bonusCondicionalFixo)}</span>
              </div>
            )}
            {payslip.bonusFixo > 0 && (
              <div className="flex justify-between gap-2"><span>Bônus fixo</span><span className="font-semibold text-slate-700">{yenLabel(payslip.bonusFixo)}</span></div>
            )}
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
            <div className="flex justify-between gap-2"><span>Imposto</span><span className="font-semibold text-slate-700">{yenLabel(payslip.incomeTax)}</span></div>
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
    </div>
  );
}

// Aba "⚙️ Perfis" — gerencia a lista (adicionar/renomear/remover); a
// configuração detalhada de cada um vive na pílula própria dele.
