// ---------------------------------------------------------------
// RelatorioDesempenho — Admin: gera um relatório visual (imagem PNG)
// do desempenho de UM parceiro específico, pra mandar por WhatsApp.
//
// Fluxo: abre já mostrando a PRÉ-VISUALIZAÇÃO (o próprio card, renderizado
// na tela) — só quando o Admin clica em "Baixar imagem" que o
// html2canvas tira o "print" de verdade e gera o PNG. Isso significa
// que o que você vê aqui é exatamente o que vai ser baixado.
//
// Todo número aqui é DADO REAL, calculado a partir de job.dailyStats
// (histórico diário {"YYYY-MM-DD": {views, clicks}}) — nada é
// inventado nem estimado. Onde a amostra é pequena demais pra uma
// comparação de selo fazer sentido (MIN_SAMPLE), a linha some sozinha
// em vez de mostrar um "10x mais" bobo tirado de 1 vaga só.
// ---------------------------------------------------------------

import { useRef, useState, useMemo } from "react";
import html2canvas from "html2canvas";
import { X, Download, Eye, MessageCircle, FolderOpen, TrendingUp, Loader2, Link2 } from "lucide-react";
import { toIntlPhoneDigits } from "../utils/format.js";

const MIN_SAMPLE = 3; // mínimo de vagas em cada grupo (com/sem selo) pra comparação aparecer

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const fmtData = (d) => `${d.getDate()} de ${MESES[d.getMonth()]}`;
const ymd = (d) => d.toISOString().slice(0, 10);

// Soma views/clicks de dailyStats de uma lista de vagas, só nas datas
// dentro de [inicio, fim] (inclusive nos dois lados).
function somaPeriodo(vagas, inicio, fim) {
  let views = 0, clicks = 0;
  for (const j of vagas) {
    const daily = j.dailyStats || {};
    for (const [data, stat] of Object.entries(daily)) {
      if (data >= inicio && data <= fim) {
        views += stat.views || 0;
        clicks += stat.clicks || 0;
      }
    }
  }
  return { views, clicks };
}

