process.env.ADMIN_SESSION_SECRET = "teste-segredo";
process.env.VITE_SUPABASE_URL = "https://fake.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role";

const { signSession } = await import("./api/_lib/session.js");
const handler = (await import("./api/db-write.js")).default;

// Mock de fetch: registra a última chamada feita, sempre responde OK com []
let lastCall = null;
global.fetch = async (url, opts) => {
  lastCall = { url, ...opts };
  return { ok: true, text: async () => "[]" };
};

function fakeReqRes(body, method = "POST") {
  const req = { method, body };
  const res = {
    statusCode: 200,
    _json: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this._json = obj; return this; },
  };
  return { req, res };
}

async function run(name, body, expectStatus, checkFn) {
  const { req, res } = fakeReqRes(body);
  await handler(req, res);
  const passed = res.statusCode === expectStatus && (!checkFn || checkFn(lastCall, res._json));
  console.log(passed ? "OK " : "FALHOU ", name, "-> status:", res.statusCode, JSON.stringify(res._json));
  if (!passed) console.log("    lastCall:", lastCall);
  lastCall = null;
}

const adminToken = signSession({ role: "admin" });
const partnerToken = signSession({ role: "partner", partnerId: "PARC-1" });

await run("sem token -> 401", { table: "vagas", action: "update", rows: {}, match: { id: 1 } }, 401);

await run("token de admin, tabela não-allowlisted -> 403",
  { token: adminToken, table: "tabela_secreta_do_sistema", action: "update", rows: {}, match: { id: 1 } }, 403);

await run("parceiro tentando escrever em 'planos' (admin-only) -> 403",
  { token: partnerToken, table: "planos", action: "update", rows: {}, match: { id: "gratis" } }, 403);

await run("admin escrevendo em 'vagas' -> 200, sem partner_id forçado", {
  token: adminToken, table: "vagas", action: "update", rows: { cargo: "Novo cargo" }, match: { id: "job-1" },
}, 200, (call) => {
  const body = JSON.parse(call.body);
  return !("partner_id" in body) && call.url.includes("id=eq.job-1") && !call.url.includes("or=");
});

await run("parceiro escrevendo em 'vagas' -> 200, partner_id forçado + filtro or(null,dele)", {
  token: partnerToken, table: "vagas", action: "update", rows: { cargo: "Tentando mudar", partner_id: "OUTRO-PARCEIRO" }, match: { id: "job-2" },
}, 200, (call) => {
  const body = JSON.parse(call.body);
  const urlOk = call.url.includes("or=(partner_id.is.null,partner_id.eq.PARC-1)");
  return body.partner_id === "PARC-1" && urlOk; // nunca aceita o "OUTRO-PARCEIRO" que o navegador mandou
});

await run("parceiro inserindo em 'vagas' -> partner_id sempre = o dele, mesmo mandando outro", {
  token: partnerToken, table: "vagas", action: "insert", rows: { cargo: "Vaga nova", partner_id: "TENTATIVA-FALSA" },
}, 200, (call) => {
  const rows = JSON.parse(call.body);
  return rows[0].partner_id === "PARC-1";
});

await run("parceiro tentando 'service_listings' de outro provider_id -> servidor ignora e usa o dele", {
  token: partnerToken, table: "service_listings", action: "insert", rows: { nome: "Anúncio", provider_id: "outro" },
}, 200, (call) => {
  const rows = JSON.parse(call.body);
  return rows[0].provider_id === "PARC-1";
});

await run("ação inválida -> 400", { token: adminToken, table: "vagas", action: "drop_table_please" }, 400);

console.log("\nTODOS OS TESTES DE AUTORIZAÇÃO DO GATEWAY RODARAM");
