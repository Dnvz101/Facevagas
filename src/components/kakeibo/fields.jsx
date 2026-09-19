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

// Editor de até 3 pausas de um turno (início/fim de cada uma) — o
// mesmo formato que já vem escrito em contrato/quadro de horários da
// empresa (ex: pausa curta, almoço/janta, alongamento), em vez de
// pedir um número de minutos já calculado na mão. "breaks" é sempre um
// array de 3 posições ({start,end} cada); pausa deixada em branco é
// ignorada no cálculo. "labels" é opcional, some nomes tipo "Pausa
// curta"/"Almoço"/"Alongamento" em vez de "Pausa 1/2/3" genérico.
export function breaksEditor(breaks, onChange, labels = ["Pausa 1", "Pausa 2", "Pausa 3"]) {
  const list = breaks && breaks.length === 3 ? breaks : [{ start: "", end: "" }, { start: "", end: "" }, { start: "", end: "" }];
  const setBreak = (i, field) => (val) => {
    const next = list.map((b, idx) => (idx === i ? { ...b, [field]: val } : b));
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {list.map((b, i) => (
        <div key={i} className="grid grid-cols-2 gap-3">
          {timeFieldKakeibo(`${labels[i]} — início`, b.start, setBreak(i, "start"))}
          {timeFieldKakeibo(`${labels[i]} — fim`, b.end, setBreak(i, "end"))}
        </div>
      ))}
    </div>
  );
}
