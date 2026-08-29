// ---------------------------------------------------------------
// KakeiboApp — orquestrador da Calculadora completa: Perfis (multi-
// pessoa), Orçamento (renda vs. despesas), Compras (lista simples).
// ---------------------------------------------------------------

import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Loader2, X } from "lucide-react";
import ProfileEditor from "./ProfileEditor.jsx";
import { SalaryCalculatorContent } from "./SalaryCalculator.jsx";
import { makeDefaultProfile, makeDefaultExpenses, computeProfilePayslip, yenLabel } from "../../utils/kakeibo.js";
import { uid } from "../../utils/jobParsing.js";

export function PerfisTab({ profiles, setProfiles, onGoToProfile }) {
  const updateName = (id, name) => setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  const removeProfile = (id) => setProfiles((prev) => prev.filter((p) => p.id !== id));
  const addProfile = () => {
    const newProfile = makeDefaultProfile(`Perfil ${profiles.length + 1}`);
    setProfiles((prev) => [...prev, newProfile]);
    onGoToProfile(newProfile.id);
  };

  return (
    <div className="space-y-3">
      {profiles.map((p) => {
        const payslip = computeProfilePayslip(p);
        return (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-[16px]">👤</div>
              <div className="min-w-0 flex-1">
                <input
                  value={p.name}
                  onChange={(e) => updateName(p.id, e.target.value)}
                  className="nv-display w-full rounded-lg border border-transparent px-1 text-[14px] font-bold text-slate-900 outline-none focus:border-blue-200 focus:bg-blue-50/40"
                />
                <p className="nv-body truncate text-[11px] text-slate-500">
                  ¥{formatYen(p.hourlyBase)}/h · Líquido: {yenLabel(payslip.net)}
                </p>
              </div>
              <button
                onClick={() => onGoToProfile(p.id)}
                className="flex-shrink-0 rounded-full border border-blue-200 px-3 py-1.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-50"
              >
                Editar
              </button>
              {profiles.length > 1 && (
                <button
                  onClick={() => removeProfile(p.id)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
      <button
        onClick={addProfile}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-3 text-[13px] font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" /> Adicionar pessoa da família
      </button>
    </div>
  );
}

// Aba "🏠 Orçamento" — soma as rendas líquidas de todos os perfis +
// renda extra, contra a lista de despesas mensais.
export function OrcamentoTab({ profiles, rendaExtra, setRendaExtra, expenses, setExpenses }) {
  const totalRendaPerfis = useMemo(() => profiles.reduce((sum, p) => sum + computeProfilePayslip(p).net, 0), [profiles]);
  const totalRendaFamiliar = totalRendaPerfis + (Number(rendaExtra) || 0);
  const totalDespesas = useMemo(() => expenses.reduce((sum, e) => sum + (Number(e.valor) || 0), 0), [expenses]);
  const saldo = totalRendaFamiliar - totalDespesas;

  const updateExpense = (id, patch) => setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const removeExpense = (id) => setExpenses((prev) => prev.filter((e) => e.id !== id));
  const addExpense = () => setExpenses((prev) => [...prev, { id: uid(), nome: "Nova despesa", valor: 0, dia: 10, pago: false }]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-sm">
        <p className="nv-body text-[10px] font-bold uppercase tracking-wide opacity-90">Total Renda Familiar</p>
        <p className="nv-display mt-1 text-[32px] font-extrabold leading-none">{yenLabel(totalRendaFamiliar)}</p>
        <p className="nv-body mt-1.5 text-[11px] opacity-85">{profiles.length} renda(s) somada(s) + extras</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="nv-display mb-3 text-[13px] font-bold text-slate-900">💰 Composição da Renda</h4>
        <div className="space-y-1.5 text-[12px]">
          {profiles.map((p) => (
            <div key={p.id} className="flex justify-between gap-2">
              <span className="truncate text-slate-500">{p.name}</span>
              <span className="flex-shrink-0 font-semibold text-slate-700">{yenLabel(computeProfilePayslip(p).net)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3">
          {fieldSuffix("Renda extra / bicos", rendaExtra, setRendaExtra, "¥", 1000)}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="nv-display text-[13px] font-bold text-slate-900">🧾 Despesas Mensais</h4>
          <span className="nv-body text-[11px] font-semibold text-rose-600">{yenLabel(totalDespesas)}</span>
        </div>
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="rounded-xl border border-slate-100 p-2.5">
              <div className="flex items-center gap-2">
                <input
                  value={e.nome}
                  onChange={(ev) => updateExpense(e.id, { nome: ev.target.value })}
                  placeholder="Nome da despesa"
                  className="nv-body min-w-0 flex-1 rounded-lg border border-transparent px-1.5 py-1 text-[13px] font-semibold text-slate-800 outline-none focus:border-blue-200"
                />
                <button
                  onClick={() => removeExpense(e.id)}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-rose-400 hover:bg-rose-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    type="number"
                    value={e.valor === 0 ? "" : e.valor}
                    onChange={(ev) => updateExpense(e.id, { valor: ev.target.value === "" ? 0 : Number(ev.target.value) })}
                    placeholder="0"
                    title="Valor (¥)"
                    className="nv-body w-full rounded-lg border border-slate-200 py-1.5 pl-2 pr-6 text-[12px] text-slate-700 outline-none focus:border-blue-400"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">¥</span>
                </div>
                <div className="relative w-[68px] flex-shrink-0">
                  <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-medium text-slate-400">dia</span>
                  <input
                    type="number"
                    value={e.dia === 0 ? "" : e.dia}
                    onChange={(ev) => updateExpense(e.id, { dia: ev.target.value === "" ? 0 : Number(ev.target.value) })}
                    placeholder="0"
                    title="Dia de vencimento"
                    className="nv-body w-full rounded-lg border border-slate-200 py-1.5 pl-6 pr-2 text-center text-[12px] text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>
                <button
                  onClick={() => updateExpense(e.id, { pago: !e.pago })}
                  className={`flex-shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${
                    e.pago ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {e.pago ? "Pago" : "Aberto"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addExpense}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-[12px] font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar despesa
        </button>
      </div>

      <div className={`rounded-2xl border p-4 shadow-sm ${saldo >= 0 ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60"}`}>
        <div className="flex items-center justify-between">
          <span className="nv-body text-[12px] font-semibold text-slate-700">Saldo do mês</span>
          <span className={`nv-display text-[18px] font-extrabold ${saldo >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{yenLabel(saldo)}</span>
        </div>
      </div>
    </div>
  );
}

// Aba "🛒 Compras" — lista interativa simples, com valor por item e
// total já comprado vs total da lista.
export function ComprasTab({ shoppingList, setShoppingList }) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (!newItem.trim()) return;
    setShoppingList((prev) => [...prev, { id: uid(), nome: newItem.trim(), valor: 0, comprado: false }]);
    setNewItem("");
  };
  const toggle = (id) => setShoppingList((prev) => prev.map((i) => (i.id === id ? { ...i, comprado: !i.comprado } : i)));
  const remove = (id) => setShoppingList((prev) => prev.filter((i) => i.id !== id));
  const updateValor = (id, valor) => setShoppingList((prev) => prev.map((i) => (i.id === id ? { ...i, valor } : i)));

  const total = shoppingList.reduce((s, i) => s + (Number(i.valor) || 0), 0);
  const totalComprado = shoppingList.filter((i) => i.comprado).reduce((s, i) => s + (Number(i.valor) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="nv-display mb-3 text-[13px] font-bold text-slate-900">🛒 Lista de Compras</h4>
        <div className="flex gap-2">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Ex: Arroz 5kg"
            className="nv-body flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
          />
          <button onClick={addItem} className="flex-shrink-0 rounded-lg bg-blue-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {shoppingList.length === 0 ? (
        <p className="nv-body py-6 text-center text-[12px] text-slate-400">Lista vazia — adicione o que precisa comprar.</p>
      ) : (
        <div className="space-y-2">
          {shoppingList.map((item) => (
            <div key={item.id} className={`flex items-center gap-2.5 rounded-xl border p-2.5 ${item.comprado ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white"}`}>
              <button
                onClick={() => toggle(item.id)}
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  item.comprado ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
                }`}
              >
                {item.comprado && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
              <span className={`nv-body min-w-0 flex-1 truncate text-[12px] font-medium ${item.comprado ? "text-slate-400 line-through" : "text-slate-800"}`}>
                {item.nome}
              </span>
              <input
                type="number"
                value={item.valor === 0 ? "" : item.valor}
                onChange={(e) => updateValor(item.id, e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder="0"
                title="Valor (¥)"
                className="nv-body w-16 flex-shrink-0 rounded-lg border border-slate-200 px-1.5 py-1 text-[11px] text-slate-700 outline-none focus:border-blue-400"
              />
              <button onClick={() => remove(item.id)} className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-rose-400 hover:bg-rose-50">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between text-[12px]"><span className="text-slate-500">Total da lista</span><span className="font-semibold text-slate-700">{yenLabel(total)}</span></div>
        <div className="mt-1 flex justify-between text-[12px]"><span className="text-slate-500">Já comprado</span><span className="font-semibold text-emerald-600">{yenLabel(totalComprado)}</span></div>
      </div>
    </div>
  );
}

// Componente principal — barra de pílulas no topo + as 4 seções.
const KAKEIBO_STORAGE_KEY = "kakeibo-data";

export default function KakeiboApp() {
  const [profiles, setProfiles] = useState(() => [makeDefaultProfile("Perfil 1"), makeDefaultProfile("Perfil 2")]);
  const [activeSection, setActiveSection] = useState("perfis");
  const [rendaExtra, setRendaExtra] = useState(0);
  const [expenses, setExpenses] = useState(() => makeDefaultExpenses());
  const [shoppingList, setShoppingList] = useState([]);

  // Carrega o que já estava salvo (pessoal, dessa conta) assim que a
  // aba abre. "loaded" evita que o efeito de salvar (logo abaixo)
  // dispare ANTES da carga terminar e sobrescreva dados reais com os
  // valores padrão (mesmo cuidado que já tomamos com registeredPartners).
  const [loaded, setLoaded] = useState(false);
  const [savingKakeibo, setSavingKakeibo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await personalStorageGet(KAKEIBO_STORAGE_KEY);
        if (!cancelled && saved) {
          if (saved.profiles?.length) setProfiles(saved.profiles);
          if (typeof saved.rendaExtra === "number") setRendaExtra(saved.rendaExtra);
          if (saved.expenses) setExpenses(saved.expenses);
          if (saved.shoppingList) setShoppingList(saved.shoppingList);
        }
      } catch (err) {
        console.error("Falha ao carregar dados salvos do Kakeibo:", err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Salva automaticamente a cada mudança, com um pequeno debounce (não
  // grava uma vez por tecla — espera meio segundo de silêncio).
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (!loaded) return; // ainda carregando o snapshot inicial — não sobrescreve
    setSavingKakeibo(true);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      personalStorageSet(KAKEIBO_STORAGE_KEY, { profiles, rendaExtra, expenses, shoppingList })
        .catch((err) => console.error("Falha ao salvar dados do Kakeibo:", err))
        .finally(() => setSavingKakeibo(false));
    }, 600);
    return () => clearTimeout(saveTimerRef.current);
  }, [profiles, rendaExtra, expenses, shoppingList, loaded]);

  const updateProfile = (id, updated) => setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));
  const activeProfile = profiles.find((p) => p.id === activeSection);

  const sections = [
    { key: "perfis", label: "Perfis", emoji: "⚙️" },
    ...profiles.map((p) => ({ key: p.id, label: p.name, emoji: "👤" })),
    { key: "orcamento", label: "Orçamento", emoji: "🏠" },
    { key: "compras", label: "Compras", emoji: "🛒" },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-menu de pílulas */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                activeSection === s.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
        {savingKakeibo && <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-slate-400" />}
      </div>

      {activeSection === "perfis" && (
        <PerfisTab profiles={profiles} setProfiles={setProfiles} onGoToProfile={setActiveSection} />
      )}

      {activeProfile && (
        <ProfileEditor profile={activeProfile} onChange={(updated) => updateProfile(activeProfile.id, updated)} />
      )}

      {activeSection === "orcamento" && (
        <OrcamentoTab profiles={profiles} rendaExtra={rendaExtra} setRendaExtra={setRendaExtra} expenses={expenses} setExpenses={setExpenses} />
      )}

      {activeSection === "compras" && (
        <ComprasTab shoppingList={shoppingList} setShoppingList={setShoppingList} />
      )}
    </div>
  );
}
