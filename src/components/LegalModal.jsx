// ---------------------------------------------------------------
// LegalModal — modal bilíngue (PT/EN) pras 3 páginas legais.
//
// ⚠️ Detalhe de implementação importante: as propriedades de
// posicionamento crítico (fixed, flex, overflow-y) usam ESTILO
// INLINE, não classe do Tailwind. Isso não é preferência de estilo —
// foi corrigido depois de um bug real onde a classe "overflow-y-auto"
// não estava sendo aplicada de verdade em determinados ambientes de
// renderização, quebrando a rolagem do modal inteiro. Não reverter
// pra classe sem testar de verdade num navegador primeiro.
// ---------------------------------------------------------------

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { LEGAL_PAGES } from "../config/legalContent.js";

export default function LegalModal({ page, onClose }) {
  const [lang, setLang] = useState("pt"); // "pt" | "en"

  // Trava a rolagem da página de fundo enquanto o modal está aberto —
  // sem isso, no celular (principalmente iOS), o site inteiro pode
  // rolar por trás de um elemento "fixed", fazendo o cabeçalho do
  // modal (com o botão de fechar) sair da tela. Só travar o overflow
  // não é suficiente nesse caso específico — trava a posição da
  // página inteira (truque padrão usado por bibliotecas de modal),
  // e devolve pro ponto exato de onde a pessoa estava ao fechar.
  useEffect(() => {
    if (!page) return;
    const scrollY = window.scrollY;
    const original = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = original.position;
      document.body.style.top = original.top;
      document.body.style.width = original.width;
      document.body.style.overflow = original.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [page]);

  // Sempre reabre em português, independente de qual idioma ficou
  // selecionado da última vez que outra página foi aberta.
  useEffect(() => {
    if (page) setLang("pt");
  }, [page]);

  if (!page) return null;
  const pageData = LEGAL_PAGES[page];
  const data = pageData[lang];
  return (
    <div
      className="z-50 items-end justify-center p-0 sm:items-center sm:p-4"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nv-rise w-full rounded-t-3xl shadow-xl sm:max-w-lg sm:rounded-3xl"
        style={{
          display: "flex", flexDirection: "column", overflow: "hidden",
          maxHeight: "85vh", backgroundColor: "#ffffff",
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4" style={{ display: "flex", flexShrink: 0 }}>
          <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
            <span className="text-[18px]">{pageData.icon}</span> {data.title}
          </h3>
          <button onClick={onClose} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-1 border-b border-slate-100 px-5 py-2.5" style={{ display: "flex", flexShrink: 0 }}>
          <button
            onClick={() => setLang("pt")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${lang === "pt" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}
          >
            🇧🇷 Português
          </button>
          <button
            onClick={() => setLang("en")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${lang === "en" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}
          >
            🇺🇸 English
          </button>
        </div>
        <div
          className="px-5 py-4"
          style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}
        >
          <p className="nv-body mb-4 text-[10.5px] text-slate-400">
            {lang === "pt" ? "Última atualização" : "Last updated"}: {data.updated}
          </p>
          {data.content.trim().split("\n\n").map((block, i) => {
            const trimmed = block.trim();
            if (!trimmed) return null;
            const boldMatch = trimmed.match(/^\*\*(.+?)\*\*\s*$/);
            if (boldMatch) {
              return (
                <h4 key={i} className="nv-display mb-2 mt-5 text-[13px] font-bold text-slate-900 first:mt-0">
                  {boldMatch[1]}
                </h4>
              );
            }
            const parts = trimmed.split(/(\*[^*]+\*)/g);
            return (
              <p key={i} className="nv-body mb-3 text-[12.5px] leading-relaxed text-slate-600">
                {parts.map((part, j) =>
                  part.startsWith("*") && part.endsWith("*") ? (
                    <em key={j} className="text-slate-500">{part.slice(1, -1)}</em>
                  ) : (
                    part
                  )
                )}
              </p>
            );
          })}
          <p className="nv-body mt-5 rounded-lg bg-slate-50 p-3 text-[10.5px] leading-relaxed text-slate-400">
            {lang === "pt"
              ? "Este documento é um modelo de referência e não substitui aconselhamento jurídico profissional."
              : "This document is a reference template and does not replace professional legal advice."}
          </p>
        </div>
      </div>
    </div>
  );
}
