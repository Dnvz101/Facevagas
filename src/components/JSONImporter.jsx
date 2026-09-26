// ---------------------------------------------------------------
// JSONImporter — importação em lote do scraper, com deduplicação por
// url_original (ou impressão digital como plano B).
//
// v2: em vez de gravar direto no banco ao soltar o arquivo, agora
// mostra uma LISTA DE REVISÃO primeiro (cargo + salário de cada vaga,
// com checkbox) — a pessoa confere, desmarca o que não quiser, e só
// grava de verdade ao clicar em "Publicar". Vaga sem cargo ou com
// salário zerado/vazio ganha um aviso visual, pra não passar batido.
// ---------------------------------------------------------------

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Send } from "lucide-react";
import { mapScrapedJob, jobFingerprint, uid } from "../utils/jobParsing.js";
import { formatYen } from "../utils/format.js";
import { insertJobsBulkToDB, updateJobInDB } from "../lib/supabase.js";

export default function JSONImporter({ dbStatus, jobs, onImported }) {
  const [parsing, setParsing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState(null); // array de itens de revisão, ou null (mostra o dropzone)
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setParsing(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      let raw;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error("Arquivo inválido — não é um JSON válido.");
      }
      if (!Array.isArray(raw)) throw new Error("O arquivo precisa conter um array de vagas ( [ {...}, {...} ] ).");
      if (raw.length === 0) throw new Error("O arquivo está vazio.");

      const mapped = raw.map(mapScrapedJob);

      // Deduplicação: compara cada vaga nova contra as que já vieram do
      // scraper antes (têm lastSeenAt — nunca compara contra vaga
      // publicada por empresa ou reivindicada). Prioridade 1: mesma
      // url_original (praticamente infalível). Prioridade 2 (plano B,
      // só quando não tem URL): mesma impressão digital
      // empresa+cargo+cidade+salário. Isso só CLASSIFICA (nova vs.
      // atualização) pra mostrar na lista — ainda não grava nada.
      const scrapedPool = jobs.filter((j) => j.lastSeenAt);
      const byUrl = new Map(scrapedPool.filter((j) => j.urlOriginal).map((j) => [j.urlOriginal, j]));
      const byFingerprint = new Map(scrapedPool.map((j) => [jobFingerprint(j), j]));

      const items = mapped.map((nj) => {
        const existing = (nj.urlOriginal && byUrl.get(nj.urlOriginal)) || byFingerprint.get(jobFingerprint(nj));
        const semTitulo = !nj.cargo;
        const semSalario = !nj.salarioHora; // parseSalaryRange sempre devolve número — 0 quando não achou nenhum valor
        const semContato = !nj.whatsapp && !nj.telefone; // sem os dois, a vaga publicada não tem NENHUM botão de contato
        return {
          key: uid(),
          checked: !(semTitulo || semSalario || semContato), // sem título, sem salário ou sem contato já entra DESMARCADA — precisa decisão explícita de manter
          mapped: nj,
          isUpdate: !!existing,
          existingId: existing?.id || null,
          semTitulo,
          semSalario,
          semContato,
        };
      });

      setPreview(items);
    } catch (err) {
      console.error(err);
      setError(err.message || "Não foi possível ler o arquivo.");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleItem = (key) => {
    setPreview((prev) => prev.map((it) => (it.key === key ? { ...it, checked: !it.checked } : it)));
  };

  const toggleAll = (checked) => {
    setPreview((prev) => prev.map((it) => ({ ...it, checked })));
  };

  const cancelar = () => {
    setPreview(null);
    setError(null);
  };

  const publicar = async () => {
    const selecionadas = preview.filter((it) => it.checked);
    if (selecionadas.length === 0) return;
    setPublishing(true);
    setError(null);
    try {
      const toInsert = selecionadas.filter((it) => !it.isUpdate).map((it) => it.mapped);
      const toUpdate = selecionadas.filter((it) => it.isUpdate).map((it) => ({ id: it.existingId, patch: { ...it.mapped, id: undefined, arquivada: false } }));

      if (dbStatus === "connected") {
        const insertedSaved = toInsert.length ? await insertJobsBulkToDB(toInsert) : [];
        await Promise.all(toUpdate.map((u) => updateJobInDB(u.id, u.patch)));
        onImported({ inserted: insertedSaved, updated: toUpdate });
        setResult({ inserted: insertedSaved.length, updated: toUpdate.length, mode: "supabase" });
      } else {
        const insertedWithIds = toInsert.map((j) => ({ ...j, id: uid() }));
        onImported({ inserted: insertedWithIds, updated: toUpdate });
        setResult({ inserted: insertedWithIds.length, updated: toUpdate.length, mode: "local" });
      }
      setPreview(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Não foi possível publicar as vagas selecionadas.");
    } finally {
      setPublishing(false);
    }
  };

  const totalSelecionadas = preview ? preview.filter((it) => it.checked).length : 0;
  const totalAvisos = preview ? preview.filter((it) => it.semTitulo || it.semSalario || it.semContato).length : 0;
  const todasMarcadas = preview ? preview.every((it) => it.checked) : false;
  // Novas x atualização entre as SELECIONADAS — é o que vai acontecer
  // de verdade se clicar em Publicar agora, não a lista toda.
  const totalNovasSelecionadas = preview ? preview.filter((it) => it.checked && !it.isUpdate).length : 0;
  const totalAtualizacoesSelecionadas = preview ? preview.filter((it) => it.checked && it.isUpdate).length : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
        <Upload className="h-4 w-4 text-blue-600" /> Importação em lote (JSON do scraper)
      </h3>
      <p className="nv-body mb-4 text-[12px] text-slate-500">
        Envie o arquivo .json gerado pelo scraper desktop — antes de publicar, você confere a lista e escolhe quais entram.
      </p>

      {!preview && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 py-8 text-center hover:border-blue-400"
        >
          {parsing ? (
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-500" />
          ) : (
            <Upload className="mb-2 h-6 w-6 text-slate-400" />
          )}
          <p className="nv-body text-[12px] font-medium text-slate-500">
            {parsing ? "Lendo o arquivo..." : "Tocar para enviar o arquivo .json"}
          </p>
          <p className="nv-body text-[11px] text-slate-400">Array de vagas no formato do scraper (empresa, cargo, salario_hora, tags...).</p>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      )}

      {/* Lista de revisão — só aparece depois que o arquivo já foi lido */}
      {preview && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="nv-body flex items-center gap-2 text-[12px] font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={todasMarcadas}
                onChange={(e) => toggleAll(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
              />
              {preview.length} vaga{preview.length === 1 ? "" : "s"} no arquivo · {totalSelecionadas} selecionada{totalSelecionadas === 1 ? "" : "s"}
              {totalSelecionadas > 0 && (
                <span className="font-normal text-slate-400">
                  {" "}({totalNovasSelecionadas} nova{totalNovasSelecionadas === 1 ? "" : "s"} · {totalAtualizacoesSelecionadas} atualiza{totalAtualizacoesSelecionadas === 1 ? "ção" : "ções"})
                </span>
              )}
            </label>
            <button onClick={cancelar} className="nv-body text-[11.5px] font-semibold text-slate-400 hover:text-slate-600">
              Cancelar
            </button>
          </div>

          {totalAvisos > 0 && (
            <p className="nv-body mb-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] font-medium text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {totalAvisos} vaga{totalAvisos === 1 ? "" : "s"} sem título, sem salário e/ou sem contato (WhatsApp/telefone) — já entraram desmarcadas, marque de volta se quiser publicar mesmo assim.
            </p>
          )}

          <div className="max-h-[340px] overflow-y-auto rounded-xl border border-slate-200">
            {preview.map((it) => {
              const temAviso = it.semTitulo || it.semSalario || it.semContato;
              return (
                <label
                  key={it.key}
                  className={`flex cursor-pointer items-start gap-2.5 border-b border-slate-100 px-3 py-2.5 last:border-b-0 ${
                    temAviso ? "bg-amber-50/60" : it.checked ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={it.checked}
                    onChange={() => toggleItem(it.key)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                  <div className={`min-w-0 flex-1 ${it.checked ? "" : "opacity-40"}`}>
                    <p className="nv-body truncate text-[12.5px] font-semibold text-slate-800">
                      {it.mapped.cargo || <span className="italic text-amber-600">Sem título</span>}
                      {it.isUpdate && <span className="ml-1.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-blue-600">Atualização</span>}
                    </p>
                    <p className="nv-body truncate text-[11px] text-slate-400">
                      {it.mapped.empresa || "Empresa não identificada"}
                      {it.mapped.cidade ? ` · ${it.mapped.cidade}` : ""}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {it.semSalario ? (
                      <span className="nv-body inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-600">
                        <AlertTriangle className="h-3 w-3" /> Sem salário
                      </span>
                    ) : (
                      <span className="nv-body text-[12.5px] font-bold text-slate-800">
                        ¥{formatYen(it.mapped.salarioHora)}{it.mapped.salarioMax ? `–${formatYen(it.mapped.salarioMax)}` : ""}/h
                      </span>
                    )}
                    {it.semContato && (
                      <span className="nv-body mt-0.5 flex items-center justify-end gap-1 text-[10px] font-bold text-amber-600">
                        <AlertTriangle className="h-2.5 w-2.5" /> Sem contato
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <button
            onClick={publicar}
            disabled={publishing || totalSelecionadas === 0}
            className="nv-body mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[13.5px] font-bold text-white disabled:opacity-40"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {publishing ? "Publicando..." : `Publicar ${totalSelecionadas} vaga${totalSelecionadas === 1 ? "" : "s"} selecionada${totalSelecionadas === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {result && (
        <p className="nv-body mt-3 flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {result.inserted} vaga(s) nova(s), {result.updated} atualizada(s) (já existiam — só refrescou o dado){result.mode === "local" ? " (salvas só localmente — armazenamento não conectado)" : ""}.
        </p>
      )}
      {error && (
        <p className="nv-body mt-3 flex items-center gap-1.5 text-[12px] font-medium text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
