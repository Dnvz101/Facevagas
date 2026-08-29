// ---------------------------------------------------------------
// FilterBar — filtro de Sexo/Província/Nihongo/Favoritas da página
// de Vagas.
// ---------------------------------------------------------------

import { useMemo } from "react";
import { Heart } from "lucide-react";
import { NIHONGO_LEVELS } from "../config/constants.js";

export default function FilterBar({ jobs, filters, setFilters }) {
  const provinciaOptions = useMemo(
    () => [...new Set(jobs.map((j) => j.provincia).filter(Boolean))].sort(),
    [jobs]
  );

  const update = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const selectClass =
    "nv-body w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400";

  const hasActiveFilters = filters.sexo !== "todos" || filters.provincia !== "todas" || filters.nihongo !== "todos" || filters.favoritas;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Sexo</label>
          <select value={filters.sexo} onChange={(e) => update("sexo", e.target.value)} className={selectClass}>
            <option value="todos">Todos</option>
            <option value="homens">Homens</option>
            <option value="mulheres">Mulheres</option>
          </select>
        </div>

        <div>
          <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Província</label>
          <select value={filters.provincia} onChange={(e) => update("provincia", e.target.value)} className={selectClass}>
            <option value="todas">Todas</option>
            {provinciaOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Nihongo</label>
          <select value={filters.nihongo} onChange={(e) => update("nihongo", e.target.value)} className={selectClass}>
            <option value="todos">Todos</option>
            {NIHONGO_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Favoritas</label>
          <button
            onClick={() => update("favoritas", !filters.favoritas)}
            className={`flex w-full items-center justify-center rounded-lg border py-2 ${
              filters.favoritas
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-slate-200 text-slate-300 hover:bg-slate-50"
            }`}
          >
            <Heart className="h-4 w-4" fill={filters.favoritas ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => setFilters({ sexo: "todos", provincia: "todas", nihongo: "todos", favoritas: false })}
          className="nv-body mt-2 text-[11px] font-medium text-blue-600"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
