// ---------------------------------------------------------------
// ClaimJobsModal — fluxo de reivindicação de vagas raspadas (busca →
// seleção → confirmação), usado dentro da Área do Cliente.
// ---------------------------------------------------------------

import { useState, useEffect } from "react";
import { Building2, X, Sparkles, CheckSquare, Loader2 } from "lucide-react";
import { safeCidade } from "../utils/jobParsing.js";

export default function ClaimJobsModal({ isOpen, onClose, jobs, companyName, companyPhone, registeredPartners = [], onConfirm }) {
  const [step, setStep] = useState("busca"); // "busca" | "selecao"
  const [searchTerm, setSearchTerm] = useState("");
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState(null);

  // Já sabemos o nome oficial — pré-preenche a busca com ele.
  useEffect(() => {
    if (isOpen) setSearchTerm(companyName || "");
  }, [isOpen, companyName]);

  const resetAll = () => {
    setStep("busca");
    setMatchedJobs([]);
    setSelectedIds(new Set());
    setClaiming(false);
    setClaimError(null);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleSearch = () => {
    const term = searchTerm.trim();
    if (!term) return;
    // Blindagem anti-sequestro: nomes de empresas que JÁ têm conta
    // registrada (exceto a própria empresa que está buscando) nunca
    // aparecem pra reivindicar — evita uma empresa "roubar" vagas que já
    // são de outra conta legítima.
    const claimedByOthers = new Set(
      registeredPartners.filter((p) => p.name !== companyName).map((p) => p.name)
    );
    const found = jobs.filter((j) => {
      if (!(j.empresa || "").toLowerCase().includes(term.toLowerCase())) return false;
      if (j.empresa === companyName) return false; // já é da própria empresa
      if (j.seloVerificado) return false; // empresa já verificada — protegida
      if (claimedByOthers.has(j.empresa)) return false; // já pertence a outra conta registrada
      return true;
    });
    setMatchedJobs(found);
    setSelectedIds(new Set(found.map((j) => j.id))); // tudo marcado por padrão
    setStep("selecao");
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === matchedJobs.length ? new Set() : new Set(matchedJobs.map((j) => j.id))));
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    setClaiming(true);
    setClaimError(null);
    try {
      await onConfirm([...selectedIds]);
      // Sucesso: fecha IMEDIATAMENTE. A notificação de sucesso é
      // responsabilidade de quem chamou (ClientDashboard), já que o
      // modal deixa de existir na tela assim que onClose() roda.
      resetAll();
      onClose();
    } catch (err) {
      console.error("Falha ao reivindicar vagas:", err);
      setClaiming(false);
      setClaimError("Não foi possível concluir a reivindicação. Tente novamente.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="nv-rise flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:max-w-md sm:rounded-3xl"
      >
        {/* Header fixo */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
            <h3 className="nv-display text-[15px] font-bold text-slate-900">Reivindicar Vagas da Minha Empresa</h3>
          </div>
          <button onClick={handleClose} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo (rola se precisar) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "busca" && (
            <div className="space-y-4">
              <p className="nv-body text-[13px] leading-relaxed text-slate-600">
                Vagas importadas do Facebook às vezes chegam com o nome de quem postou, não o nome oficial da empresa.
                Confira ou ajuste o termo abaixo pra encontrar as suas:
              </p>
              <div>
                <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">Buscar por nome</label>
                <input
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Ex: Fujiarte"
                  className="nv-body w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchTerm.trim()}
                className="nv-body flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Sparkles className="h-4 w-4" /> Buscar Vagas
              </button>
            </div>
          )}

          {step === "selecao" && (
            <div className="space-y-3">
              {matchedJobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                  <p className="nv-body text-[13px] text-slate-500">
                    Nenhuma vaga nova encontrada com "<span className="font-semibold text-slate-700">{searchTerm}</span>". Tente outro termo.
                  </p>
                  <button onClick={() => setStep("busca")} className="nv-body mt-3 text-[12px] font-semibold text-blue-600">
                    ← Tentar novamente
                  </button>
                </div>
              ) : (
                <>
                  <p className="nv-body text-[13px] leading-relaxed text-slate-600">
                    Encontramos <span className="font-bold text-slate-900">{matchedJobs.length}</span> vaga(s) associada(s) a "
                    <span className="font-bold text-slate-900">{searchTerm}</span>". Selecione as que pertencem à sua empresa para assumi-las:
                  </p>

                  <button onClick={toggleSelectAll} className="nv-body flex items-center gap-1.5 text-[12px] font-semibold text-blue-600">
                    <CheckSquare className="h-3.5 w-3.5" />
                    {selectedIds.size === matchedJobs.length ? "Desmarcar todas" : "Marcar todas"}
                  </button>

                  <div className="space-y-2">
                    {matchedJobs.map((j) => {
                      const checked = selectedIds.has(j.id);
                      const localLabel = [safeCidade(j.cidade), j.provincia].filter(Boolean).join(" · ");
                      return (
                        <label
                          key={j.id}
                          className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 transition-colors ${
                            checked ? "border-blue-300 bg-blue-50/60" : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelected(j.id)}
                            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                          />
                          <div className="min-w-0">
                            <p className="nv-display truncate text-[13px] font-bold text-slate-900">{j.cargo}</p>
                            {localLabel && <p className="nv-body text-[11px] text-slate-500">{localLabel}</p>}
                            <p className="nv-body mt-0.5 text-[11px] italic text-slate-400">Postado como: "{j.empresa}"</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {companyPhone && (
                    <p className="nv-body text-[11px] text-slate-400">
                      As vagas selecionadas passam a usar "{companyName}" e o WhatsApp {companyPhone} como contato.
                    </p>
                  )}
                  {claimError && <p className="nv-body text-[12px] font-medium text-rose-600">{claimError}</p>}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer fixo com as ações do passo atual */}
        {step === "selecao" && matchedJobs.length > 0 && (
          <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
            <button
              onClick={() => setStep("busca")}
              disabled={claiming}
              className="nv-body rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0 || claiming}
              className="nv-body flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
              Assumir {selectedIds.size} Vaga{selectedIds.size === 1 ? "" : "s"} Selecionada{selectedIds.size === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
