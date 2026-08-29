// ---------------------------------------------------------------
// Aba Comunidade — hoje é 100% Prestadores de Serviço (banner + filtro
// + lista). O conteúdo de vídeo (CommunityPage) fica pronto no código,
// só não é usado no App.jsx principal por enquanto — nada foi perdido.
// ---------------------------------------------------------------

import { useState, useMemo, useRef } from "react";
import { Building2, Heart, Search, X, Users } from "lucide-react";
import BannerCard from "./BannerCard.jsx";
import ServiceProviderCard from "./ServiceProviderCard.jsx";
import VideoCard from "./VideoCard.jsx";
import { shuffleArray } from "../utils/misc.js";

export function ServiceProvidersSection({ listings, categories, likedIds, onToggleLike }) {
  const [activeCategory, setActiveCategory] = useState("todas");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Embaralha só quando o CONJUNTO de prestadores muda de verdade
  // (alguém foi adicionado/removido) — não quando só um like muda.
  // Antes, o array "listings" ganhava uma referência nova a cada like
  // (o contador mudava), e o useMemo reembaralhava tudo de novo,
  // fazendo o card pular de posição e sumir da tela bem na hora do
  // clique. Agora a ordem embaralhada fica guardada e só é recalculada
  // quando o conjunto de IDs muda.
  const idsKey = useMemo(() => listings.map((l) => l.id).sort().join(","), [listings]);
  const shuffleOrderRef = useRef(null);
  const shuffled = useMemo(() => {
    if (!shuffleOrderRef.current || shuffleOrderRef.current.key !== idsKey) {
      shuffleOrderRef.current = { key: idsKey, order: shuffleArray(listings.map((l) => l.id)) };
    }
    const byId = new Map(listings.map((l) => [l.id, l]));
    return shuffleOrderRef.current.order.map((id) => byId.get(id)).filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, idsKey]);

  const visibleListings = useMemo(() => {
    const base = activeCategory === "todas" ? shuffled : listings.filter((l) => l.categoria === activeCategory);
    return onlyFavorites ? base.filter((l) => likedIds.has(l.id)) : base;
  }, [activeCategory, listings, shuffled, onlyFavorites, likedIds]);

  if (listings.length === 0 && categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
        <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
        <p className="nv-body text-[13px] text-slate-400">Nenhum prestador cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-3">
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Categoria</label>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="nv-body w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="todas">Todas</option>
              {categories.map((cat) => (
                <option key={cat.nome} value={cat.nome}>{cat.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Favoritas</label>
            <button
              onClick={() => setOnlyFavorites((v) => !v)}
              className={`flex w-full items-center justify-center rounded-lg border py-2 ${
                onlyFavorites ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-300 hover:bg-slate-50"
              }`}
            >
              <Heart className="h-4 w-4" fill={onlyFavorites ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {visibleListings.length === 0 ? (
        <p className="nv-body py-10 text-center text-[13px] text-slate-400">
          {onlyFavorites ? "Você ainda não curtiu nenhum prestador." : "Nenhum prestador nessa categoria ainda."}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {visibleListings.map((item) => (
            <ServiceProviderCard key={item.id} item={item} isLiked={likedIds.has(item.id)} onToggleLike={onToggleLike} categories={categories} />
          ))}
        </div>
      )}
    </div>
  );
}

// Casca da aba Comunidade — alterna entre "📺 Vídeos" (conteúdo curado
// já existente) e "🤝 Prestadores" (novo diretório de prestadores de
// serviço da comunidade). Mantém só 1 aba no menu principal (não
// cresce a barra de navegação de novo).
// Aba Comunidade — hoje é 100% sobre o diretório de Prestadores de
// Serviço da comunidade (banner + filtro + lista, mesma estrutura da
// aba Vagas). O conteúdo de vídeo (CommunityPage) fica guardado no
// código, só não é mostrado aqui por enquanto — nada foi apagado, é só
// questão de decidir depois se/onde ele reaparece.
//
// ⚠️ PRINCÍPIO DO PRODUTO: essa área existe pra ajudar quem trabalha —
// trabalhador e prestador de serviço SEMPRE em primeiro lugar. O
// cadastro do prestador (Fase 2) NUNCA deve cobrar nada dele — sem
// plano pago, sem selo pago, sem cota. Diferente da Empreiteira
// (Planos), aqui o valor vem de ajudar a comunidade, não de vender.
export default function CommunidadeTab({ banner, listings, categories, likedIds, onToggleLike, onCadastrar }) {
  return (
    <div className="space-y-4">
      {banner.enabled !== false && <BannerCard banner={banner} variant="comunidade" onCadastrar={onCadastrar} />}
      <ServiceProvidersSection listings={listings} categories={categories} likedIds={likedIds} onToggleLike={onToggleLike} />
    </div>
  );
}

export function CommunityPage({ items }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("todas");

  // Categorias dinâmicas — vêm direto do que o Admin já cadastrou, na
  // ordem em que apareceram pela primeira vez (sem lista separada pra
  // manter sincronizada: criar uma categoria nova é só usar um nome
  // novo ao cadastrar um vídeo).
  const categorias = useMemo(() => [...new Set(items.map((i) => i.categoria).filter(Boolean))], [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory !== "todas" && item.categoria !== activeCategory) return false;
      if (!q) return true;
      return (
        item.titulo?.toLowerCase().includes(q) ||
        item.descricao?.toLowerCase().includes(q) ||
        item.categoria?.toLowerCase().includes(q)
      );
    });
  }, [items, search, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map();
    filteredItems.forEach((item) => {
      const cat = item.categoria || "Outros";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(item);
    });
    return [...map.entries()];
  }, [filteredItems]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
        <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
        <p className="nv-body text-[13px] text-slate-400">Ainda não tem nenhum conteúdo aqui. Volte em breve!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título ou tema..."
          className="nv-body w-full text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
        />
        {search && (
          <button onClick={() => setSearch("")} className="flex-shrink-0 text-slate-300 hover:text-slate-500">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="-mx-5 overflow-x-auto px-5">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveCategory("todas")}
            className={`flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${
              activeCategory === "todas" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${
                activeCategory === cat ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="nv-body py-10 text-center text-[13px] text-slate-400">Nada encontrado — tenta outra busca ou categoria.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(([categoria, catItems]) => (
            <div key={categoria}>
              {activeCategory === "todas" && (
                <p className="nv-display mb-2 text-[13px] font-bold text-slate-700">{categoria}</p>
              )}
              <div className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2">
                {catItems.map((item) => (
                  <VideoCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
