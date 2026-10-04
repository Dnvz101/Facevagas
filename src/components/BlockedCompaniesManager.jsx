// ---------------------------------------------------------------
// BlockedCompaniesManager — Admin: lista de empresas cujas vagas NUNCA
// entram na importação de JSON (ver JSONImporter + matchBlockedCompany).
// Casa por PEDAÇO do nome, sem acento/maiúscula: bloquear "fujiarte"
// pega "Fujiarte Co. Ltd" e "FUJIARTE". Remover da lista é um clique —
// a vaga volta a poder entrar na próxima importação (o histórico que já
// está no banco não é mexido por isso).
// ---------------------------------------------------------------

import { useState } from "react";
import { Ban, X } from "lucide-react";
import { normalizeText } from "../utils/misc.js";

export default function BlockedCompaniesManager({ blocked = [], onChange }) {
  const [term, setTerm] = useState("");
  const [msg, setMsg] = useState(null);

  const add = () => {
    const t = term.trim();
    if (normalizeText(t).length < 3) {
      setMsg("Digite pelo menos 3 letras — um termo curto demais bloquearia empresa errada.");
      return;
    }
    if (blocked.some((b) => normalizeText(b) === normalizeText(t))) {
      setMsg("Essa empresa já está na lista.");
      return;
    }
    onChange([...blocked, t]);
    setTerm("");
    setMsg(null);
  };

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
      <p className="nv-display flex items-center gap-1.5 text-[13px] font-bold text-rose-800">
        <Ban className="h-3.5 w-3.5" /> Empresas bloqueadas na importação
      </p>
      <p className="nv-body mt-1 text-[11.5px] leading-relaxed text-rose-700/80">
        Vagas dessas empresas não aparecem na lista de revisão do JSON (nem desarquivam o que já foi arquivado). Funciona por pedaço do nome: &quot;fujiarte&quot; pega &quot;Fujiarte Co. Ltd&quot;.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={term}
          onChange={(e) => { setTerm(e.target.value); setMsg(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Nome da empresa (ex.: fujiarte)"
          className="nv-body min-w-0 flex-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-rose-400"
        />
        <button onClick={add} className="nv-body flex-shrink-0 rounded-lg bg-rose-600 px-3.5 py-2 text-[12px] font-bold text-white">
          Bloquear
        </button>
      </div>
      {msg && <p className="nv-body mt-1.5 text-[11px] font-medium text-rose-600">{msg}</p>}

      {blocked.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {blocked.map((b) => (
            <span key={b} className="nv-body flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 shadow-sm">
              🚫 {b}
              <button onClick={() => onChange(blocked.filter((x) => x !== b))} title="Remover do bloqueio" className="text-rose-400 hover:text-rose-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="nv-body mt-3 text-[11px] text-rose-400">Nenhuma empresa bloqueada ainda.</p>
      )}
    </div>
  );
}
