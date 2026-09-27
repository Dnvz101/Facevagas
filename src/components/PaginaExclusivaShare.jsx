// ---------------------------------------------------------------
// PaginaExclusivaShare — card em destaque na aba Início da Área do
// Cliente, com o link da Página Exclusiva e os atalhos de
// compartilhar (nativo do celular, WhatsApp, Facebook, copiar).
// Só é renderizado pelo pai quando company.paginaExclusivaAtiva
// é true — esse componente não decide isso sozinho.
// ---------------------------------------------------------------

import { useState } from "react";
import { Link2, Share2, Copy, Check } from "lucide-react";

// Ícones oficiais simplificados — mesmo estilo (path SVG puro) já
// usado em Badges.jsx pro ícone do WhatsApp, em vez de trazer um
// pacote de ícone de marca só por causa desses dois.
const WhatsAppGlyph = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.09c-.24.68-1.4 1.3-1.93 1.35-.5.05-1.02.24-3.4-.71-2.88-1.15-4.72-4.06-4.87-4.25-.14-.19-1.16-1.55-1.16-2.95 0-1.4.73-2.08 1-2.36.24-.27.53-.34.71-.34.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.57.79 1.98.86 2.12.07.14.11.31.02.5-.09.19-.14.31-.27.47-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.19-.28.37-.23.62-.14.26.09 1.63.77 1.9.91.28.14.46.21.53.33.07.12.07.68-.17 1.35z" />
  </svg>
);
const FacebookGlyph = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function PaginaExclusivaShare({ company }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/?empresa=${company.paginaExclusivaSlug}`;
  const shareText = `Confira as vagas abertas na ${company.name} — tudo num lugar só, atualizado direto por nós:`;

  const legacyCopy = (text) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // segue pro fallback
    }
    if (legacyCopy(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.prompt("Copie o link abaixo:", url);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Vagas na ${company.name}`, text: shareText, url });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    handleCopy();
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Link2 className="h-4 w-4" />
        </div>
        <p className="nv-display text-[14px] font-bold text-indigo-900">Sua Página Exclusiva de vagas</p>
      </div>
      <p className="nv-body mt-2 text-[12px] leading-relaxed text-slate-600">
        Compartilhe esse link com seus candidatos — eles veem só as vagas da sua empresa, sem precisar navegar o site inteiro.
      </p>
      <p className="nv-body mt-2 truncate rounded-lg bg-white px-3 py-2 text-[11.5px] font-medium text-indigo-700">{url}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          onClick={handleNativeShare}
          className="nv-body flex flex-col items-center gap-1 rounded-xl bg-indigo-600 py-2.5 text-[11px] font-bold text-white"
        >
          <Share2 className="h-4 w-4" /> Compartilhar
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="nv-body flex flex-col items-center gap-1 rounded-xl bg-emerald-500 py-2.5 text-[11px] font-bold text-white"
        >
          <WhatsAppGlyph className="h-4 w-4" /> WhatsApp
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="nv-body flex flex-col items-center gap-1 rounded-xl bg-blue-600 py-2.5 text-[11px] font-bold text-white"
        >
          <FacebookGlyph className="h-4 w-4" /> Facebook
        </a>
        <button
          onClick={handleCopy}
          className="nv-body flex flex-col items-center gap-1 rounded-xl border border-indigo-200 bg-white py-2.5 text-[11px] font-bold text-indigo-700"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado!" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
