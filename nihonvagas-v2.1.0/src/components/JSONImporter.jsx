// ---------------------------------------------------------------
// JSONImporter — importação em lote do scraper, com deduplicação por
// url_original (ou impressão digital como plano B).
// ---------------------------------------------------------------

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { mapScrapedJob, jobFingerprint, uid } from "../utils/jobParsing.js";
import { insertJobsBulkToDB, updateJobInDB } from "../lib/supabase.js";

export default function JSONImporter({ dbStatus, jobs, onImported }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setImporting(true);
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
      // empresa+cargo+cidade+salário.
      const scrapedPool = jobs.filter((j) => j.lastSeenAt);
      const byUrl = new Map(scrapedPool.filter((j) => j.urlOriginal).map((j) => [j.urlOriginal, j]));
      const byFingerprint = new Map(scrapedPool.map((j) => [jobFingerprint(j), j]));

      const toInsert = [];
      const toUpdate = []; // { id, patch }
      mapped.forEach((nj) => {
        const existing = (nj.urlOriginal && byUrl.get(nj.urlOriginal)) || byFingerprint.get(jobFingerprint(nj));
        if (existing) {
          // Já existia — atualiza os dados (pode ter mudado salário/
          // descrição) e marca "visto agora", sem trocar o ID nem
          // mexer em selos/cliques/favoritos que a vaga já tinha.
          toUpdate.push({ id: existing.id, patch: { ...nj, id: undefined, arquivada: false } });
        } else {
          toInsert.push(nj);
        }
      });

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
    } catch (err) {
      console.error(err);
      setError(err.message || "Não foi possível importar o arquivo.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
        <Upload className="h-4 w-4 text-blue-600" /> Importação em lote (JSON do scraper)
      </h3>
      <p className="nv-body mb-4 text-[12px] text-slate-500">
        Envie o arquivo .json gerado pelo scraper desktop para publicar várias vagas de uma vez, direto na tabela <code className="rounded bg-slate-100 px-1 py-0.5">vagas</code>.
      </p>

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 py-8 text-center hover:border-blue-400"
      >
        {importing ? (
          <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-500" />
        ) : (
          <Upload className="mb-2 h-6 w-6 text-slate-400" />
        )}
        <p className="nv-body text-[12px] font-medium text-slate-500">
          {importing ? "Importando vagas..." : "Tocar para enviar o arquivo .json"}
        </p>
        <p className="nv-body text-[11px] text-slate-400">Array de vagas no formato do scraper (empresa, cargo, salario_hora, tags...).</p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

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
