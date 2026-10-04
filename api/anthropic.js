// api/anthropic.js
// Vercel Serverless Function — proxy pra API da Anthropic, só pro
// Publicador Mágico (extrair dados de vaga de print/texto).
//
// No artifact original (dentro do Claude), o Publicador Mágico chamava
// https://api.anthropic.com/v1/messages DIRETO do navegador, sem cabeçalho
// de autenticação nenhum visível no código — o próprio ambiente do
// artifact intercepta e injeta a chave de forma invisível. Isso só
// funciona porque o app estava rodando DENTRO do Claude.
//
// Fora daqui, esse "auto-injetar chave" não existe. Se o AIPublisher
// chamasse a Anthropic direto do navegador com a chave no código, ela
// ficaria visível pra qualquer visitante (igual o problema da senha do
// Admin que já resolvemos). Por isso, o cliente agora chama ESTE
// endpoint (/api/anthropic), e é aqui, no servidor, que a chave de
// verdade (ANTHROPIC_API_KEY, sem prefixo VITE_) é usada.
//
// Achado numa revisão de segurança (v2.6.51): essa função aceitava
// "system" e "messages" vindos DIRETO do corpo da requisição, sem
// checar sessão nenhuma — ou seja, qualquer pessoa na internet, sem
// login, conseguia chamar esse endpoint com QUALQUER prompt e usar a
// chave da Anthropic (paga pelo dono do site) pra qualquer coisa, não
// só extrair vaga. Corrigido em duas camadas: (1) exige sessão válida
// (admin OU parceiro — é o mesmo Publicador Mágico usado nos dois
// painéis); (2) o prompt de extração agora é FIXO aqui no servidor —
// o navegador manda só o conteúdo (imagem/texto), nunca o "system",
// então nem um parceiro legítimo logado consegue redefinir a tarefa
// desse endpoint pra outra coisa.

import { verifySession } from "./_lib/session.js";

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
  - Se o anúncio disser um número de idade de qualquer jeito ("até 55 anos", "no máximo 50", "acima de 60 anos", "a partir de 50 anos", "~60 anos", "60 anos ou mais"), retorne APENAS esse número (ex: "55"), mesmo quando não for um teto rígido.
  - Se o anúncio disser "sem limite de idade", "sem restrição de idade" ou "qualquer idade" (sem dar nenhum número), retorne a string exata "sem limite".
  - Se o anúncio não mencionar idade de jeito nenhum, retorne "".`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("anthropic proxy: ANTHROPIC_API_KEY não configurada na Vercel.");
    return res.status(500).json({ error: "IA não configurada no servidor." });
  }

  const { token, messages, max_tokens } = req.body || {};
  if (!verifySession(token)) {
    return res.status(401).json({ error: "Sessão expirada ou ausente — faça login de novo." });
  }
  if (!messages) {
    return res.status(400).json({ error: "Faltou o campo 'messages'." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: max_tokens || 1000,
        system: EXTRACTION_PROMPT,
        messages,
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("anthropic proxy: erro ao chamar a API:", err);
    return res.status(500).json({ error: "Falha ao processar com a IA." });
  }
}
