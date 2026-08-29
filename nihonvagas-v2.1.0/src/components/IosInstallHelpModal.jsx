// ---------------------------------------------------------------
// IosInstallHelpModal — passo a passo manual pra instalar como PWA no
// iOS (Safari não dispara o evento nativo de instalação).
// ---------------------------------------------------------------

import { Download, X } from "lucide-react";

export default function IosInstallHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="nv-rise w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
            <Download className="h-4 w-4 text-blue-600" /> Adicionar à Tela de Início
          </h3>
          <button onClick={onClose} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="nv-body mb-4 text-[12px] text-slate-500">
          No iPhone, o Safari não deixa instalar direto pelo botão — mas é rapidinho fazer na mão:
        </p>
        <ol className="space-y-2.5">
          <li className="nv-body flex items-start gap-2.5 text-[13px] text-slate-700">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">1</span>
            Toque no ícone de <strong>Compartilhar</strong> (o quadrado com uma seta pra cima), na barra do Safari.
          </li>
          <li className="nv-body flex items-start gap-2.5 text-[13px] text-slate-700">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">2</span>
            Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong>.
          </li>
          <li className="nv-body flex items-start gap-2.5 text-[13px] text-slate-700">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">3</span>
            Toque em <strong>"Adicionar"</strong> — pronto, o ícone do NihonVagas fica na sua tela como um app.
          </li>
        </ol>
        <button
          onClick={onClose}
          className="nv-body mt-4 flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
