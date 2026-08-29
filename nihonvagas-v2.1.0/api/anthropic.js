// api/anthropic.js
// Vercel Serverless Function — proxy pra API da Anthropic.
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("anthropic proxy: ANTHROPIC_API_KEY não configurada na Vercel.");
    return res.status(500).json({ error: "IA não configurada no servidor." });
  }

  const { system, messages, max_tokens } = req.body || {};
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
        system,
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
