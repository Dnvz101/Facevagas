// ---------------------------------------------------------------
// RelatorioEmpresaAvulsa — Admin: gera o Relatório de Desempenho de
// uma empresa que NÃO é parceira cadastrada (ex.: uma empresa cujas
// vagas o scraper trouxe e que entrou em contato).
//
// O relatório só precisa do NOME da empresa pra achar as vagas
// (`job.empresa`) — cadastro nunca foi requisito técnico, só o botão
// morava no card de parceiro. Aqui a busca é pelo nome que aparece
// nas próprias vagas. O mesmo nome costuma vir escrito de jeitos
// diferentes conforme a fonte ("Fujiarte", "FUJIARTE Co. Ltd"), por
// isso dá pra juntar todas as variações num relatório só.
// ---------------------------------------------------------------

import { useMemo, useState } from "react";
import { Search, BarChart3, ChevronDown } from "lucide-react";

const norm = (s) =>
  (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function RelatorioEmpresaAvulsa({ jobs, registeredPartners, onGenerate }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  // Nome -> quantidade de vagas, só de empresa que NÃO é parceira
  // cadastrada (as cadastradas já têm o botão no próprio card).
  const nomes = useMemo(() => {
    const cadastrados = new Set(registeredPartners.map((p) => norm(p.name)));
    const map = new Map();
    for (const j of jobs) {
      const nome = (j.empresa || "").trim();
      if (!nome || cadastrados.has(norm(nome))) continue;
      map.set(nome, (map.get(nome) || 0) + 1);
    }
    return map;
  }, [jobs, registeredPartners]);

  const resultados = useMemo(() => {
    const t = norm(term);
    if (t.length < 2) return [];
    return [...nomes.entries()]
      .filter(([nome]) => norm(nome).includes(t))
      .sort((a, b) => b[1] - a[1]);
  }, [nomes, term]);

  const gerar = (matchNames) => {
    // Nome exibido = o mais curto entre os escolhidos (o menos
    // "sujo" — sem sufixo tipo "Co. Ltd", cidade, etc.).
    const name = [...matchNames].sort((a, b) => a.length - b.length)[0];
    onGenerate({ id: null, name, matchNames, phoneJp: "", phonePt: "", naoCadastrada: true });
  };

  const totalVagasResultados = resultados.reduce((s, [, n]) => s + n, 0);

  return (
    <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="nv-body flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[12px] font-bold text-blue-700"
      >
        <span className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> Relatório de empresa não cadastrada
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-2 border-t border-blue-100 px-3.5 pb-3 pt-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Nome da empresa (ex.: fujiarte)"
              className="nv-body w-full bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          {term.trim().length >= 2 && resultados.length === 0 && (
            <p className="nv-body text-[11px] text-slate-400">Nenhuma vaga de empresa não cadastrada com esse nome.</p>
          )}

          {resultados.length > 1 && (
            <button
              onClick={() => gerar(resultados.map(([nome]) => nome))}
              className="nv-body flex w-full items-center justify-between rounded-lg bg-blue-600 px-3 py-2 text-left text-[11.5px] font-bold text-white"
            >
              <span>Juntar todas as {resultados.length} variações</span>
              <span className="font-semibold text-blue-100">{totalVagasResultados} vagas</span>
            </button>
          )}

          {resultados.slice(0, 8).map(([nome, n]) => (
            <button
              key={nome}
              onClick={() => gerar([nome])}
              className="nv-body flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[11.5px] font-semibold text-slate-700 hover:border-blue-300"
            >
              <span className="truncate">{nome}</span>
              <span className="flex-shrink-0 text-[10.5px] font-medium text-slate-400">{n} vaga{n === 1 ? "" : "s"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
