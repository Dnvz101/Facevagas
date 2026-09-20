// ---------------------------------------------------------------
// Campo numérico com sufixo embutido (ex: "h", "¥", "km/dia", "%") e
// campo de horário — reaproveitados em ProfileEditor e KakeiboApp
// (OrcamentoTab). Ficam num arquivo só de propósito, pra nunca mais
// duplicar essa lógica em dois lugares por engano.
// ---------------------------------------------------------------

export function fieldSuffix(label, value, onChange, suffix, step = 1) {
  return (
    <div>
      <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">{label}</label>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          placeholder="0"
          className="nv-body w-full rounded-lg border border-slate-200 px-2.5 py-2 pr-12 text-[13px] text-slate-800 outline-none focus:border-blue-400"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10.5px] font-medium text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function timeFieldKakeibo(label, value, onChange) {
  return (
    <div>
      <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="nv-body w-full rounded-lg border border-slate-200 px-2.5 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
      />
    </div>
  );
}
