// ---------------------------------------------------------------
// Admin: gerenciador de categorias de prestador (cor + ícone) +
// cadastro rápido de prestador de teste.
// ---------------------------------------------------------------

import { useState } from "react";
import { Building2, Plus, Settings, Trash2 } from "lucide-react";
import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS, CATEGORY_ICON_MAP, getCategoryColor, getCategoryIcon } from "../utils/categoryStyle.js";

export function CategoryStylePicker({ color, icon, onChangeColor, onChangeIcon }) {
  return (
    <div className="mt-3 space-y-3">
      <div>
        <p className="nv-body mb-1.5 text-[10px] font-semibold text-slate-400">Cor</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLOR_OPTIONS.map((c) => (
            <button
              key={c.key}
              onClick={() => onChangeColor(c.key)}
              title={c.label}
              className={`h-7 w-7 flex-shrink-0 rounded-full ${c.swatch} ${color === c.key ? "ring-2 ring-offset-2 ring-slate-400" : ""}`}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="nv-body mb-1.5 text-[10px] font-semibold text-slate-400">Ícone</p>
        <div className="grid grid-cols-6 gap-1.5">
          {CATEGORY_ICON_OPTIONS.map((iconName) => {
            const IconComp = CATEGORY_ICON_MAP[iconName];
            return (
              <button
                key={iconName}
                onClick={() => onChangeIcon(iconName)}
                title={iconName}
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${
                  icon === iconName ? "border-blue-400 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <IconComp className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ServiceCategoryManager({ categories, onSave, listings }) {
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novaCor, setNovaCor] = useState(CATEGORY_COLOR_OPTIONS[0].key);
  const [novoIcone, setNovoIcone] = useState(CATEGORY_ICON_OPTIONS[0]);
  const [editingCat, setEditingCat] = useState(null); // nome da categoria em edição, ou null
  const [error, setError] = useState(null);

  const countByCategory = (nome) => listings.filter((l) => l.categoria === nome).length;

  const handleAdd = () => {
    const nome = novaCategoria.trim();
    if (!nome) return;
    if (categories.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
      setError("Essa categoria já existe.");
      return;
    }
    setError(null);
    onSave([...categories, { nome, color: novaCor, icon: novoIcone }]);
    setNovaCategoria("");
    // Escolhe a próxima cor da lista automaticamente, pra facilitar
    // cadastrar várias categorias seguidas sem repetir cor sem querer.
    const nextColorIdx = (CATEGORY_COLOR_OPTIONS.findIndex((c) => c.key === novaCor) + 1) % CATEGORY_COLOR_OPTIONS.length;
    setNovaCor(CATEGORY_COLOR_OPTIONS[nextColorIdx].key);
  };

  const handleDelete = (nome) => {
    const emUso = countByCategory(nome);
    if (emUso > 0 && !window.confirm(`${emUso} prestador(es) usam essa categoria. Excluir mesmo assim? Os anúncios não somem, só ficam sem selo até você editar.`)) {
      return;
    }
    onSave(categories.filter((c) => c.nome !== nome));
  };

  const handleUpdateStyle = (nome, patch) => {
    onSave(categories.map((c) => (c.nome === nome ? { ...c, ...patch } : c)));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display mb-3 flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <Building2 className="h-4 w-4 text-blue-600" /> Categorias de Prestadores
        </h3>
        <p className="nv-body mb-3 text-[12px] text-slate-500">
          Cada categoria vira o selo de canto e a cor do card na aba Comunidade, e aparece como opção no cadastro do prestador.
        </p>
        <div className="flex gap-2">
          <input
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Ex: Tradução, Shaken, Mecânicos..."
            className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
          />
          <button onClick={handleAdd} className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 text-[12px] font-bold text-white hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Criar
          </button>
        </div>
        {error && <p className="nv-body mt-1.5 text-[11px] font-medium text-rose-600">{error}</p>}

        <CategoryStylePicker color={novaCor} icon={novoIcone} onChangeColor={setNovaCor} onChangeIcon={setNovoIcone} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display mb-3 text-[13px] font-bold text-slate-800">{categories.length} categoria{categories.length === 1 ? "" : "s"}</h3>
        {categories.length === 0 ? (
          <p className="nv-body py-4 text-center text-[12px] text-slate-400">Nenhuma categoria criada ainda.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => {
              const color = getCategoryColor(cat.color);
              const Icon = getCategoryIcon(cat.icon);
              const isEditing = editingCat === cat.nome;
              return (
                <div key={cat.nome} className="rounded-xl border border-slate-100 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${color.iconBg} ${color.iconText}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className={`rounded-tl-lg rounded-br-md ${color.badgeBg} ${color.badgeText} px-2 py-1 text-[9px] font-bold uppercase tracking-wide`}>{cat.nome}</span>
                      <span className="nv-body text-[11px] text-slate-400">{countByCategory(cat.nome)} prestador{countByCategory(cat.nome) === 1 ? "" : "es"}</span>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        onClick={() => setEditingCat(isEditing ? null : cat.nome)}
                        className={`flex h-7 w-7 items-center justify-center rounded-full ${isEditing ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:bg-slate-100"}`}
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(cat.nome)} className="flex h-7 w-7 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {isEditing && (
                    <CategoryStylePicker
                      color={cat.color}
                      icon={cat.icon}
                      onChangeColor={(key) => handleUpdateStyle(cat.nome, { color: key })}
                      onChangeIcon={(name) => handleUpdateStyle(cat.nome, { icon: name })}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ServiceListingsAdminPanel({ listings, categories, onAdd, onDelete }) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState(null);

  const handleAdd = () => {
    if (!nome.trim() || !categoria || !descricao.trim() || !whatsapp.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    setError(null);
    onAdd({ providerId: null, nome: nome.trim(), categoria, descricao: descricao.trim(), whatsapp: whatsapp.trim(), likes: 0, status: "publicado" });
    setNome(""); setDescricao(""); setWhatsapp("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
        <p className="nv-body text-[11px] text-amber-700">
          ⚠️ Cadastro rápido pra testes — o fluxo de verdade já existe: quando alguém escolhe "Prestador de Serviço" no
          cadastro do site, o anúncio é criado junto, com prévia ao vivo. Use isso aqui só pra popular dados de teste.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display mb-3 flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <Plus className="h-4 w-4 text-blue-600" /> Novo prestador (teste)
        </h3>
        <div className="space-y-3">
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} placeholder="Nome do prestador/negócio" className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400" />
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="nv-body w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-blue-400">
            <option value="" disabled>Selecione a categoria...</option>
            {categories.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
          </select>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} maxLength={120} placeholder="Descrição do serviço" className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400" />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp (ex: 090-1234-5678)" className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400" />
          {categories.length === 0 && <p className="nv-body text-[11px] text-rose-500">Crie uma categoria primeiro, ao lado.</p>}
          {error && <p className="nv-body text-[11px] font-medium text-rose-600">{error}</p>}
          <button onClick={handleAdd} className="nv-body flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Adicionar prestador
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display mb-3 text-[13px] font-bold text-slate-800">{listings.length} prestador{listings.length === 1 ? "" : "es"} cadastrado{listings.length === 1 ? "" : "s"}</h3>
        {listings.length === 0 ? (
          <p className="nv-body py-4 text-center text-[12px] text-slate-400">Nenhum prestador cadastrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {listings.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="nv-body truncate text-[10px] font-semibold text-blue-600">{item.categoria}</p>
                  <p className="nv-body truncate text-[12px] font-semibold text-slate-700">{item.nome}</p>
                </div>
                <button onClick={() => onDelete(item.id)} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
