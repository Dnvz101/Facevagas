// ---------------------------------------------------------------
// AIPublisher (Publicador Mágico) — extração de vaga por IA a partir
// de print/texto colado, com parser local como rede de segurança.
// A chamada de IA foi ajustada pra passar pelo proxy de servidor
// (/api/anthropic) em vez de bater direto na Anthropic — no artifact
// original a chave era injetada de forma invisível pelo próprio
// ambiente do Claude; fora dali isso não existe, então o proxy
// substitui esse comportamento escondendo a chave no servidor.
// ---------------------------------------------------------------

import { useState, useRef, useCallback, useEffect } from "react";
import { Sparkles, UploadCloud, ClipboardPaste, Loader2, AlertCircle, Info, Lock, Eye, CheckCircle2 } from "lucide-react";
import JobCard from "./JobCard.jsx";
import { DESCRIPTION_MAX_CHARS, clampDescription, parseSalaryRange, reconcileSalary, extractJobFromText, TOP_SALARIO_THRESHOLD, isTopSalarioRule } from "../utils/jobParsing.js";
import { formatYen } from "../utils/format.js";
import { BADGE_DEFS } from "../config/badgeDefs.js";
import { QUOTA_BADGE_MAP, QUOTA_USAGE_KEY_MAP } from "../hooks/usePermissions.js";

export const emptyForm = {
  empresa: "", cargo: "", cidade: "", provincia: "", salarioHora: "", salarioMax: "", turno: "",
  nihongo: "", moradia: "", vagaHomens: "Sim", vagaMulheres: "Sim", conducao: "",
  tags: "", telefone: "", whatsapp: "", descricao: "",
  isRecomendado: false, isUrgente: false, isFixado: false,
  // Idade máxima — igual ao scraper: só preenche quando o anúncio/quem
  // indicou mencionou idade de verdade. "semLimiteIdade" marcado vira
  // 999 na publicação (ver handlePublish); vazio + desmarcado = null
  // (nunca vira "sem limite" por omissão).
  idadeMaxima: "", semLimiteIdade: false,
};

const EXTRACTION_PROMPT = `Você é um assistente de extração de dados para um portal de vagas de emprego no Japão.
Analise SOMENTE o conteúdo real fornecido (imagem de um print de anúncio de vaga e/ou texto colado) e extraia os dados encontrados.

Regras estritas:
- NUNCA invente, deduza ou complete informação que não esteja explicitamente visível no conteúdo fornecido.
- Se um campo não aparecer no conteúdo, retorne uma string vazia "" para ele.
- Responda ESTRITAMENTE em JSON puro, sem markdown, sem texto antes ou depois, sem crases.

Formato exato esperado:
{"empresa":"","cargo":"","cidade":"","provincia":"","salarioHora":"","turno":"","nihongo":"","moradia":"","vagaHomens":"","vagaMulheres":"","conducao":"","tags":"","telefone":"","whatsapp":"","descricao":"","idadeMaxima":""}

"salarioHora" deve conter APENAS dígitos, sem símbolo ¥ e sem separador de milhar (ex: "1500").
"vagaHomens" e "vagaMulheres" devem ser exatamente "Sim" ou "Não".
"tags" deve ser uma lista curta separada por vírgula com as palavras-chave mais relevantes do anúncio.
"descricao" deve ser um RESUMO CURTO e fiel, em português, do texto do anúncio (funções, requisitos e condições principais).
Regra de tamanho obrigatória: no MÁXIMO 220 caracteres (aproximadamente 2 a 3 frases curtas). Priorize as informações mais importantes e corte o resto — não ultrapasse o limite, e não adicione nada que não esteja no conteúdo original.
"idadeMaxima" — SÓ preencha quando o anúncio mencionar idade explicitamente (nunca deduza pela ausência de menção):
  - Se o anúncio disser um limite claro tipo "até 55 anos" ou "no máximo 50 anos", retorne APENAS o número (ex: "55").
  - Se o anúncio disser que aceita a partir de/acima de/mais de uma certa idade, usar "~NN anos", ou disser explicitamente "sem limite de idade" / "qualquer idade" — todos esses casos sinalizam que aceita gente mais velha SEM teto, então retorne a string exata "sem limite".
  - Se o anúncio não mencionar idade de jeito nenhum, retorne "".`;

