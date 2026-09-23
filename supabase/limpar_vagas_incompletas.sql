-- =============================================================
-- limpar_vagas_incompletas.sql
--
-- Remove vagas SEM SALÁRIO (salario_hora = 0) e/ou SEM CONTATO
-- (nem whatsapp nem telefone preenchidos) — a mesma regra usada no
-- filtro "⚠️ Incompletas" do painel Admin (JobsTable).
--
-- ESCOPO: só mexe em vagas que vieram do SCRAPER
-- (last_seen_at IS NOT NULL). Vaga publicada direto pela empresa
-- pelo painel dela (last_seen_at IS NULL) nunca é tocada aqui — se
-- uma empresa pagante quis publicar sem WhatsApp por algum motivo
-- dela, isso não é "lixo do scraper" e fica de fora de propósito.
--
-- COMO USAR (sempre nessa ordem, no SQL Editor do Supabase):
--   1) Rode o PASSO 1 (SELECT) e confira a lista — são essas que
--      vão ser apagadas.
--   2) Só depois de conferir, rode o PASSO 2 (DELETE).
-- O DELETE não tem volta — por isso o PASSO 1 existe.
-- =============================================================

-- ---------- PASSO 1 — só CONFERIR (não apaga nada) ----------
select id, empresa, cargo, salario_hora, whatsapp, telefone, last_seen_at
from public.vagas
where last_seen_at is not null
  and (
    salario_hora = 0
    or (coalesce(whatsapp, '') = '' and coalesce(telefone, '') = '')
  )
order by last_seen_at desc nulls last;

-- Quantas seriam apagadas:
select count(*) as total_a_apagar
from public.vagas
where last_seen_at is not null
  and (
    salario_hora = 0
    or (coalesce(whatsapp, '') = '' and coalesce(telefone, '') = '')
  );

-- ---------- PASSO 2 — apaga de verdade (rode só depois de conferir o PASSO 1) ----------
-- delete from public.vagas
-- where last_seen_at is not null
--   and (
--     salario_hora = 0
--     or (coalesce(whatsapp, '') = '' and coalesce(telefone, '') = '')
--   );

-- ---------- VARIANTE opcional — inclui também vagas publicadas direto (sem passar pelo scraper) ----------
-- Só use esta se realmente quiser apagar TUDO sem salário/contato,
-- mesmo o que foi publicado manualmente por empresa/Admin (fora do
-- fluxo do scraper). Não recomendado pelo motivo explicado no topo
-- do arquivo — deixe comentado a menos que tenha certeza.
--
-- delete from public.vagas
-- where salario_hora = 0
--    or (coalesce(whatsapp, '') = '' and coalesce(telefone, '') = '');
