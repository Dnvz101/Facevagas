// ---------------------------------------------------------------
// Admin: cadastro de conteúdo de vídeo da Comunidade — categoria
// como <select> (existente + "criar nova"), evita duplicata por
// digitação ("Visto" vs "Vistos").
// ---------------------------------------------------------------

import { useState, useMemo } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { extractYoutubeId } from "../utils/misc.js";

export default function CommunityAdminPanel({ items, onAdd, onDelete }) {
  // Categoria vira um <select> com o que já existe + "Criar nova
  // categoria" — não é mais texto livre em toda vez. Isso é o que
  // resolve o problema de "Visto" numa vaga e "Vistos" na próxima:
  // depois que a categoria existe, só dá pra ESCOLHER ela de novo, não
  // dá pra digitar errado por acidente.
  const [categoriaSelect, setCategoriaSelect] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState(null);

  const categoriasExistentes = useMemo(() => [...new Set(items.map((i) => i.categoria).filter(Boolean))], [items]);
  const criandoNova = categoriaSelect === "__nova__";
  const categoriaFinal = criandoNova ? novaCategoria.trim() : categoriaSelect;

  const handleAdd = () => {
    const youtubeId = extractYoutubeId(urlInput);
    if (!youtubeId) {
      setError("Não consegui identificar o vídeo nesse link. Cole o link completo do YouTube.");
      return;
    }
    if (!titulo.trim() || !categoriaFinal) {
      setError("Preencha categoria e título.");
      return;
    }
    setError(null);
    onAdd({ categoria: categoriaFinal, titulo: titulo.trim(), descricao: descricao.trim(), youtubeId });
    setTitulo("");
    setDescricao("");
    setUrlInput("");
    setNovaCategoria("");
    // Depois de criar uma categoria nova, deixa ela já selecionada —
    // se o próximo vídeo for da mesma categoria, é só continuar.
    if (criandoNova) setCategoriaSelect(categoriaFinal);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display mb-3 flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <Users className="h-4 w-4 text-blue-600" /> Novo conteúdo
        </h3>

        <div className="space-y-3">
          <div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Categoria</label>
            <select
              value={categoriaSelect}
              onChange={(e) => setCategoriaSelect(e.target.value)}
              className="nv-body w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="" disabled>Selecione uma categoria...</option>
              {categoriasExistentes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__nova__">➕ Criar nova categoria</option>
            </select>
            {criandoNova && (
              <input
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Ex: 📄 Documentos & Visto"
                autoFocus
                className="nv-body mt-2 w-full rounded-lg border border-blue-300 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
              />
            )}
          </div>
          <div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Como renovar o Zairyu Card"
              className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Link do YouTube</label>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Cole o link completo aqui"
              className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Descrição (opcional)</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
            />
          </div>
          {error && <p className="nv-body text-[11px] font-medium text-rose-600">{error}</p>}
          <button
            onClick={handleAdd}
            className="nv-body flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Adicionar conteúdo
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display mb-3 text-[13px] font-bold text-slate-800">{items.length} item{items.length === 1 ? "" : "ns"} cadastrado{items.length === 1 ? "" : "s"}</h3>
        {items.length === 0 ? (
          <p className="nv-body py-4 text-center text-[12px] text-slate-400">Nada cadastrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2.5">
                <img
                  src={`https://img.youtube.com/vi/${item.youtubeId}/default.jpg`}
                  alt={item.titulo}
                  className="h-12 w-16 flex-shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="nv-body truncate text-[10px] font-semibold text-blue-600">{item.categoria}</p>
                  <p className="nv-body truncate text-[12px] font-semibold text-slate-700">{item.titulo}</p>
                </div>
                <button
                  onClick={() => onDelete(item.id)}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50"
                >
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
