// src/lib/session.js
//
// Guarda os tokens de sessão (emitidos por api/admin-login.js e
// api/partner-login.js) só EM MEMÓRIA — de propósito, não em
// localStorage. Isso combina com o jeito que "isSuperAdmin" e
// "currentClientCompanyId" já funcionam hoje no App.jsx (também só
// estado em memória): dar F5 na página desloga, do mesmo jeito que já
// era antes dessa mudança. Não é uma regressão, é manter o
// comportamento igual.
//
// Super Admin e Parceiro podem estar logados ao mesmo tempo (ver
// handleViewAs no App.jsx — Admin "vendo como" uma empresa de
// teste). Nesse caso, o token de Admin tem prioridade: ele pode
// escrever em qualquer lugar que um Parceiro poderia.

let adminToken = null;
let partnerToken = null;

export function setAdminToken(token) { adminToken = token; }
export function clearAdminToken() { adminToken = null; }
export function setPartnerToken(token) { partnerToken = token; }
export function clearPartnerToken() { partnerToken = null; }

export function getActiveSessionToken() {
  return adminToken || partnerToken;
}
