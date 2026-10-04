// ---------------------------------------------------------------
// Utilitários diversos — datas, YouTube, ícone do PWA (canvas),
// filtros de vaga (mukae/moradia), embaralhamento, redimensionamento
// de imagem do banner.
// ---------------------------------------------------------------

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Extrai o ID de vídeo de qualquer formato de link do YouTube que a
// pessoa colar (watch?v=, youtu.be/, /shorts/, /embed/, ou já o ID puro).
export function extractYoutubeId(input) {
  const raw = (input || "").trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw; // já é só o ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (m) return m[1];
  }
  return null;
}

// Soma +1 num campo ("views" ou "clicks") do dia de hoje dentro do
// histórico da vaga — sem apagar os dias anteriores.
export function bumpDailyStat(dailyStats, field) {
  const key = localDateKey();
  const current = dailyStats?.[key] || { views: 0, clicks: 0 };
  return { ...(dailyStats || {}), [key]: { ...current, [field]: (current[field] || 0) + 1 } };
}

/* ---------------------------------------------------------------
   PWA — ícone gerado por canvas (sem depender de nenhum arquivo de
   imagem externo). Desenha um "NV" em degradê azul, do jeito da marca,
   e devolve um data URL PNG. Usado tanto no manifest injetado quanto
   no apple-touch-icon (iOS não lê manifest, precisa do link direto).
--------------------------------------------------------------- */
export function generateAppIcon(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#2563eb");
  grad.addColorStop(1, "#4f46e5");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(size * 0.48)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("NV", size / 2, size / 2 + size * 0.03);
  return canvas.toDataURL("image/png");
}

export function hasMukae(job) {
  if (job.conducao === "Não necessária") return true;
  return (job.tags || []).some((t) => /transporte|mukae|busca|van/i.test(t));
}

// "Moradia oferecida" = qualquer valor preenchido que não seja
// explicitamente "não incluída/não oferece" — cobre "Apartamento
// fornecido", "Dormitório disponível" e variações digitadas à mão.
export function hasMoradia(job) {
  const m = (job.moradia || "").trim();
  if (!m) return false;
  return !/n[ãa]o\s*(inclu|oferec|dispon)/i.test(m);
}


export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


export const BANNER_MAX_WIDTH = 1440;
export const BANNER_MAX_HEIGHT = 576;

export function resizeImageFile(file, maxWidth = BANNER_MAX_WIDTH, maxHeight = BANNER_MAX_HEIGHT) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
      img.onload = () => {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Tamanho recomendado pro "fundo do card" da Página Exclusiva — cabe
// bem tanto no card comprido do celular quanto no mais largo do
// desktop, e é a mesma proporção de imagem de compartilhamento de
// link (1200x628), que a maioria das ferramentas de design já conhece
// de cabeça.
export const CARD_BG_MAX_WIDTH = 1200;
export const CARD_BG_MAX_HEIGHT = 628;


// Minúsculo + sem acento (NFD, remove diacríticos) — pra comparar
// texto de um jeito que "publicação" bate com "publicacao" digitado
// sem cedilha/til. Já existia essa mesma conta feita solta em 3
// lugares (jobFingerprint, gerarSlugUnico, RelatorioEmpresaAvulsa) —
// juntei aqui, único lugar de verdade, depois do mesmo problema já ter
// acontecido com telefone (toIntlPhoneDigits, v2.6.42): um desses
// lugares nunca ter a correção quando alguém mexe só num deles.
export function normalizeText(s) {
  return (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Gera a URL da Página Exclusiva a partir do nome da empresa —
// minúsculo, sem acento, espaço vira hífen. Se colidir com o slug de
// outra empresa (nome igual ou muito parecido), completa com um
// pedaço do id dela — só nesse caso raro a URL fica menos bonita, mas
// nunca quebra nem sobrescreve o link de quem já tinha.
export function gerarSlugUnico(nome, idAtual, parceirosExistentes) {
  const base = normalizeText(nome)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "empresa";

  const emUsoPorOutraEmpresa = (slug) =>
    parceirosExistentes.some((p) => p.id !== idAtual && p.paginaExclusivaSlug === slug);

  if (!emUsoPorOutraEmpresa(base)) return base;
  return `${base}-${(idAtual || "").toString().slice(0, 4)}`;
}

// Empresa bloqueada? Compara sem acento/maiúscula e por PEDAÇO do nome
// ("fujiarte" pega "Fujiarte Co. Ltd" e "FUJIARTE"). Termo com menos de
// 3 letras é ignorado de propósito — "ab" bloquearia metade do site por
// acidente. Devolve o termo que bateu (pra mostrar no resumo) ou null.
export function matchBlockedCompany(empresa, blockedList) {
  const alvo = normalizeText(empresa);
  if (!alvo) return null;
  for (const termo of blockedList || []) {
    const t = normalizeText(termo);
    if (t.length >= 3 && alvo.includes(t)) return termo;
  }
  return null;
}
