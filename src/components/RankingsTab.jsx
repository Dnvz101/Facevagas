// ---------------------------------------------------------------
// Rankings — Top 5 por categoria (acordeão, não flip 3D — decisão
// tomada depois de um bug de hit-testing nos itens 4/5 num card 3D)
// + Média salarial por estado.
// ---------------------------------------------------------------

import { useState, useMemo } from "react";
import { ChevronRight, Trophy, TrendingUp, Car, Home, Users } from "lucide-react";
import { formatYen } from "../utils/format.js";
import { safeCidade, salaryUnitLabel, simplifyNihongo, isSingleKnownProvince } from "../utils/jobParsing.js";
import { hasMukae, hasMoradia } from "../utils/misc.js";

export function FlipStatCard({ icon: Icon, title, subtitle, accent, items, isFlipped, onToggleFlip, onItemClick }) {
  // Sem transformação 3D de propósito. Depois de duas rodadas tentando
  // consertar hit-testing dentro de um card virado em 3D (perspective +
  // backfaceVisibility + altura medida por JS), a causa exata do bug dos
  // itens 4/5 continuou instável em algum navegador/contexto. Um
  // "acordeão" simples — só mostra/esconde o bloco de baixo — fica 100%
  // dentro do fluxo normal do documento: cada botão é um <button> comum,
  // sem nenhum truque de renderização por perto que possa roubar clique.
  return (
    <div className="nv-rise">
      <button
        onClick={onToggleFlip}
        className={`w-full rounded-2xl border ${accent.border} ${accent.bg} p-3 text-left`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent.gradient} text-white shadow-sm`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="nv-display truncate text-[13px] font-bold leading-tight text-slate-900">{title}</p>
            <p className="nv-body truncate text-[10px] leading-tight text-slate-500">{subtitle}</p>
          </div>
          <ChevronRight className={`h-4 w-4 flex-shrink-0 text-slate-300 transition-transform ${isFlipped ? "rotate-90" : ""}`} />
        </div>
      </button>

      {isFlipped && (
        <div className="nv-rise mt-1.5 rounded-2xl border border-slate-200 bg-white p-3">
          {items.length === 0 ? (
            <p className="nv-body py-3 text-center text-[11px] text-slate-400">Nenhuma vaga encontrada nesse filtro.</p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick?.(item.id)}
                  className="flex w-full items-center gap-2 px-2 py-2 text-left hover:bg-slate-50 active:bg-slate-100"
                >
                  <span
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      idx === 0 ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="nv-body truncate text-[11.5px] font-semibold text-slate-800">{item.cargo}</p>
                    <p className="nv-body truncate text-[10px] text-slate-400">{item.meta}</p>
                  </div>
                  <p className="nv-display flex-shrink-0 text-[12px] font-extrabold text-emerald-600">{item.salario}</p>
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={onToggleFlip}
            className="mt-2 flex w-full items-center justify-center gap-1.5 text-center text-[10px] font-medium text-slate-400"
          >
            👆 Toque para fechar
          </button>
        </div>
      )}
    </div>
  );
}

export default function RankingsTab({ jobs, onGoToJob }) {
  const [provinciaFiltro, setProvinciaFiltro] = useState("todas");
  const [flipped, setFlipped] = useState({ nihongo: false, salario: false, mukae: false, moradia: false, homens: false, mulheres: false });

  const provinciaOptions = useMemo(
    () => [...new Set(jobs.map((j) => j.provincia).filter(Boolean))].sort(),
    [jobs]
  );

  const jobsFiltrados = useMemo(
    () => (provinciaFiltro === "todas" ? jobs : jobs.filter((j) => j.provincia === provinciaFiltro)),
    [jobs, provinciaFiltro]
  );

  const salarioTopo = (j) => j.salarioMax || j.salarioHora;
  const localLabel = (j) => [safeCidade(j.cidade), j.provincia].filter(Boolean).join(" · ");
  const salarioLabel = (j) => `¥${formatYen(salarioTopo(j))}/${salaryUnitLabel(salarioTopo(j))}`;
  const metaLabel = (j) => [j.empresa, localLabel(j)].filter(Boolean).join(" · ");

  // Rankings de salário só fazem sentido comparando valores do MESMO
  // tipo (hora ou diária) — um salário mensal (ex: ¥450.000, comum em
  // vaga de escritório) bagunçava tudo, aparecendo como "o maior
  // salário" ou disparando a média de um estado pra cima sem ter
  // relação nenhuma com o que as outras vagas pagam por hora/dia.
  const isComparableSalary = (j) => salaryUnitLabel(salarioTopo(j)) !== "mês";

  const topZeroNihongo = useMemo(() => {
    return [...jobsFiltrados]
      .filter((j) => simplifyNihongo(j.nihongo) === "Básico" && isComparableSalary(j))
      .sort((a, b) => salarioTopo(b) - salarioTopo(a))
      .slice(0, 5)
      .map((j) => ({ id: j.id, cargo: j.cargo, salario: salarioLabel(j), meta: metaLabel(j) }));
  }, [jobsFiltrados]);

  const topSalarios = useMemo(() => {
    return [...jobsFiltrados]
      .filter(isComparableSalary)
      .sort((a, b) => salarioTopo(b) - salarioTopo(a))
      .slice(0, 5)
      .map((j) => ({ id: j.id, cargo: j.cargo, salario: salarioLabel(j), meta: metaLabel(j) }));
  }, [jobsFiltrados]);

  const topMukae = useMemo(() => {
    return [...jobsFiltrados]
      .filter((j) => hasMukae(j) && isComparableSalary(j))
      .sort((a, b) => salarioTopo(b) - salarioTopo(a))
      .slice(0, 5)
      .map((j) => ({ id: j.id, cargo: j.cargo, salario: salarioLabel(j), meta: metaLabel(j) }));
  }, [jobsFiltrados]);

  const topMoradia = useMemo(() => {
    return [...jobsFiltrados]
      .filter((j) => hasMoradia(j) && isComparableSalary(j))
      .sort((a, b) => salarioTopo(b) - salarioTopo(a))
      .slice(0, 5)
      .map((j) => ({ id: j.id, cargo: j.cargo, salario: salarioLabel(j), meta: metaLabel(j) }));
  }, [jobsFiltrados]);

  const topHomens = useMemo(() => {
    return [...jobsFiltrados]
      .filter((j) => j.vagaHomens && isComparableSalary(j))
      .sort((a, b) => salarioTopo(b) - salarioTopo(a))
      .slice(0, 5)
      .map((j) => ({ id: j.id, cargo: j.cargo, salario: salarioLabel(j), meta: metaLabel(j) }));
  }, [jobsFiltrados]);

  const topMulheres = useMemo(() => {
    return [...jobsFiltrados]
      .filter((j) => j.vagaMulheres && isComparableSalary(j))
      .sort((a, b) => salarioTopo(b) - salarioTopo(a))
      .slice(0, 5)
      .map((j) => ({ id: j.id, cargo: j.cargo, salario: salarioLabel(j), meta: metaLabel(j) }));
  }, [jobsFiltrados]);

  // Média salarial por estado — sempre calculada sobre TODAS as vagas
  // (não respeita o filtro de província acima, já que o próprio objetivo
  // aqui é comparar os estados entre si). Ordenado do maior pro menor.
  // Ignora vaga com salário mensal (motivo já explicado acima) E vaga
  // com província "múltipla"/texto livre (ex: "Aichi e Mie", "diversas
  // cidades") — só entra na conta quem tem um nome de estado único e
  // reconhecido, senão a média de um estado ficaria contaminada com
  // dado de outro.
  const mediaPorProvincia = useMemo(() => {
    const soma = {};
    jobs.forEach((j) => {
      if (!j.provincia || !isSingleKnownProvince(j.provincia)) return;
      if (!isComparableSalary(j)) return;
      const v = salarioTopo(j);
      if (!v) return;
      if (!soma[j.provincia]) soma[j.provincia] = { total: 0, count: 0 };
      soma[j.provincia].total += v;
      soma[j.provincia].count += 1;
    });
    return Object.entries(soma)
      .map(([provincia, s]) => ({ provincia, media: s.total / s.count, count: s.count }))
      .sort((a, b) => b.media - a.media);
  }, [jobs]);
  const maiorMedia = mediaPorProvincia[0]?.media || 1;

  return (
    <div className="space-y-3">
      {mediaPorProvincia.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="nv-display mb-2 text-[13px] font-bold text-slate-900">💴 Média salarial por estado</p>
          <div className="space-y-1.5">
            {mediaPorProvincia.map((p) => (
              <div key={p.provincia} className="flex items-center gap-2">
                <span className="nv-body w-[70px] flex-shrink-0 truncate text-[11px] font-medium text-slate-600">{p.provincia}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    style={{ width: `${Math.max(6, (p.media / maiorMedia) * 100)}%` }}
                  />
                </div>
                <span className="nv-display w-[64px] flex-shrink-0 text-right text-[11px] font-bold text-slate-800">
                  ¥{formatYen(Math.round(p.media))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Filtrar por província</label>
        <select
          value={provinciaFiltro}
          onChange={(e) => setProvinciaFiltro(e.target.value)}
          className="nv-body w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400"
        >
          <option value="todas">Todas as províncias</option>
          {provinciaOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <FlipStatCard
        icon={Trophy}
        title="Top 5 · Zero Nihongo"
        subtitle="Melhores salários sem exigir japonês"
        accent={{ border: "border-emerald-200", bg: "bg-emerald-50/60", gradient: "from-emerald-500 to-teal-600", text: "text-emerald-700" }}
        items={topZeroNihongo}
        isFlipped={flipped.nihongo}
        onToggleFlip={() => setFlipped((f) => ({ ...f, nihongo: !f.nihongo }))}
        onItemClick={onGoToJob}
      />

      <FlipStatCard
        icon={TrendingUp}
        title="Top 5 · Maiores Salários"
        subtitle="As vagas mais bem pagas agora"
        accent={{ border: "border-indigo-200", bg: "bg-indigo-50/60", gradient: "from-blue-600 to-indigo-600", text: "text-indigo-700" }}
        items={topSalarios}
        isFlipped={flipped.salario}
        onToggleFlip={() => setFlipped((f) => ({ ...f, salario: !f.salario }))}
        onItemClick={onGoToJob}
      />

      <FlipStatCard
        icon={Car}
        title="Top 5 · Com Mukae"
        subtitle="Vagas com transporte/busca da empresa"
        accent={{ border: "border-amber-200", bg: "bg-amber-50/60", gradient: "from-amber-500 to-orange-600", text: "text-amber-700" }}
        items={topMukae}
        isFlipped={flipped.mukae}
        onToggleFlip={() => setFlipped((f) => ({ ...f, mukae: !f.mukae }))}
        onItemClick={onGoToJob}
      />

      <FlipStatCard
        icon={Home}
        title="Top 5 · Com Moradia"
        subtitle="Vagas com apartamento/dormitório oferecido"
        accent={{ border: "border-sky-200", bg: "bg-sky-50/60", gradient: "from-sky-500 to-blue-600", text: "text-sky-700" }}
        items={topMoradia}
        isFlipped={flipped.moradia}
        onToggleFlip={() => setFlipped((f) => ({ ...f, moradia: !f.moradia }))}
        onItemClick={onGoToJob}
      />

      <FlipStatCard
        icon={Users}
        title="Top 5 · Vagas para Homens"
        subtitle="Melhores salários entre as vagas abertas a homens"
        accent={{ border: "border-blue-200", bg: "bg-blue-50/60", gradient: "from-blue-500 to-cyan-600", text: "text-blue-700" }}
        items={topHomens}
        isFlipped={flipped.homens}
        onToggleFlip={() => setFlipped((f) => ({ ...f, homens: !f.homens }))}
        onItemClick={onGoToJob}
      />

      <FlipStatCard
        icon={Users}
        title="Top 5 · Vagas para Mulheres"
        subtitle="Melhores salários entre as vagas abertas a mulheres"
        accent={{ border: "border-pink-200", bg: "bg-pink-50/60", gradient: "from-pink-500 to-rose-600", text: "text-pink-700" }}
        items={topMulheres}
        isFlipped={flipped.mulheres}
        onToggleFlip={() => setFlipped((f) => ({ ...f, mulheres: !f.mulheres }))}
        onItemClick={onGoToJob}
      />
    </div>
  );
}