// Só compara quando o período anterior tem base MÍNIMA — senão sai
// percentual absurdo ("↑ 20814%": 37 visualizações no mês anterior
// contra 7.738 neste, o que é o rastreio começando, não crescimento).
// Pra quem vai mandar isso a um cliente, sem número é melhor que número
// que parece erro.
function pctCrescimento(atual, anterior, baseMinima) {
  if (anterior < baseMinima) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

// Comparação "com selo X" vs "sem selo X", usando as vagas ativas do
// site inteiro (não só desse parceiro) — é uma estatística geral da
// plataforma, pra mostrar o valor do selo pro cliente.
function compararSelo(liveJobs, key, metricFn) {
  const com = liveJobs.filter((j) => j[key]);
  const sem = liveJobs.filter((j) => !j[key]);
  if (com.length < MIN_SAMPLE || sem.length < MIN_SAMPLE) return null;
  const mediaCom = com.reduce((s, j) => s + metricFn(j), 0) / com.length;
  const mediaSem = sem.reduce((s, j) => s + metricFn(j), 0) / sem.length;
  if (mediaSem <= 0 || mediaCom <= 0) return null;
  return { mediaCom, mediaSem, multiplicador: mediaCom / mediaSem };
}

function StatCard({ icon: Icon, label, value, growth }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <p className="nv-body flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
        <Icon className="h-3.5 w-3.5 text-blue-600" /> {label}
      </p>
      <p className="nv-display mt-1 text-[26px] font-extrabold leading-none text-blue-600">{value}</p>
      {growth !== null && growth !== undefined && (
        <p className={`nv-body mt-1 text-[11px] font-bold ${growth >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
          {growth >= 0 ? "↑" : "↓"} {Math.abs(growth)}% vs período anterior
        </p>
      )}
    </div>
  );
}

function SeloRow({ label, comp, unidade }) {
  if (!comp) return null;
  const comPct = Math.round((comp.mediaCom / (comp.mediaCom + comp.mediaSem)) * 100);
  const semPct = 100 - comPct;
  return (
    <div className="mt-3">
      <p className="nv-body text-[12px] font-bold text-slate-800">{label}</p>
      <div className="mt-1 flex h-6 bg-slate-100 text-[10px] font-bold text-white">
        <div
          className="flex items-center justify-center bg-slate-300"
          style={{ width: `${semPct}%`, borderTopLeftRadius: 999, borderBottomLeftRadius: 999 }}
        >
          {semPct >= 12 && <span className="text-slate-600">Sem {semPct}%</span>}
        </div>
        <div
          className="flex items-center justify-center bg-blue-600"
          style={{ width: `${comPct}%`, borderTopRightRadius: 999, borderBottomRightRadius: 999 }}
        >
          {comPct >= 12 && <span>Com {comPct}%</span>}
        </div>
      </div>
      <p className="nv-body mt-1 text-[11px] font-semibold text-emerald-600">
        ↑ {comp.multiplicador.toFixed(1)}x mais {unidade} com o selo
      </p>
    </div>
  );
}

export default function RelatorioDesempenho({ partner, jobs, onClose }) {
  const cardRef = useRef(null);
  const [gerando, setGerando] = useState(false);
  const [pngUrl, setPngUrl] = useState(null);

  const dados = useMemo(() => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const diasNoPeriodo = Math.round((hoje - inicioMes) / 86400000) + 1;
    const inicioAnterior = new Date(inicioMes);
    inicioAnterior.setDate(inicioAnterior.getDate() - diasNoPeriodo);
    const fimAnterior = new Date(inicioMes);
    fimAnterior.setDate(fimAnterior.getDate() - 1);

    // matchNames: relatório de empresa NÃO cadastrada, juntando as várias
    // grafias do mesmo nome que aparecem nas vagas ("Fujiarte" / "FUJIARTE Co. Ltd").
    const vagasDoParceiro = jobs.filter((j) => (partner.matchNames ? partner.matchNames.includes(j.empresa) : j.empresa === partner.name));
    const atual = somaPeriodo(vagasDoParceiro, ymd(inicioMes), ymd(hoje));
    const anterior = somaPeriodo(vagasDoParceiro, ymd(inicioAnterior), ymd(fimAnterior));

    const vagasAtivas = vagasDoParceiro.filter((j) => !j.preenchida && !j.arquivada).length;
    // "Divulgadas": vaga ativa hoje OU que teve visualização/clique no
    // período. Vaga do scraper que saiu da fonte é arquivada sozinha (9
    // dias sem reaparecer), então só "ativas" deixava um relatório com
    // milhares de visualizações e 1 vaga — parecia erro.
    const iniStr = ymd(inicioMes), fimStr = ymd(hoje);
    const vagasDivulgadas = vagasDoParceiro.filter(
      (j) =>
        (!j.preenchida && !j.arquivada) ||
        Object.entries(j.dailyStats || {}).some(([d, st]) => d >= iniStr && d <= fimStr && ((st.views || 0) > 0 || (st.clicks || 0) > 0))
    ).length;
    const taxaContato = atual.views > 0 ? (atual.clicks / atual.views) * 100 : 0;
    const taxaContatoAnterior = anterior.views > 0 ? (anterior.clicks / anterior.views) * 100 : null;

    const liveJobs = jobs.filter((j) => !j.arquivada);
    const selos = {
      destaque: compararSelo(liveJobs, "isFixado", (j) => j.views || 0),
      recomendado: compararSelo(liveJobs, "isRecomendado", (j) => j.clicks || 0),
      verificado: compararSelo(liveJobs, "seloVerificado", (j) => (j.views > 0 ? j.clicks / j.views : 0)),
    };

    return {
      periodoLabel: `${fmtData(inicioMes)} a ${fmtData(hoje)}`,
      views: atual.views,
      clicks: atual.clicks,
      vagasAtivas,
      vagasDivulgadas,
      taxaContato,
      crescViews: pctCrescimento(atual.views, anterior.views, 50),
      crescClicks: pctCrescimento(atual.clicks, anterior.clicks, 10),
      // diferença em pontos percentuais; "↑ 0%" não diz nada, então some
      crescTaxa: taxaContatoAnterior !== null && anterior.views >= 50 && Math.round(taxaContato - taxaContatoAnterior) !== 0
        ? Math.round(taxaContato - taxaContatoAnterior)
        : null,
      selos,
      temAlgumSelo: !!(selos.destaque || selos.recomendado || selos.verificado),
    };
  }, [partner, jobs]);

  const gerarImagem = async () => {
    if (!cardRef.current) return;
    setGerando(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: "#ffffff", useCORS: true });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const url = URL.createObjectURL(blob);
      setPngUrl(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${partner.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      a.click();
    } catch (err) {
      console.error("Falha ao gerar imagem do relatório:", err);
      window.alert("Não foi possível gerar a imagem. Tenta de novo — se persistir, avisa o Leandro.");
    } finally {
      setGerando(false);
    }
  };

  const whatsappLink = () => {
    // phonePt (número no Brasil, sem código do Japão) nunca serviria
    // pra um link wa.me de qualquer forma — só phoneJp é o telefone
    // de verdade dela NO Japão. Mantido o fallback pra phonePt só
    // pra não quebrar quem só tinha esse campo preenchido; o
    // toIntlPhoneDigits trata os dois do mesmo jeito.
    const phone = toIntlPhoneDigits(partner.phoneJp || partner.phonePt);
    const texto = encodeURIComponent(
      `Olá, ${partner.name}! Segue o relatório de desempenho das suas vagas no NihonVagas.jp (${dados.periodoLabel}). Vou anexar a imagem aqui em seguida.`
    );
    return phone ? `https://wa.me/${phone}?text=${texto}` : `https://wa.me/?text=${texto}`;
  };

  // Mensagem separada, só pra lembrar a empresa da Página Exclusiva —
  // não tem nada a ver com o relatório em si, por isso é um botão à
  // parte (não faz sentido misturar as duas coisas na mesma mensagem).
  const paginaExclusivaWhatsappLink = () => {
    const phone = toIntlPhoneDigits(partner.phoneJp || partner.phonePt);
    const url = typeof window !== "undefined" ? `${window.location.origin}/?empresa=${partner.paginaExclusivaSlug}` : "";
    const texto = encodeURIComponent(
      `Oi, ${partner.name}! Só lembrando: como te falei, sua empresa não precisa mais de um site — a gente já te deu um, de graça, e nunca vamos cobrar por isso. É a sua Página Exclusiva de vagas, só com as suas, separadas das demais, pra você divulgar direto pros seus candidatos:\n${url}`
    );
    return phone ? `https://wa.me/${phone}?text=${texto}` : `https://wa.me/?text=${texto}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="nv-rise flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-slate-100 shadow-xl sm:max-w-sm sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h3 className="nv-display text-[15px] font-bold text-slate-900">Relatório de desempenho</h3>
            <p className="nv-body text-[11px] text-slate-500">Pré-visualização — {partner.name}{partner.naoCadastrada ? " (não cadastrada)" : ""}</p>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* ---------- Isto aqui é exatamente o que vira a imagem ---------- */}
          <div ref={cardRef} className="overflow-hidden rounded-2xl bg-white">
            <div className="bg-blue-600 px-5 pb-5 pt-6 text-center text-white">
              <div className="mx-auto flex items-center justify-center gap-2">
                <div className="nv-display flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[15px] font-extrabold text-blue-600">N</div>
                <span className="nv-display text-[17px] font-extrabold">NihonVagas.jp</span>
              </div>
              <h4 className="nv-display mt-3 text-[22px] font-extrabold leading-tight">Relatório de Desempenho</h4>
              <p className="nv-body mt-1 text-[12px] text-blue-100">{partner.name} · {dados.periodoLabel}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-4">
              <StatCard icon={Eye} label="Visualizações" value={dados.views.toLocaleString("pt-BR")} growth={dados.crescViews} />
              <StatCard icon={MessageCircle} label="Cliques no WhatsApp" value={dados.clicks.toLocaleString("pt-BR")} growth={dados.crescClicks} />
              <StatCard
                icon={FolderOpen}
                label={partner.naoCadastrada ? "Vagas divulgadas" : "Vagas ativas"}
                value={partner.naoCadastrada ? dados.vagasDivulgadas : dados.vagasAtivas}
                growth={null}
              />
              <StatCard icon={TrendingUp} label="Taxa de contato" value={`${dados.taxaContato.toFixed(1)}%`} growth={dados.crescTaxa} />
            </div>

            {dados.temAlgumSelo && !partner.naoCadastrada && (
              <div className="border-t border-slate-100 px-4 pb-1 pt-3">
                <p className="nv-display text-[13px] font-bold text-slate-900">O poder de cada selo</p>
                <SeloRow label="🔥 Vagas com Destaque" comp={dados.selos.destaque} unidade="visualizações" />
                <SeloRow label="⭐ Vagas Recomendadas" comp={dados.selos.recomendado} unidade="cliques" />
                <SeloRow label="✔️ Vagas Verificadas" comp={dados.selos.verificado} unidade="taxa de contato" />
              </div>
            )}

            <div className="mt-4 bg-blue-50 px-4 py-3 text-center">
              <p className="nv-body text-[11px] font-medium text-blue-900">
                {partner.naoCadastrada
                  ? "Vagas divulgadas gratuitamente no NihonVagas.jp. Quer gerenciá-las direto, com contato e métricas próprios? Cadastre sua empresa, sem custo."
                  : "Continue publicando vagas atualizadas para manter seu desempenho."}
              </p>
            </div>
            {/* Lembrete puro — sem número novo pra calcular (a pedido:
                "só um lembrete"), só aparece pra quem já tem a Página
                Exclusiva liberada, e vai JUNTO na imagem baixada, já
                que é a empresa quem recebe esse relatório por WhatsApp.
                Caixa separada (não mais só uma linha pequena dentro do
                bloco azul) — pedido explícito pra ficar bem mais fácil
                de ler na imagem final. */}
            {partner.paginaExclusivaAtiva && (
              <div className="bg-indigo-600 px-4 py-3.5 text-center">
                <p className="nv-display text-[13.5px] font-extrabold leading-snug text-white">
                  📎 Não esqueça de compartilhar sua Página Exclusiva com seus candidatos!
                </p>
              </div>
            )}
          </div>
          {/* ---------- fim do que vira imagem ---------- */}
        </div>

        <div className="space-y-2 border-t border-slate-200 bg-white px-5 py-4">
          <button
            onClick={gerarImagem}
            disabled={gerando}
            className="nv-body flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
          >
            {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {gerando ? "Gerando imagem..." : "Baixar imagem"}
          </button>
          {!partner.naoCadastrada && (
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="nv-body flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-[13px] font-bold text-emerald-700"
            >
              <MessageCircle className="h-4 w-4" /> Abrir WhatsApp de {partner.name.split(" ")[0]}
            </a>
          )}
          {partner.paginaExclusivaAtiva && partner.paginaExclusivaSlug && (
            <a
              href={paginaExclusivaWhatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="nv-body flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-[13px] font-bold text-indigo-700"
            >
              <Link2 className="h-4 w-4" /> Lembrar o cliente da Página Exclusiva
            </a>
          )}
          <p className="nv-body text-center text-[10.5px] text-slate-400">
            {partner.naoCadastrada
              ? "Empresa não cadastrada (sem telefone no sistema) — baixe a imagem e envie pelo canal que você já está usando com eles."
              : "O WhatsApp não deixa anexar imagem direto pelo link — baixa primeiro, depois anexa a imagem na conversa que abrir."}
          </p>
        </div>
      </div>
    </div>
  );
}