export default function AIPublisher({ onPublish, currentPlan, planKey, canUseBadge, quotaUsage, prefill = {}, lockedFields = [], autoNovo = false }) {
  const [pastedText, setPastedText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => ({ ...emptyForm, ...prefill }));
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null); // aviso neutro (extração parcial) — diferente do error (falha total)
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const dropRef = useRef(null);
  const fileRef = useRef(null);
  const [clipboardError, setClipboardError] = useState(null);
  const [clipboardBusy, setClipboardBusy] = useState(false);

  // Refs de cada input do formulário (registradas pelo helper field()),
  // usadas pra rolar/focar automaticamente até o primeiro campo
  // obrigatório vazio quando a validação do publish falha.
  const fieldRefs = useRef({});
  const [validationErrors, setValidationErrors] = useState({}); // { [key]: true }
  const [publishError, setPublishError] = useState(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  // Botão "Colar da área de transferência" — pensado pro celular, onde
  // Ctrl+V não existe. Usa a Clipboard API assíncrona (navigator.clipboard.read),
  // suportada no Chrome Android e no Safari iOS 15+ (dentro de um gesto do
  // usuário, por isso só roda a partir de um clique direto no botão).
  const handlePasteFromClipboard = useCallback(async () => {
    setClipboardError(null);
    if (!navigator.clipboard?.read) {
      setClipboardError("Esse navegador não permite colar imagem por botão. Copie o print e tente Ctrl+V, ou use o seletor de arquivo acima.");
      return;
    }
    setClipboardBusy(true);
    try {
      const clipboardItems = await navigator.clipboard.read();
      let found = false;
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          handleFile(blob);
          found = true;
          break;
        }
      }
      if (!found) {
        setClipboardError("Não encontrei nenhuma imagem copiada. Copie o print da vaga primeiro.");
      }
    } catch (err) {
      setClipboardError("Não consegui acessar a área de transferência (permissão negada ou nada copiado). Use o seletor de arquivo acima.");
    } finally {
      setClipboardBusy(false);
    }
  }, [handleFile]);

  useEffect(() => {
    const node = dropRef.current;
    if (!node) return;
    const handlePaste = (e) => {
      const items = e.clipboardData?.items || [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          handleFile(item.getAsFile());
          return;
        }
      }
    };
    node.addEventListener("paste", handlePaste);
    return () => node.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  const runExtraction = async () => {
    if (!imagePreview && !pastedText.trim()) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    // Extração local (regex/heurísticas) roda sempre que há texto colado
    // — serve tanto de COMPLEMENTO (preenche o que a IA deixar vazio)
    // quanto de REDE DE SEGURANÇA (se a chamada à IA falhar de vez).
    const localExtraction = extractJobFromText(pastedText);

    try {
      const content = [];

      if (imagePreview) {
        const match = imagePreview.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
        if (match) {
          content.push({
            type: "image",
            source: { type: "base64", media_type: match[1], data: match[2] },
          });
        }
      }

      content.push({
        type: "text",
        text: pastedText.trim()
          ? `Texto colado junto com o anúncio:\n"""${pastedText.trim()}"""`
          : "Extraia os dados da imagem do anúncio de vaga enviada.",
      });

      // Chama nosso próprio proxy de servidor (api/anthropic.js), não a
      // Anthropic direto — é lá que a chave de verdade fica escondida.
      const response = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 1000,
          system: EXTRACTION_PROMPT,
          messages: [{ role: "user", content }],
        }),
      });

      if (!response.ok) throw new Error(`Falha na API (${response.status})`);

      const data = await response.json();
      const textBlock = (data.content || []).find((b) => b.type === "text");
      if (!textBlock) throw new Error("A IA não retornou texto.");

      const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      // Reconcilia o salário que a IA extraiu com o texto-fonte: se o
      // valor não é plausível como salário POR HORA (ex: a IA confundiu
      // um prêmio de ¥1.200.000 com salário), ele vira bônus/incentivo
      // em vez de ir pro campo de salário.
      const sourceTextForSalary = [pastedText, parsed.descricao].filter(Boolean).join("\n");
      const { salarioHora: reconciledSalario, salarioMax: reconciledMax, extraBonuses } = reconcileSalary(parsed.salarioHora, sourceTextForSalary);
      const mergedTags = [parsed.tags, extraBonuses.join(", "), localExtraction.tags]
        .filter(Boolean)
        .join(", ");

      setForm((prev) => {
        const extracted = {
          // Cada campo: prioriza o que a IA achou; se a IA deixou vazio,
          // completa com o que o parser local conseguiu — nunca deixa de
          // preencher um campo só porque UM dos dois métodos falhou nele.
          empresa: parsed.empresa || localExtraction.empresa || "",
          cargo: parsed.cargo || localExtraction.cargo || "",
          cidade: parsed.cidade || localExtraction.cidade || "",
          provincia: parsed.provincia || localExtraction.provincia || "",
          salarioHora: reconciledSalario || localExtraction.salarioHora || "",
          salarioMax: reconciledMax ? String(reconciledMax) : localExtraction.salarioMax || "",
          turno: parsed.turno || localExtraction.turno || "",
          nihongo: parsed.nihongo || localExtraction.nihongo || "",
          moradia: parsed.moradia || localExtraction.moradia || "",
          vagaHomens: parsed.vagaHomens === "Não" ? "Não" : "Sim",
          vagaMulheres: parsed.vagaMulheres === "Não" ? "Não" : "Sim",
          conducao: parsed.conducao || localExtraction.conducao || "",
          tags: mergedTags,
          // Se a IA não achou telefone/whatsapp no anúncio, cai pro
          // contato oficial já cadastrado da empresa logada (prefill) —
          // em vez de deixar o campo vazio.
          telefone: parsed.telefone || prefill.telefone || localExtraction.telefone || "",
          whatsapp: parsed.whatsapp || prefill.whatsapp || "",
          descricao: clampDescription(parsed.descricao || localExtraction.descricao || ""),
        };
        // Idade máxima — prioriza o que a IA achou (string "NN", "sem
        // limite" ou ""); se a IA não achou nada, cai pro fallback local
        // (extractJobFromText já devolve número ou undefined). Nunca
        // sobrescreve um valor que a pessoa já tinha digitado à mão se
        // nem a IA nem o parser local encontraram nada dessa vez.
        const idadeIA = String(parsed.idadeMaxima || "").trim().toLowerCase();
        if (idadeIA === "sem limite") {
          extracted.semLimiteIdade = true;
          extracted.idadeMaxima = "";
        } else if (/^\d{2,3}$/.test(idadeIA)) {
          extracted.semLimiteIdade = false;
          extracted.idadeMaxima = idadeIA;
        } else if (localExtraction.idadeMaxima != null) {
          if (localExtraction.idadeMaxima >= 999) {
            extracted.semLimiteIdade = true;
            extracted.idadeMaxima = "";
          } else {
            extracted.semLimiteIdade = false;
            extracted.idadeMaxima = String(localExtraction.idadeMaxima);
          }
        }
        // Campos travados (ex: "empresa" da conta logada) NUNCA são
        // sobrescritos pela extração, mesmo que a IA tenha lido um nome
        // diferente no anúncio (o scraper às vezes captura quem postou,
        // não a empresa oficial) — o valor certo é sempre o do prefill.
        for (const key of lockedFields) {
          if (key in prev) extracted[key] = prev[key];
        }
        return { ...prev, ...extracted };
      });
    } catch (err) {
      console.error(err);
      // A IA falhou (rede caiu, API fora do ar, JSON malformado...) — mas
      // isso não pode travar a tela. Se o parser local conseguiu extrair
      // ALGO do texto colado, preenche com isso e avisa num tom neutro;
      // só mostra o erro vermelho quando não sobrou absolutamente nada
      // pra preencher (nem imagem processável, nem texto aproveitável).
      const hasLocalData = Object.keys(localExtraction).length > 0;
      if (hasLocalData) {
        setForm((prev) => {
          const extracted = { ...localExtraction };
          // Mesma conversão número->campo do caminho principal: o fallback
          // local devolve idadeMaxima como número (ou 999 = sem limite),
          // mas o formulário guarda string + checkbox separados.
          if (extracted.idadeMaxima != null) {
            if (extracted.idadeMaxima >= 999) {
              extracted.semLimiteIdade = true;
              extracted.idadeMaxima = "";
            } else {
              extracted.idadeMaxima = String(extracted.idadeMaxima);
            }
          }
          for (const key of lockedFields) {
            if (key in prev) extracted[key] = prev[key];
          }
          return { ...prev, ...extracted };
        });
        setNotice("A IA não respondeu, mas consegui extrair parte dos dados direto do texto colado — revise e complete o que faltar.");
      } else {
        setError("Não foi possível extrair os dados automaticamente. Preencha o formulário manualmente ou tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // parseSalaryRange como rede de segurança final: mesmo que alguém
  // digite uma faixa direto no campo "Salário por hora" (em vez de vir
  // da extração), nunca gruda os dois números — sempre separa min/max.
  const { salarioHora: salarioHoraFromField, salarioMax: salarioMaxFromField } = parseSalaryRange(form.salarioHora);
  const salarioHoraNum = salarioHoraFromField;
  const salarioMaxNum = salarioMaxFromField || (parseInt(String(form.salarioMax || "").replace(/\D/g, ""), 10) || 0) || null;

  // Campos obrigatórios pra publicar — usados tanto na validação quanto
  // na mensagem de erro (o rótulo aqui é o que aparece pro usuário).
  const REQUIRED_FIELDS = [
    { key: "empresa", label: "Empresa" },
    { key: "cargo", label: "Cargo" },
    { key: "salarioHora", label: "Salário por hora" },
  ];

  const handlePublish = () => {
    const missing = REQUIRED_FIELDS.filter(({ key }) => !String(form[key] || "").trim());

    if (missing.length > 0) {
      setValidationErrors(Object.fromEntries(missing.map(({ key }) => [key, true])));
      setPublishError(`Preencha os campos obrigatórios: ${missing.map((m) => m.label).join(", ")}.`);
      setPublishSuccess(false);
      // Rola e foca no primeiro campo pendente, pra quem tocou "Publicar"
      // achar na hora o que falta, sem precisar caçar no formulário.
      const firstKey = missing[0].key;
      fieldRefs.current[firstKey]?.scrollIntoView({ behavior: "smooth", block: "center" });
      fieldRefs.current[firstKey]?.focus();
      return;
    }

    setValidationErrors({});
    setPublishError(null);

    // Selos que estourariam a cota do plano simulado nunca vão marcados —
    // dupla proteção além dos checkboxes já desabilitados na tela.
    const safeForm = { ...form };
    for (const key of Object.keys(QUOTA_BADGE_MAP)) {
      if (safeForm[key] && !canUseBadge(key)) safeForm[key] = false;
    }
    // Mesma regra do scraper: "sem limite" só quando marcado explicitamente
    // (999); número digitado vira o limite; campo vazio + desmarcado = null.
    const idadeMaximaNum = form.semLimiteIdade
      ? 999
      : (form.idadeMaxima.trim() ? parseInt(form.idadeMaxima, 10) || null : null);
    delete safeForm.idadeMaxima;
    delete safeForm.semLimiteIdade;
    onPublish({
      ...safeForm,
      salarioHora: salarioHoraNum,
      salarioMax: salarioMaxNum,
      idadeMaxima: idadeMaximaNum,
      vagaHomens: form.vagaHomens === "Sim",
      vagaMulheres: form.vagaMulheres === "Sim",
      descricao: clampDescription(form.descricao),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: "publicado",
      seloVerificado: !!currentPlan?.seloVerificado,
      isTopSalario: isTopSalarioRule(salarioMaxNum || salarioHoraNum), // automático, sem toggle manual
      // 🆕 Nova Vaga — só quando publicado pela própria empresa (Área do
      // Cliente); nunca quando o Admin usa o Publicador dele.
      isNovo: autoNovo,
    });
    setForm({ ...emptyForm, ...prefill });
    setImagePreview(null);
    setPastedText("");
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 3500);
  };

  // Objeto "vaga" só pra alimentar o card de preview ao vivo abaixo —
  // nunca é salvo, é só uma leitura direta do form atual a cada render.
  const previewJob = {
    id: "preview",
    empresa: form.empresa.trim() || "Nome da empresa",
    cargo: form.cargo.trim() || "Cargo da vaga",
    cidade: form.cidade,
    provincia: form.provincia,
    salarioHora: salarioHoraNum,
    salarioMax: salarioMaxNum,
    turno: form.turno,
    nihongo: form.nihongo,
    moradia: form.moradia,
    vagaHomens: form.vagaHomens === "Sim",
    vagaMulheres: form.vagaMulheres === "Sim",
    conducao: form.conducao,
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    telefone: form.telefone,
    whatsapp: form.whatsapp,
    descricao: form.descricao,
    idadeMaxima: form.semLimiteIdade ? 999 : (form.idadeMaxima.trim() ? parseInt(form.idadeMaxima, 10) || null : null),
    clicks: 0,
    isRecomendado: form.isRecomendado,
    isUrgente: form.isUrgente,
    isFixado: form.isFixado,
    seloVerificado: !!currentPlan?.seloVerificado,
  };
  const field = (label, key, placeholder = "") => {
    const locked = lockedFields.includes(key);
    const invalid = !!validationErrors[key];
    return (
      <div>
        <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">{label}</label>
        <input
          ref={(el) => { fieldRefs.current[key] = el; }}
          value={form[key]}
          placeholder={placeholder}
          disabled={locked}
          onChange={(e) => {
            setForm((f) => ({ ...f, [key]: e.target.value }));
            if (invalid) setValidationErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
          }}
          className={`nv-body w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-blue-400 ${
            locked
              ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-500"
              : invalid
              ? "border-rose-400 bg-rose-50 text-slate-800 focus:border-rose-500"
              : "border-slate-200 text-slate-800"
          }`}
        />
      </div>
    );
  };

  const selectYesNo = (label, key) => (
    <div>
      <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">{label}</label>
      <select
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
      >
        <option value="Sim">Sim</option>
        <option value="Não">Não</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <Sparkles className="h-4 w-4 text-blue-600" /> Publicador Mágico
        </h3>
        <p className="nv-body mb-4 text-[12px] text-slate-500">Envie o print da vaga do Facebook e a IA preenche tudo.</p>

        <div
          ref={dropRef}
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 py-8 text-center outline-none hover:border-blue-400 focus:border-blue-400"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="print" className="max-h-40 rounded-lg object-contain" />
          ) : (
            <>
              <UploadCloud className="mb-2 h-6 w-6 text-slate-400" />
              <p className="nv-body text-[13px] font-medium text-slate-600">Tocar para enviar o print da vaga</p>
              <p className="nv-body text-[11px] text-slate-400">PNG ou JPG — ou cole a imagem com Ctrl + V</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

        <button
          type="button"
          onClick={handlePasteFromClipboard}
          disabled={clipboardBusy}
          className="nv-body mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          {clipboardBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardPaste className="h-3.5 w-3.5" />}
          {clipboardBusy ? "Colando..." : "Colar da área de transferência"}
        </button>
        {clipboardError && (
          <p className="nv-body mt-1.5 text-[11px] text-amber-600">{clipboardError}</p>
        )}

        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          rows={3}
          placeholder="...cole aqui o texto da vaga (ou Ctrl + V da imagem)"
          className="nv-body mt-3 w-full rounded-xl border border-slate-200 p-3 text-[13px] text-slate-700 outline-none focus:border-blue-400"
        />

        <button
          onClick={runExtraction}
          disabled={loading || (!imagePreview && !pastedText.trim())}
          className="nv-body mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Lendo o print..." : "Extrair com IA"}
        </button>

        {error && (
          <p className="nv-body mt-2 flex items-center gap-1.5 text-[12px] font-medium text-rose-600">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
          </p>
        )}
        {notice && (
          <p className="nv-body mt-2 flex items-center gap-1.5 text-[12px] font-medium text-blue-600">
            <Info className="h-3.5 w-3.5 flex-shrink-0" /> {notice}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="nv-display text-[15px] font-bold text-slate-900">Revisão da vaga</h3>
        <p className="nv-body mb-4 text-[12px] text-slate-500">Confira e ajuste antes de publicar.</p>

        <div className="grid grid-cols-2 gap-3">
          {field("Empresa", "empresa")}
          {field("Cargo", "cargo")}
          {field("Cidade", "cidade")}
          {field("Província", "provincia")}
          {field("Salário por hora (¥)", "salarioHora", "1500")}
          {field("Turno", "turno")}
          {field("Nihongo", "nihongo")}
          {field("Moradia", "moradia")}
          {selectYesNo("Vaga homens", "vagaHomens")}
          {selectYesNo("Vaga mulheres", "vagaMulheres")}
          {field("Condução", "conducao")}
          {field("Tags (vírgula)", "tags")}
          {field("Telefone", "telefone")}
          {field("WhatsApp", "whatsapp")}
        </div>

        {/* Idade máxima — mesma regra do scraper: só preenche quando o
            anúncio/indicação menciona idade de verdade, nunca "sem
            limite" por omissão. Alimenta o verso do JobCard e, quando
            alta ou "sem limite", faz a vaga entrar sozinha na aba
            Indicações (55+). */}
        <div className="mt-3 flex items-end gap-3">
          <div className="flex-1">
            <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">Idade máxima (se mencionada)</label>
            <input
              value={form.idadeMaxima}
              disabled={form.semLimiteIdade}
              placeholder="Ex: 55"
              onChange={(e) => setForm((f) => ({ ...f, idadeMaxima: e.target.value.replace(/\D/g, "") }))}
              className={`nv-body w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-blue-400 ${
                form.semLimiteIdade ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400" : "border-slate-200 text-slate-800"
              }`}
            />
          </div>
          <label className="mb-2 flex flex-shrink-0 items-center gap-1.5 text-[12px] font-medium text-slate-600">
            <input
              type="checkbox"
              checked={form.semLimiteIdade}
              onChange={(e) => setForm((f) => ({ ...f, semLimiteIdade: e.target.checked, idadeMaxima: e.target.checked ? "" : f.idadeMaxima }))}
              className="h-4 w-4 flex-shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
            />
            Sem limite de idade
          </label>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <label className="nv-body text-[11px] font-semibold text-blue-600">Descrição / requisitos</label>
            <span className={`nv-body text-[11px] font-medium ${form.descricao.length > DESCRIPTION_MAX_CHARS ? "text-rose-500" : "text-slate-400"}`}>
              {form.descricao.length}/{DESCRIPTION_MAX_CHARS}
            </span>
          </div>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            rows={3}
            className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400"
          />
          <p className="nv-body mt-1 text-[11px] text-slate-400">Textos maiores que {DESCRIPTION_MAX_CHARS} caracteres são resumidos automaticamente ao publicar.</p>
        </div>

        <div className="mt-3">
          <label className="nv-body mb-1.5 block text-[11px] font-semibold text-blue-600">Selos da vaga</label>
          <div className="grid grid-cols-2 gap-2">
            {BADGE_DEFS.map(({ key, label, emoji }) => {
              const isQuotaBadge = key in QUOTA_BADGE_MAP;
              const blocked = isQuotaBadge && !form[key] && !canUseBadge(key);

              // Saldo desse selo no plano ativo (só selos com cota — os
              // demais, tipo isTopSalario, nem entram no BADGE_DEFS).
              let quotaLabel = null;
              if (isQuotaBadge && currentPlan) {
                const total = currentPlan[QUOTA_BADGE_MAP[key]] ?? 0;
                const used = quotaUsage?.[QUOTA_USAGE_KEY_MAP[key]] ?? 0;
                const restante = total - used;
                quotaLabel = total >= 999 ? "(Ilimitado)" : restante > 0 ? `(${restante} disp.)` : "(Esgotado)";
              }

              return (
                <label
                  key={key}
                  title={blocked ? "Cota do plano atual esgotada para este selo" : undefined}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium ${
                    blocked ? "border-slate-100 bg-slate-50 text-slate-400" : "border-slate-200 text-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    disabled={blocked}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-400 disabled:opacity-50"
                  />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="flex items-center gap-1">
                      {emoji} {label} {blocked && <Lock className="h-3 w-3 flex-shrink-0" />}
                    </span>
                    {quotaLabel && (
                      <span
                        className={`text-[10px] font-normal ${
                          blocked ? "text-rose-400" : form[key] ? "text-blue-500" : "text-slate-400"
                        }`}
                      >
                        {quotaLabel}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          <p className="nv-body mt-1.5 text-[11px] text-slate-400">
            💎 Top Salário não é manual — entra sozinho quando o salário por hora é ¥{formatYen(TOP_SALARIO_THRESHOLD)} ou mais.
          </p>
          <p className="nv-body mt-1 text-[11px] text-slate-400">
            🔥 Vagas em Destaque aparecem sempre na primeira página, nas primeiras posições. Entre elas, a ordem é randômica a cada visita — justo pra todos os anunciantes, sem favorecer quem foi marcado primeiro.
          </p>
        </div>

        {/* PREVIEW EM TEMPO REAL — mesmo componente JobCard usado no feed
            público, alimentado direto pelo form. Atualiza a cada tecla/
            toggle, sem precisar publicar pra ver o resultado.
            -mx-5 cancela o p-5 do card "Revisão da vaga" (pai direto) pra
            o card de preview ocupar a MESMA largura que ele tem no feed
            real — senão ficava mais estreito por causa do padding duplo
            (o do card pai + o do wrapper cinza aqui). */}
        <div className="-mx-5 mt-4">
          <div className="mb-1.5 flex items-center justify-between px-5">
            <label className="nv-body flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
              <Eye className="h-3.5 w-3.5" /> Pré-visualização em tempo real
            </label>
            <button
              type="button"
              onClick={() => setPreviewFlipped((f) => !f)}
              className="nv-body text-[11px] font-medium text-blue-500 hover:text-blue-700"
            >
              {previewFlipped ? "Ver frente" : "Ver verso"}
            </button>
          </div>
          <div className="bg-slate-50 px-5 py-4">
            <JobCard
              job={previewJob}
              isFlipped={previewFlipped}
              onToggleFlip={() => setPreviewFlipped((f) => !f)}
              onContact={() => {}}
              isTop={previewJob.isFixado}
            />
          </div>
        </div>

        <button
          onClick={handlePublish}
          className="nv-body mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4" /> Publicar vaga
        </button>

        {publishError && (
          <p className="nv-body mt-2 flex items-center gap-1.5 text-[12px] font-medium text-rose-600">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {publishError}
          </p>
        )}
        {publishSuccess && (
          <p className="nv-body mt-2 flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> Vaga publicada com sucesso!
          </p>
        )}
      </div>
    </div>
  );
}
