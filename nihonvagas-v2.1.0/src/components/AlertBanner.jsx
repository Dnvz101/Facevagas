// ---------------------------------------------------------------
// Alerta de Vagas via WhatsApp — banner de CTA, modal de inscrição
// (sem backend de envio automático — a confirmação é o próprio link
// wa.me pro Admin), e o editor Admin com o interruptor mestre.
// ---------------------------------------------------------------

import { useState, useMemo } from "react";
import { Bell, ChevronRight, X, MessageCircle, Phone, AlertCircle } from "lucide-react";
import { toWhatsAppLink, ADMIN_WHATSAPP_RAW } from "../utils/format.js";
import { NIHONGO_LEVELS } from "../config/constants.js";

export function AlertBanner({ config, onClick }) {
  if (!config?.enabled) return null;
  return (
    <button
      onClick={onClick}
      className="nv-rise flex w-full items-center gap-2.5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3.5 py-2.5 text-left hover:from-emerald-100 hover:to-teal-100"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Bell className="h-4 w-4" />
      </div>
      <p className="nv-body min-w-0 flex-1 truncate text-[12.5px] font-semibold text-emerald-800">
        {config.text || "🔔 Receba vagas novas direto no seu WhatsApp"}
      </p>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-emerald-400" />
    </button>
  );
}

// Modal de inscrição — escolhe os mesmos filtros do FilterBar (sexo,
// província, nihongo) + WhatsApp, e ao confirmar abre o wa.me já com
// tudo escrito. Reaproveita NIHONGO_LEVELS pra manter a mesma lista
// de opções em todo o site.
export function WhatsAppAlertModal({ isOpen, onClose, jobs, onSubscribe }) {
  const [provincia, setProvincia] = useState("todas");
  const [sexo, setSexo] = useState("todos");
  const [nihongo, setNihongo] = useState("todos");
  const [whatsapp, setWhatsapp] = useState("");
  const [step, setStep] = useState("form"); // "form" | "confirm"
  const [error, setError] = useState(null);

  const provinciaOptions = useMemo(
    () => [...new Set(jobs.map((j) => j.provincia).filter(Boolean))].sort(),
    [jobs]
  );

  if (!isOpen) return null;

  const reset = () => {
    setProvincia("todas"); setSexo("todos"); setNihongo("todos"); setWhatsapp(""); setStep("form"); setError(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const filtroLabel = () => {
    const partes = [];
    partes.push(sexo === "homens" ? "vagas para homens" : sexo === "mulheres" ? "vagas para mulheres" : "vagas");
    if (provincia !== "todas") partes.push(`em ${provincia}`);
    if (nihongo !== "todos") partes.push(`nível de nihongo "${nihongo}"`);
    return partes.join(" · ");
  };

  const waLink = useMemo(() => {
    const message = encodeURIComponent(
      `Olá! Quero receber alertas de vagas novas no WhatsApp.\nMeus filtros: ${filtroLabel()}.`
    );
    return `${toWhatsAppLink(ADMIN_WHATSAPP_RAW)}?text=${message}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sexo, provincia, nihongo]);

  const handleConfirm = () => {
    if (!whatsapp.trim()) {
      setError("Informe seu número de WhatsApp.");
      return;
    }
    setError(null);
    onSubscribe({ provincia, sexo, nihongo, whatsapp: whatsapp.trim() });
    setStep("confirm");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="nv-rise w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
            <Bell className="h-4 w-4 text-emerald-600" /> Alerta de Vagas no WhatsApp
          </h3>
          <button onClick={handleClose} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "form" ? (
          <>
            <p className="nv-body mb-4 text-[12px] text-slate-500">
              Escolha o que você quer receber. Sem cadastro, sem senha — só o WhatsApp.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Sexo</label>
                <select value={sexo} onChange={(e) => setSexo(e.target.value)} className="nv-body w-full appearance-none rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11.5px] font-medium text-slate-700 outline-none focus:border-emerald-400">
                  <option value="todos">Todos</option>
                  <option value="homens">Homens</option>
                  <option value="mulheres">Mulheres</option>
                </select>
              </div>
              <div>
                <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Província</label>
                <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className="nv-body w-full appearance-none rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11.5px] font-medium text-slate-700 outline-none focus:border-emerald-400">
                  <option value="todas">Todas</option>
                  {provinciaOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Nihongo</label>
                <select value={nihongo} onChange={(e) => setNihongo(e.target.value)} className="nv-body w-full appearance-none rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11.5px] font-medium text-slate-700 outline-none focus:border-emerald-400">
                  <option value="todos">Todos</option>
                  {NIHONGO_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="nv-body mb-1 block text-[10px] font-semibold text-slate-400">Seu WhatsApp</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 focus-within:border-emerald-400">
                <Phone className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="090-1234-5678"
                  className="nv-body w-full text-[13px] text-slate-800 outline-none"
                />
              </div>
              {error && <p className="nv-body mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
            </div>

            <button
              onClick={handleConfirm}
              className="nv-body mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" /> Confirmar pelo WhatsApp
            </button>
          </>
        ) : (
          <>
            <p className="nv-body mb-4 text-[12.5px] leading-relaxed text-slate-600">
              Falta só um passo: toque no botão abaixo pra confirmar direto no WhatsApp — é assim que a gente garante
              que o número é seu de verdade.
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="nv-body flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" /> Abrir WhatsApp e confirmar
            </a>
            <button
              onClick={handleClose}
              className="nv-body mt-2.5 flex w-full items-center justify-center text-[11.5px] font-medium text-slate-400"
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Admin: editor do banner de CTA (texto + interruptor mestre da
// função) — separado do BannerEditor principal (aquele é o comunicado
// geral, este é só a tira que promove o Alerta de Vagas).
// ⚠️ "Habilitar Função WhatsApp" é o interruptor GERAL da função
// inteira: enquanto desligado, o banner some da aba Vagas e ninguém
// consegue se inscrever — pensado pra ficar assim até uma API de
// WhatsApp Business/backend real estar configurada.
export function AlertBannerEditor({ config, setConfig }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
            <Bell className="h-4 w-4 text-emerald-600" /> Alerta de Vagas (WhatsApp)
          </h3>
          <p className="nv-body text-[12px] text-slate-500">
            Banner + inscrição por WhatsApp, exibidos logo abaixo dos filtros na aba Vagas.
          </p>
        </div>
        <button
          onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${
            config.enabled ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {config.enabled ? "✓ Função habilitada" : "Habilitar Função WhatsApp"}
        </button>
      </div>

      {!config.enabled && (
        <p className="nv-body mb-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          Desligada por padrão até você configurar o envio de verdade (API de WhatsApp/backend). Enquanto isso, o
          banner fica escondido pros visitantes.
        </p>
      )}

      <textarea
        value={config.text}
        onChange={(e) => setConfig((c) => ({ ...c, text: e.target.value }))}
        rows={2}
        className="nv-body w-full rounded-xl border border-slate-200 p-3 text-[13px] text-slate-700 outline-none focus:border-emerald-400"
      />

      <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-3">
        <p className="nv-body mb-2 text-[10px] font-semibold text-slate-400">Prévia</p>
        <AlertBanner config={config} onClick={() => {}} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Admin: Importação em lote (JSON do scraper)
--------------------------------------------------------------- */
