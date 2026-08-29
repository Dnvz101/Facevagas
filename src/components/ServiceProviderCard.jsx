// ---------------------------------------------------------------
// ServiceProviderCard — card compacto de prestador de serviço, com
// selo de categoria colorido, curtida e flip pra ver a descrição
// completa.
// ---------------------------------------------------------------

import { useState } from "react";
import { Heart } from "lucide-react";
import { CategoryTab, WhatsAppIcon } from "./Badges.jsx";
import { toWhatsAppLink } from "../utils/format.js";
import { findCategoryStyle } from "../utils/categoryStyle.js";

export default function ServiceProviderCard({ item, isLiked, onToggleLike, categories }) {
  const [flipped, setFlipped] = useState(false);
  const waLink = toWhatsAppLink(item.whatsapp);
  const style = findCategoryStyle(categories, item.categoria);
  const faceClass = `absolute inset-0 rounded-xl border border-slate-200 ${style.color.cardBg} py-2.5 pl-3 pr-7 shadow-sm`;

  return (
    <div onClick={() => setFlipped((f) => !f)} className="relative h-20 cursor-pointer" style={{ perspective: "1200px" }}>
      {/* Selo de categoria FIXO, fora do flip — mostra a mesma coisa nos
          dois lados, então não precisa girar junto. Girar ele também
          causava um bug visual (aparecia espelhado/duplicado no meio da
          animação, por causa de como o navegador lida com
          backface-visibility em elementos posicionados assim). */}
      <CategoryTab categoria={item.categoria} color={style.color} />

      {/* Coração de curtida + contador, agrupados num só bloco centralizado
          (antes eram dois elementos posicionados separadamente e ficavam
          desalinhados um com o outro) — também FIXO fora do flip. */}
      <div className="absolute -right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-0.5">
        {(item.likes || 0) > 0 && (
          <span className="text-[10px] font-normal text-rose-400">({item.likes})</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLike(item.id); }}
          title={isLiked ? "Remover curtida" : "Curtir prestador"}
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors ${
            isLiked ? "border-rose-500 bg-rose-500 text-white" : "border-slate-200 bg-white text-slate-300 hover:text-rose-400"
          }`}
        >
          <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      <div
        className="relative h-full w-full transition-transform duration-500"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateX(180deg)" : "rotateX(0deg)" }}
      >
        {/* FRONT */}
        <div className={faceClass} style={{ backfaceVisibility: "hidden" }}>
          <div className="flex h-full items-center gap-2.5 pt-3">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${style.color.iconBg} ${style.color.iconText}`}>
              <style.Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`nv-display truncate text-[13px] font-bold ${style.color.nameText}`}>{item.nome}</p>
              <p className={`nv-body truncate text-[11px] ${style.color.descText}`}>{item.descricao}</p>
            </div>
            <a
              href={waLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Chamar no WhatsApp"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* BACK */}
        <div className={faceClass} style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>
          <div className="flex h-full items-center gap-2.5 pt-3">
            <p
              className={`nv-body flex-1 text-[10.5px] leading-snug ${style.color.descText}`}
              style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {item.descricao}
            </p>
            <a
              href={waLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
