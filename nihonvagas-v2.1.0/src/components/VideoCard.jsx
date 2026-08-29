// ---------------------------------------------------------------
// VideoCard — card de vídeo da Comunidade, estilo feed do YouTube,
// carregamento preguiçoso (só thumbnail até o clique).
// ---------------------------------------------------------------

import { useState } from "react";
import { PlayCircle, Play, ExternalLink } from "lucide-react";

export default function VideoCard({ item }) {
  const [playing, setPlaying] = useState(false);
  // Thumbnail quebrada não vira mais um retângulo cinza vazio — se o ID
  // do vídeo não for válido (ou o vídeo tiver sido removido), cai num
  // ícone de vídeo centralizado em vez de uma imagem quebrada.
  const [thumbError, setThumbError] = useState(false);

  return (
    <div className="group border-b border-slate-100 pb-5 last:border-0 last:pb-0">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-200">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
            title={item.titulo}
            className="h-full w-full"
            allow="accelerate-motion; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setPlaying(true)} className="relative h-full w-full">
            {thumbError ? (
              <div className="flex h-full w-full items-center justify-center bg-slate-200">
                <PlayCircle className="h-9 w-9 text-slate-400" />
              </div>
            ) : (
              <img
                src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
                onError={() => setThumbError(true)}
                alt={item.titulo}
                className="h-full w-full object-cover"
              />
            )}
            {/* Botão de play vermelho — igual ao estilo do app do YouTube,
                em vez do círculo branco/translúcido genérico de antes. */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/25">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 shadow-lg">
                <Play className="ml-0.5 h-4.5 w-4.5 text-white" fill="white" />
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Bloco de texto ABAIXO da thumbnail, sem moldura/card em volta —
          estilo feed do YouTube: "avatar" redondo (aqui, um emoji fixo,
          já que não temos canal de verdade) + título em 2 linhas +
          categoria como se fosse o nome do canal. */}
      <div className="mt-2 flex gap-2">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-[14px]">
          🤝
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="nv-body text-[13px] font-semibold leading-snug text-slate-900"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {item.titulo}
          </p>
          <p className="nv-body mt-0.5 truncate text-[11px] text-slate-500">{item.categoria}</p>
          {/* Rede de segurança: abre o vídeo direto no YouTube, numa aba
              nova — funciona mesmo se a miniatura/iframe embutido não
              carregar em algum ambiente (ex: dentro do preview do
              artifact aqui no Claude, que pode restringir domínios
              externos; no site publicado de verdade isso não deve
              acontecer). */}
          <a
            href={`https://www.youtube.com/watch?v=${item.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="nv-body mt-1 inline-flex items-center gap-1 text-[10.5px] font-medium text-blue-500 hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Assistir no YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
