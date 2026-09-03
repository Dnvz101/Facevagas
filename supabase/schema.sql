-- =============================================================
-- nihonvagas.jp — schema Supabase (v20 — deduplicação e arquivamento
-- automático de vagas do scraper: adiciona "url_original" (link do
-- anúncio na fonte — chave de deduplicação), "last_seen_at" (última
-- vez vista pelo scraper) e "arquivada" (vaga que sumiu da fonte há
-- ~9 dias, some da lista pública mas o dado não é apagado). Índice
-- criado pra buscar por url_original rápido. Tudo por cima do v19
-- (service_categories.color/icon).
-- Rode isto inteiro no SQL Editor do seu projeto Supabase.
--
-- Se você já rodou versões anteriores: pode rodar este arquivo
-- inteiro de novo sem medo — todo "create table if not exists" e "add
-- column if not exists" é seguro de reexecutar, não apaga nem duplica
-- nada que já existe. Se está começando do zero, também roda ele
-- inteiro direto (ele já recria tudo desde a v3).
-- =============================================================

create extension if not exists pgcrypto;

-- ---------- tabela de vagas (schema igual ao JSON do scraper + selos) ----------
create table if not exists public.vagas (
  id text primary key default gen_random_uuid()::text,
  empresa text not null,
  cargo text not null,
  cidade text default '',
  provincia text default '',
  salario_hora integer not null default 0,
  salario_max integer,                          -- topo da faixa (ex: "¥1.500 ~ ¥1.600/h") — null quando não há faixa
  turno text default '',
  nihongo text default '',
  moradia text default '',
  vaga_homens boolean not null default false,
  vaga_mulheres boolean not null default false,
  conducao text default '',
  tags text[] not null default '{}',
  telefone text default '',
  whatsapp text default '',
  descricao text default '',
  status text not null default 'publicado',   -- 'publicado' | 'rascunho'
  clicks integer not null default 0,
  views integer not null default 0,             -- visualizações do card no feed público
  favoritos integer not null default 0,          -- contador compartilhado de favoritos (soma de todo mundo que favoritou)
  top_salario boolean not null default false,  -- 💎 selo Top Salário
  recomendado boolean not null default false,  -- ⭐ selo Recomendado
  urgente boolean not null default false,      -- 🔥 selo Urgente
  fixado boolean not null default false,       -- 🔥 selo Destaque (fixa no topo do ranking)
  novo boolean not null default false,          -- 🆕 selo Nova Vaga — 100% editorial/Admin, nunca automático
  novo_ativado_em timestamptz,                  -- início do ciclo de 48h do selo Nova Vaga (null = nunca ativado ou já desligado)
  destaque_ativado_em timestamptz,              -- início do ciclo de 7 dias do Destaque (null = nunca ativado ou já desligado)
  selo_verificado boolean not null default false, -- ✔️ check azul (empresa verificada, vem do plano OU concedido manualmente pelo Admin)
  preenchida boolean not null default false,      -- vaga marcada como preenchida PELA PRÓPRIA EMPRESA — status manual, não confiável como métrica agregada (nem toda empresa marca), mas fica registrado pra uso futuro
  preenchida_em timestamptz,                       -- quando foi marcada como preenchida (null = nunca marcada, ou foi reaberta)
  daily_stats jsonb not null default '{}'::jsonb,  -- histórico diário {"YYYY-MM-DD": {"views": n, "clicks": n}} — alimenta o Gráfico de Evolução da Área do Cliente
  url_original text,                                -- link direto do anúncio na fonte de origem (scraper) — base da deduplicação, evita vaga repetida a cada scrape
  last_seen_at timestamptz,                        -- última vez que o scraper viu essa vaga — null = nunca veio do scraper (publicada por empresa, intocável pro arquivamento automático)
  arquivada boolean not null default false,        -- vaga que o scraper parou de ver há muito tempo — some da lista pública, mas o dado não é apagado (reversível)
  idade_maxima integer,                             -- 999 = anúncio diz "sem limite de idade" | número = limite mencionado (ex: até 55) | null = não menciona nada sobre idade (nunca "sem limite" por omissão)
  created_at timestamptz not null default now()
);

-- ---------- MIGRAÇÃO (só necessária se "vagas" já existia SEM essas
-- colunas — se você já rodou este arquivo uma vez, pode ignorar; o "if
-- not exists" já cobre isso) ----------
-- Selos principais — cobertos aqui também com "if not exists" porque,
-- se a tabela "vagas" já existia de uma versão bem antiga do projeto
-- (antes desse schema.sql consolidado), o "create table if not exists"
-- lá em cima não recria nada, e essas colunas podem estar faltando.
alter table public.vagas add column if not exists fixado boolean not null default false;
alter table public.vagas add column if not exists top_salario boolean not null default false;
alter table public.vagas add column if not exists recomendado boolean not null default false;
alter table public.vagas add column if not exists urgente boolean not null default false;
alter table public.vagas add column if not exists selo_verificado boolean not null default false;
alter table public.vagas add column if not exists salario_max integer;
alter table public.vagas add column if not exists views integer not null default 0;
alter table public.vagas add column if not exists destaque_ativado_em timestamptz;
alter table public.vagas add column if not exists novo boolean not null default false;
alter table public.vagas add column if not exists novo_ativado_em timestamptz;
alter table public.vagas add column if not exists favoritos integer not null default 0;
alter table public.vagas add column if not exists preenchida boolean not null default false;
alter table public.vagas add column if not exists preenchida_em timestamptz;
alter table public.vagas add column if not exists daily_stats jsonb not null default '{}'::jsonb;
alter table public.vagas add column if not exists url_original text;
alter table public.vagas add column if not exists last_seen_at timestamptz;
alter table public.vagas add column if not exists arquivada boolean not null default false;
alter table public.vagas add column if not exists idade_maxima integer;

-- Índice pra tornar a busca por url_original (usada em TODA importação
-- do scraper, pra achar duplicata) rápida mesmo com o banco crescendo.
create index if not exists idx_vagas_url_original on public.vagas (url_original) where url_original is not null;

-- ---------- tabela do banner (linha única, id fixo = 1) ----------
create table if not exists public.banner (
  id int primary key default 1,
  mode text not null default 'info',       -- 'info' | 'text' | 'image'
  text text default '',
  image_url text,
  updated_at timestamptz not null default now(),
  constraint banner_singleton check (id = 1)
);

insert into public.banner (id, mode, text)
values (1, 'info', '⚠️ Aviso à comunidade: o nihonvagas.jp não cobra nenhuma taxa de candidatos.')
on conflict (id) do nothing;

-- ---------- tabela do banner de CTA do Alerta de Vagas (linha única,
-- id fixo = 1 — mesmo padrão da "banner" principal) ----------
-- ⚠️ "enabled" nasce FALSE de propósito: é o interruptor geral da
-- função inteira (banner + inscrição), pensado pra ficar desligado até
-- uma API de WhatsApp Business/backend real estar configurada.
create table if not exists public.alerta_banner (
  id int primary key default 1,
  enabled boolean not null default false,
  text text default '🔔 Receba vagas novas no seu WhatsApp — configure seu alerta grátis',
  updated_at timestamptz not null default now(),
  constraint alerta_banner_singleton check (id = 1)
);

insert into public.alerta_banner (id, enabled, text)
values (1, false, '🔔 Receba vagas novas no seu WhatsApp — configure seu alerta grátis')
on conflict (id) do nothing;

-- ---------- tabela do banner do topo da aba Comunidade (linha única,
-- id fixo = 1 — mesmo padrão de "banner"/"alerta_banner") ----------
create table if not exists public.comunidade_banner (
  id int primary key default 1,
  mode text not null default 'info',       -- 'info' | 'text' | 'image'
  text text default '🤝 Espaço da comunidade: aqui, quem presta serviço com dedicação é valorizado. Cadastro e divulgação sempre gratuitos — sem taxa, sem plano pago, sem pegadinha.',
  image_url text,
  enabled boolean not null default true,   -- ligado por padrão — Admin pode desativar se quiser
  updated_at timestamptz not null default now(),
  constraint comunidade_banner_singleton check (id = 1)
);

alter table public.comunidade_banner add column if not exists enabled boolean not null default true;

insert into public.comunidade_banner (id, mode, text)
values (1, 'info', '🤝 Espaço da comunidade: aqui, quem presta serviço com dedicação é valorizado. Cadastro e divulgação sempre gratuitos — sem taxa, sem plano pago, sem pegadinha.')
on conflict (id) do nothing;

-- Migração pra quem já rodou a v8 antes desta mudança de default:
-- força a função pra desligada agora, já que ela nasceu ligada antes.
update public.alerta_banner set enabled = false where id = 1;

-- ---------- tabela de inscrições no Alerta de Vagas (WhatsApp) ----------
create table if not exists public.alertas_vagas (
  id text primary key default gen_random_uuid()::text,
  provincia text default 'todas',
  sexo text default 'todos',       -- 'todos' | 'homens' | 'mulheres'
  nihongo text default 'todos',
  whatsapp text not null,
  created_at timestamptz not null default now()
);

-- ---------- tabela de ESTATÍSTICAS DE USO do site inteiro (linha
-- única, id fixo = 1 — mesmo padrão singleton de "banner"/"alerta_banner").
-- Guarda tudo num único jsonb: cliques em modo escuro/PWA/WhatsApp de
-- suporte/banner do Alerta, filtros mais usados e abas mais visitadas.
-- Sem cookies, sem identificar quem clicou — só contadores agregados. ----------
create table if not exists public.site_stats (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_stats_singleton check (id = 1)
);

insert into public.site_stats (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ---------- tabela da aba COMUNIDADE (vídeos curados pelo Admin) ----------
create table if not exists public.comunidade_conteudo (
  id text primary key default gen_random_uuid()::text,
  categoria text not null,
  titulo text not null,
  descricao text default '',
  youtube_id text not null,
  created_at timestamptz not null default now()
);

-- ---------- Prestadores de Serviço da Comunidade ----------
-- Categorias (gera o selo de canto do card + opção no cadastro do
-- prestador). Lista pequena, gerenciada pelo Admin.
create table if not exists public.service_categories (
  id bigint generated always as identity primary key,
  nome text not null unique,
  color text not null default 'blue',       -- chave da paleta (ver CATEGORY_COLOR_OPTIONS no app) — não é hex, é um nome tipo 'blue'/'emerald'/'amber'
  icon text not null default 'Building2',   -- nome do ícone Lucide (ver CATEGORY_ICON_MAP no app)
  created_at timestamptz not null default now()
);

alter table public.service_categories add column if not exists color text not null default 'blue';
alter table public.service_categories add column if not exists icon text not null default 'Building2';

-- Anúncios dos prestadores. "provider_id" referencia o parceiro
-- (tabela `parceiros`, tipo='prestador') quando o cadastro de verdade
-- existir — nula pra anúncios de teste cadastrados direto pelo Admin.
create table if not exists public.service_listings (
  id text primary key default gen_random_uuid()::text,
  provider_id text,
  categoria text not null,
  nome text not null,
  descricao text default '',
  whatsapp text not null,
  likes integer not null default 0,
  status text not null default 'publicado', -- 'publicado' | 'rascunho'
  created_at timestamptz not null default now()
);

-- ---------- tabela de PLANOS (preços e cotas de visibilidade, editável
-- pelo Admin — id é a chave estável usada no app: 'gratis' | 'start' |
-- 'pro' | 'master') ----------
create table if not exists public.planos (
  id text primary key,                            -- 'gratis' | 'start' | 'pro' | 'master'
  label text not null,
  preco integer not null default 0,                -- em ienes
  preco_original integer,                          -- preço "de" riscado, pra mostrar promoção (null = não mostra)
  stripe_link text default '',                     -- link de pagamento (Payment Link) do Stripe pra esse plano
  cota_topo integer not null default 0,             -- quantas vagas podem ficar em "Destaque" (🔥) — consome o ciclo de 7 dias
  cota_recomendado integer not null default 0,      -- quantas vagas podem ter o selo Recomendado (⭐) — 999 = ilimitado
  cota_urgente integer not null default 0,          -- quantas vagas podem ter o selo Urgente (⚡) — 999 = ilimitado
  ia_liberada boolean not null default true,        -- acesso ao Publicador Mágico (IA)
  selo_verificado boolean not null default false,   -- se o plano dá direito ao check azul (✔️) por padrão
  metricas boolean not null default false,          -- acesso ao painel de Métricas Avançadas (Início da Área do Cliente)
  updated_at timestamptz not null default now()
);

alter table public.planos add column if not exists preco_original integer;
alter table public.planos add column if not exists stripe_link text default '';

insert into public.planos (id, label, preco, cota_topo, cota_recomendado, cota_urgente, ia_liberada, selo_verificado, metricas)
values
  ('gratis', 'Grátis', 0,     0, 1,   0,   true, false, false),
  ('start',  'Start',  15000, 0, 3,   0,   true, true,  false),
  ('pro',    'Pro',    30000, 2, 999, 999, true, true,  true),
  ('master', 'Master', 50000, 5, 999, 999, true, true,  true)
on conflict (id) do nothing;

-- Migração pra quem já rodou versões anteriores desta tabela sem a
-- coluna "metricas" (o "if not exists" abaixo cobre isso com segurança):
alter table public.planos add column if not exists metricas boolean not null default false;

-- ---------- tabela de PARCEIROS (empresas/prestadores/lojas cadastrados
-- via PartnerAuthModal — Área do Cliente) ----------
-- ⚠️⚠️⚠️ ATENÇÃO ESPECIAL — mais importante que os outros avisos deste
-- arquivo: esta tabela guarda "password" em TEXTO PURO (mesmo esquema
-- simplificado que o app usa hoje no protótipo). Isso é MUITO mais
-- sensível que as outras tabelas: se a policy de leitura pública
-- (mesma usada nas outras tabelas, pra manter tudo funcionando igual)
-- ficar ativa em produção, QUALQUER PESSOA com a chave anon (que é
-- pública, vai dentro do código do site) consegue LER O E-MAIL E A
-- SENHA de toda empresa cadastrada. Antes de divulgar o site
-- publicamente — não só "antes de crescer", ANTES DE QUALQUER PESSOA
-- REAL SE CADASTRAR — troque isso por Supabase Auth (supabase.auth.
-- signUp / signInWithPassword) e tire a coluna "password" daqui. Até
-- lá, trate como se qualquer senha aqui dentro já estivesse pública.
create table if not exists public.parceiros (
  id text primary key default gen_random_uuid()::text,
  tipo text not null,                 -- 'empreiteira' | 'prestador' | 'loja'
  name text not null,
  email text not null unique,
  password text not null,             -- ⚠️ texto puro — ver aviso acima
  phone_pt text default '',           -- WhatsApp oficial (🇧🇷) — vai pras vagas reivindicadas
  phone_jp text default '',           -- telefone/recepção japonês (opcional)
  plan_key text not null default 'gratis' references public.planos(id),
  selo_verificado boolean not null default false, -- concessão PERMANENTE do Super Admin, independente do plano
  created_at timestamptz not null default now()
);

-- ---------- RPC para incrementar cliques de forma atômica ----------
create or replace function public.increment_vaga_clicks(vaga_id text)
returns void
language sql
security definer
as $$
  update public.vagas set clicks = clicks + 1 where id = vaga_id;
$$;

-- ---------- Row Level Security ----------
alter table public.vagas enable row level security;
alter table public.banner enable row level security;
alter table public.alerta_banner enable row level security;
alter table public.comunidade_banner enable row level security;
alter table public.alertas_vagas enable row level security;
alter table public.site_stats enable row level security;
alter table public.comunidade_conteudo enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_listings enable row level security;
alter table public.planos enable row level security;
alter table public.parceiros enable row level security;

-- Leitura pública (qualquer visitante do site vê as vagas, o banner e
-- os preços/cotas dos planos — necessário pra mostrar a página de planos)
drop policy if exists "vagas_public_read" on public.vagas;
create policy "vagas_public_read" on public.vagas for select using (true);

drop policy if exists "banner_public_read" on public.banner;
create policy "banner_public_read" on public.banner for select using (true);

drop policy if exists "alerta_banner_public_read" on public.alerta_banner;
create policy "alerta_banner_public_read" on public.alerta_banner for select using (true);

-- ⚠️ "alertas_vagas" guarda o WhatsApp de cada inscrito — mesma
-- ressalva de "parceiros": leitura pública liberada só pra manter o
-- protótipo funcionando (o Admin lista os inscritos direto no app).
-- Antes de divulgar publicamente, restrinja a leitura só ao Admin
-- autenticado via Supabase Auth.
drop policy if exists "alertas_vagas_public_read" on public.alertas_vagas;
create policy "alertas_vagas_public_read" on public.alertas_vagas for select using (true);

drop policy if exists "alertas_vagas_public_insert" on public.alertas_vagas;
create policy "alertas_vagas_public_insert" on public.alertas_vagas for insert with check (true);

-- ⚠️ "site_stats" é só contadores agregados (nenhum dado pessoal), mas
-- a política de escrita aberta ainda merece o mesmo aviso do resto:
-- qualquer visitante com a chave anon pode sobrescrever esse jsonb.
-- Baixo risco (não vaza nada sensível), mas o ideal também é restringir
-- a leitura só ao Admin quando migrar pra Supabase Auth de verdade.
drop policy if exists "site_stats_public_read" on public.site_stats;
create policy "site_stats_public_read" on public.site_stats for select using (true);

drop policy if exists "site_stats_public_update" on public.site_stats;
create policy "site_stats_public_update" on public.site_stats for update using (true);

-- ⚠️ Igual às outras: leitura/escrita abertas pra manter o protótipo
-- funcionando sem Auth. Nesse caso o risco é baixo (não tem dado
-- sensível), mas em produção de verdade o ideal é restringir insert/
-- delete só ao Admin autenticado — senão qualquer visitante com a
-- chave anon poderia cadastrar vídeo por conta própria.
drop policy if exists "comunidade_conteudo_public_read" on public.comunidade_conteudo;
create policy "comunidade_conteudo_public_read" on public.comunidade_conteudo for select using (true);

drop policy if exists "comunidade_conteudo_public_insert" on public.comunidade_conteudo;
create policy "comunidade_conteudo_public_insert" on public.comunidade_conteudo for insert with check (true);

drop policy if exists "comunidade_conteudo_public_delete" on public.comunidade_conteudo;
create policy "comunidade_conteudo_public_delete" on public.comunidade_conteudo for delete using (true);

-- ⚠️ Mesmo aviso de sempre: aberto pra manter o protótipo funcionando
-- sem Auth. Em produção de verdade, restringir insert/update/delete de
-- categorias e "curar" prestadores só ao Admin autenticado.
drop policy if exists "service_categories_public_all" on public.service_categories;
create policy "service_categories_public_all" on public.service_categories for all using (true) with check (true);

drop policy if exists "service_listings_public_read" on public.service_listings;
create policy "service_listings_public_read" on public.service_listings for select using (true);

drop policy if exists "service_listings_public_insert" on public.service_listings;
create policy "service_listings_public_insert" on public.service_listings for insert with check (true);

drop policy if exists "service_listings_public_update" on public.service_listings;
create policy "service_listings_public_update" on public.service_listings for update using (true);

drop policy if exists "service_listings_public_delete" on public.service_listings;
create policy "service_listings_public_delete" on public.service_listings for delete using (true);

drop policy if exists "planos_public_read" on public.planos;
create policy "planos_public_read" on public.planos for select using (true);

-- ⚠️ Igual ao aviso grande lá em cima: esta policy deixa "parceiros"
-- (com e-mail e senha em texto puro) legível por qualquer pessoa com a
-- chave anon. Só existe aqui pra manter o app funcionando exatamente
-- como no protótipo (login/cadastro comparando direto na tabela) —
-- NÃO é seguro pra produção. Substitua pelo fluxo de Supabase Auth
-- assim que possível.
drop policy if exists "parceiros_public_read" on public.parceiros;
create policy "parceiros_public_read" on public.parceiros for select using (true);

-- ⚠️ ATENÇÃO — POLÍTICAS ABERTAS DE ESCRITA (modo protótipo)
-- Isso permite que QUALQUER pessoa com a chave anon (que é pública,
-- vai dentro do código do site) publique, importe em lote, edite ou
-- apague vagas, edite preços/cotas dos planos, e cadastre/altere
-- parceiros — não só o admin. Aceitável pra testar rápido, mas antes
-- de divulgar o site publicamente, troque por Supabase Auth + policies
-- que só liberam INSERT/UPDATE/DELETE para quem estiver autenticado
-- (e, no caso de "parceiros", só o próprio dono da conta ou o admin).
drop policy if exists "vagas_public_insert" on public.vagas;
create policy "vagas_public_insert" on public.vagas for insert with check (true);

drop policy if exists "vagas_public_update" on public.vagas;
create policy "vagas_public_update" on public.vagas for update using (true);

drop policy if exists "vagas_public_delete" on public.vagas;
create policy "vagas_public_delete" on public.vagas for delete using (true);

drop policy if exists "banner_public_update" on public.banner;
create policy "banner_public_update" on public.banner for update using (true);

drop policy if exists "alerta_banner_public_update" on public.alerta_banner;
create policy "alerta_banner_public_update" on public.alerta_banner for update using (true);

drop policy if exists "comunidade_banner_public_read" on public.comunidade_banner;
create policy "comunidade_banner_public_read" on public.comunidade_banner for select using (true);

drop policy if exists "comunidade_banner_public_update" on public.comunidade_banner;
create policy "comunidade_banner_public_update" on public.comunidade_banner for update using (true);

drop policy if exists "planos_public_write" on public.planos;
create policy "planos_public_write" on public.planos for all using (true) with check (true);

drop policy if exists "parceiros_public_write" on public.parceiros;
create policy "parceiros_public_write" on public.parceiros for all using (true) with check (true);

grant execute on function public.increment_vaga_clicks to anon;

-- =============================================================
-- v21 — tabela "admin_users" (login do Super Admin, agora protegido).
-- Antes, o e-mail e a senha do Super Admin ficavam em TEXTO PURO,
-- escritos direto no código JavaScript — qualquer visitante conseguia
-- ver abrindo o "Inspecionar" do navegador. Agora ficam só aqui no
-- banco, e — diferente de TODAS as outras tabelas deste arquivo —
-- essa aqui NÃO TEM NENHUMA política de leitura pública. Só a
-- "service role key" (secreta, só no servidor, usada pela Vercel
-- Function em api/admin-login.js) consegue ler essa tabela. O
-- navegador nunca, em nenhuma hipótese, consegue consultar isso.
--
-- ⚠️ Depois de rodar esse SQL, cadastre você mesmo o seu e-mail/senha
-- de Admin direto pela interface do Supabase (Table Editor →
-- admin_users → Insert row) — de propósito, NENHUM arquivo deste
-- projeto contém sua senha real em lugar nenhum.
-- =============================================================
create table if not exists public.admin_users (
  id bigint generated always as identity primary key,
  email text not null unique,
  password text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- Sem nenhuma "create policy" aqui — de propósito. Sem política
-- nenhuma, RLS bloqueia TODO acesso via anon key (select/insert/
-- update/delete), e só a service role (que ignora RLS) consegue
-- mexer nessa tabela. É a tabela mais trancada do banco inteiro.

