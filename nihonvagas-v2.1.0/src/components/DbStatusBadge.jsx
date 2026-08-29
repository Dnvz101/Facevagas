// ---------------------------------------------------------------
// DbStatusBadge — indicador de conexão com o Supabase. Simplificado:
// não existe mais alternância claude/supabase, é sempre Supabase.
// ---------------------------------------------------------------

export default function DbStatusBadge({ status, error }) {
  const config = {
    unconfigured: { label: "Supabase não configurado — usando dados de exemplo", cls: "bg-slate-100 text-slate-500" },
    connecting: { label: "Conectando (Supabase)...", cls: "bg-blue-50 text-blue-600" },
    connected: { label: "Salvando em: Supabase", cls: "bg-emerald-50 text-emerald-700" },
    error: { label: "Falha na conexão (Supabase)", cls: "bg-rose-50 text-rose-600" },
  }[status];

  return (
    <div className="group relative">
      <span className={`nv-body flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${config.cls}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${status === "connected" ? "bg-emerald-500" : status === "error" ? "bg-rose-500" : "bg-slate-400"}`} />
        {config.label}
      </span>
      {error && status === "error" && (
        <p className="nv-body absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-rose-200 bg-white p-2 text-[11px] text-rose-600 shadow-lg">{error}</p>
      )}
    </div>
  );
}
