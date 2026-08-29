// ---------------------------------------------------------------
// AdminSwitcherMenu — botão de 3 riscos fixo, centraliza TODAS as
// ferramentas administrativas + "Ver como" outro tipo de conta.
// ⚠️ Não mostra mais o e-mail fixo do Super Admin (não existe mais
// como constante — o e-mail de verdade agora vive só na tabela
// admin_users do banco).
// ---------------------------------------------------------------

import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";

export default function AdminSwitcherMenu({ onManagePartners, onOpenAdminTool, onViewAs, onLogout }) {
  const [open, setOpen] = useState(false);

  // Ferramentas do Dono — a primeira ("parceiros") abre um modal à
  // parte (onManagePartners); as outras navegam pro Painel Admin
  // (tab "admin") já na seção certa (onOpenAdminTool usa as mesmas
  // chaves do adminTab: publicador/planos/comunicados/vagas).
  const OWNER_TOOLS = [
    { key: "parceiros", label: "Gerenciar Parceiros & Selos", emoji: "📋" },
    { key: "publicador", label: "Publicador Mágico", emoji: "✨" },
    { key: "planos", label: "Planos (Configuração/Teste)", emoji: "💳" },
    { key: "comunicados", label: "Comunicados / Banner", emoji: "📢" },
    { key: "vagas", label: "Todas as Vagas", emoji: "🗂️" },
    { key: "estatisticas", label: "Estatísticas de Uso", emoji: "📊" },
    { key: "comunidade", label: "Comunidade (Vídeos)", emoji: "🤝" },
    { key: "prestadores", label: "Prestadores de Serviço", emoji: "🛠️" },
  ];

  const VIEW_AS_OPTIONS = [
    { key: "jto", label: "Empreiteira (Teste - Pro)", emoji: "🏢" },
    { key: "prestador", label: "Prestador de Serviço", emoji: "🛠️" },
    { key: "loja", label: "Loja / Comércio", emoji: "🏪" },
    { key: "publico", label: "Visão Pública / Visitante", emoji: "👤" },
  ];

  const handleOwnerTool = (key) => {
    setOpen(false);
    if (key === "parceiros") onManagePartners();
    else onOpenAdminTool(key);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800"
        title="Menu do Super Admin"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900/50 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="nv-rise flex h-full w-full max-w-xs flex-col overflow-hidden bg-white shadow-xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[16px]">👑</span>
                <div>
                  <p className="nv-display text-[13px] font-bold text-slate-900">Super Admin</p>
                  <p className="nv-body text-[11px] text-slate-400">Acesso master</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <p className="nv-body px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Ferramentas do Dono
              </p>
              {OWNER_TOOLS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleOwnerTool(opt.key)}
                  className="nv-body flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <span className="text-[16px]">{opt.emoji}</span> {opt.label}
                </button>
              ))}

              <p className="nv-body mt-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Alternar Modo / Ver Como...
              </p>
              {VIEW_AS_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setOpen(false); onViewAs(opt.key); }}
                  className="nv-body flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span className="text-[16px]">{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 p-3">
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="nv-body flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
