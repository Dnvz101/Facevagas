// ---------------------------------------------------------------
// Painel do Prestador de Serviço logado — sem Planos (prestador NUNCA
// é cobrado). Lista de anúncios com editar/excluir/criar novo.
// ---------------------------------------------------------------

import { useState } from "react";
import { Building2, Heart, Plus, Settings, Trash2 } from "lucide-react";
import ServiceProviderCard from "./ServiceProviderCard.jsx";
import { CATEGORY_COLOR_OPTIONS } from "../utils/categoryStyle.js";

export function ProviderListingForm({ initial, categories, defaultWhatsapp, onSave, onCancel }) {
  const [categoriaSelect, setCategoriaSelect] = useState(initial?.categoria || "");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [nome, setNome] = useState(initial?.nome || "");
  const [descricao, setDescricao] = useState(initial?.descricao || "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp || defaultWhatsapp || "");
  const [error, setError] = useState(null);

  const isNewCategory = categoriaSelect === "__nova__";
  const categoriaFinal = isNewCategory ? novaCategoria.trim() : categoriaSelect;

  const handleSave = () => {
    if (!nome.trim() || !categoriaFinal || !descricao.trim() || !whatsapp.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    setError(null);
    onSave({ categoria: categoriaFinal, nome: nome.trim(), descricao: descricao.trim(), whatsapp: whatsapp.trim(), isNewCategory });
  };

  const previewCategories = isNewCategory && novaCategoria.trim()
    ? [...categories, { nome: novaCategoria.trim(), color: CATEGORY_COLOR_OPTIONS[categories.length % CATEGORY_COLOR_OPTIONS.length].key, icon: "Building2" }]
    : categories;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Nome do negócio</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={40}
          className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
        />
        <p className="nv-body text-right text-[10px] text-slate-400">{nome.length}/40</p>
      </div>
      <div>
        <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Categoria</label>
        <select
          value={categoriaSelect}
          onChange={(e) => setCategoriaSelect(e.target.value)}
          className="nv-body w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-blue-400"
        >
          <option value="" disabled>Selecione uma categoria...</option>
          {categories.map((c) => (
            <option key={c.nome} value={c.nome}>{c.nome}</option>
          ))}
          <option value="__nova__">➕ Criar nova categoria</option>
        </select>
        {isNewCategory && (
          <input
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            placeholder="Nome da categoria"
            maxLength={30}
            className="nv-body mt-2 w-full rounded-lg border border-blue-300 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
          />
        )}
      </div>
      <div>
        <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Descrição</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={2}
          maxLength={120}
          className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
        />
        <p className="nv-body text-right text-[10px] text-slate-400">{descricao.length}/120</p>
      </div>
      <div>
        <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">WhatsApp</label>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="090-1234-5678"
          className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
        />
      </div>

      <div>
        <p className="nv-body mb-1.5 text-[10px] font-semibold text-slate-400">Prévia do card</p>
        <ServiceProviderCard
          item={{ id: "preview", nome: nome.trim() || "Nome do seu negócio", categoria: categoriaFinal || "Categoria", descricao: descricao.trim() || "Descreva seu serviço...", whatsapp: whatsapp.trim() || "090-0000-0000", likes: initial?.likes || 0 }}
          isLiked={false}
          onToggleLike={() => {}}
          categories={previewCategories}
        />
      </div>

      {error && <p className="nv-body text-[11px] font-medium text-rose-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onCancel} className="nv-body flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
        <button onClick={handleSave} className="nv-body flex-[2] rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700">
          Salvar anúncio
        </button>
      </div>
    </div>
  );
}

export default function ProviderDashboard({ provider, listings, categories, onAddListing, onUpdateListing, onDeleteListing, onLogout }) {
  const [formMode, setFormMode] = useState(null); // null | "novo" | listingId (editando)

  const editingListing = typeof formMode === "string" && formMode !== "novo" ? listings.find((l) => l.id === formMode) : null;

  const handleSave = (data) => {
    if (formMode === "novo") {
      onAddListing({ ...data, providerId: provider.id, likes: 0, status: "publicado" });
    } else {
      onUpdateListing(formMode, data);
    }
    setFormMode(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="nv-body text-[10px] font-bold uppercase tracking-wide text-blue-600">Área do Prestador</p>
          <h2 className="nv-display truncate text-[16px] font-bold text-slate-900">{provider.name}</h2>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5">
        <Heart className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" fill="currentColor" />
        <p className="nv-body text-[11.5px] leading-relaxed text-emerald-800">
          Seu cadastro e seus anúncios são <span className="font-bold">sempre gratuitos</span> — sem taxa, sem plano pago, nunca.
        </p>
      </div>

      {formMode ? (
        <ProviderListingForm
          initial={editingListing}
          categories={categories}
          defaultWhatsapp={provider.phonePt}
          onSave={handleSave}
          onCancel={() => setFormMode(null)}
        />
      ) : (
        <>
          <button
            onClick={() => setFormMode("novo")}
            className="nv-body flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Novo anúncio
          </button>

          {listings.length === 0 ? (
            <p className="nv-body py-8 text-center text-[13px] text-slate-400">Você ainda não tem nenhum anúncio.</p>
          ) : (
            <div className="space-y-2">
              {listings.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <ServiceProviderCard item={item} isLiked={false} onToggleLike={() => {}} categories={categories} />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setFormMode(item.id)}
                      className="nv-body flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Settings className="h-3 w-3" /> Editar
                    </button>
                    <button
                      onClick={() => { if (window.confirm("Excluir esse anúncio?")) onDeleteListing(item.id); }}
                      className="nv-body flex flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3 w-3" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
