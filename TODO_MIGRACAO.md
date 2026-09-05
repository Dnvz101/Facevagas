# Pendências da migração (lembretes pra não esquecer)

## 🔒 Segurança
- [x] Login do Super Admin protegido — não fica mais em texto puro no
      código, verificação passou pra `api/admin-login.js` (Vercel
      Function) + tabela `admin_users` sem leitura pública.
- [ ] **`isSuperAdmin` precisa nascer `false`** — no artifact original
      ele nascia `useState(true)` (modo de teste, sempre ativo). No
      `App.jsx` deste projeto, isso PRECISA ser `useState(false)`.
      Login de Admin passa a ser obrigatório sempre.
- [ ] Depois de rodar `supabase/schema.sql`, cadastre seu e-mail/senha
      real de Admin direto no Table Editor do Supabase (tabela
      `admin_users`) — nenhum arquivo deste projeto tem sua senha.
- [ ] RLS de todas as outras tabelas ainda está "aberta" (modo
      protótipo) — migrar pra Supabase Auth de verdade + políticas
      restritivas é o próximo passo grande, combinado pra depois.

## 🧩 Modularização (em andamento)
- [x] Estrutura base do projeto Vite
- [x] `src/utils/format.js`, `src/utils/jobParsing.js`
- [x] `src/lib/supabase.js` (camada de dados completa)
- [x] `src/lib/adminAuth.js` (login do Admin)
- [ ] `src/lib/personalStorage.js` (localStorage — substitui o
      `window.storage` pessoal do artifact, que não existe fora dele)
- [ ] Utils restantes (Kakeibo, categorias/cores, ciclos de selo)
- [ ] Todos os componentes visuais
- [ ] `App.jsx` principal
- [ ] `api/anthropic.js` (proxy do Publicador Mágico)
- [ ] Validar `npm install` + `npm run build`
- [ ] Empacotar em `.zip`

## 🔍 Achados durante a modularização
- [x] `AdminSwitcherMenu` mostrava `{SUPER_ADMIN_EMAIL}` fixo no menu —
      corrigido pra "Acesso master" genérico, já que esse e-mail não é
      mais uma constante no código (vive só na tabela `admin_users`).

## ✅ Modularização — CONCLUÍDA
- [x] `App.jsx` montado, 1396 linhas, todos os imports resolvidos
- [x] `npm install` rodou limpo (177 pacotes)
- [x] `npm run build` gerou o `dist/` sem erros nem avisos
- [x] Bundle final: ~801kb JS (218kb gzip) + 41kb CSS — normal pro
      tamanho do projeto (aviso de "chunk grande" é só sugestão de
      otimização futura via code-splitting, não é problema agora)

**Antes de rodar `npm install` você mesmo:**
1. Copie `.env` (já vem preenchido com Supabase real) — só falta você
   colocar `SUPABASE_SERVICE_ROLE_KEY` (pega em Project Settings → API
   no painel do Supabase) e `ANTHROPIC_API_KEY`.
2. Rode `supabase/schema.sql` inteiro no SQL Editor do Supabase.
3. Cadastre seu e-mail/senha de Admin direto na tabela `admin_users`
   (Table Editor do Supabase) — nenhum arquivo tem isso escrito.
4. Lembre de trocar `isSuperAdmin` pra `useState(false)` se ainda
   estiver testando (já deve estar assim — confirme em App.jsx).

## 🐛 Bugs de runtime encontrados e corrigidos (pós-modularização)
`npm run build` valida só sintaxe — não pega "usei uma função mas
esqueci de importar" (isso só aparece rodando de verdade, tipo você
achou). Testei clicando em tudo com um navegador headless (Playwright)
e achei + corrigi:
- `KakeiboApp.jsx`: faltava `useEffect`, `useMemo`, `useRef`
- `KakeiboApp.jsx` e `ProfileEditor.jsx`: faltava `formatYen`
- `ProfileEditor.jsx`: faltava `calculateNightHours`
- `AlertBanner.jsx`: faltava `AlertCircle` (quebrava a aba Comunicados
  do Admin, já que o alerta nasce desligado por padrão)
- `SalaryCalculator.jsx` tinha ~160 linhas de código MORTO duplicado
  (mesma função extraída duas vezes por engano, de dois pedaços do
  arquivo original que se sobrepunham) — removido
- `fieldSuffix`/`timeFieldKakeibo`: viviam só dentro desse código
  morto, mas eram usados de verdade por `ProfileEditor` e `KakeiboApp`
  — criei `src/components/kakeibo/fields.jsx` como fonte única

Testado com clique de verdade em: todas as abas, virar card de vaga,
abrir ranking, adicionar perfil no Kakeibo, abas Orçamento/Compras,
cadastro de Empreiteira E Prestador (com prévia ao vivo).

## 🤝 v2.5.0 — Aba Indicações (campanha 55+)
- [x] Nova aba pública "Indicações" — hero (editável), split cards,
      "Como funciona", CTA de WhatsApp (escondido até configurar
      número dedicado) e feed unificado.
- [x] Feed unificado: indicações cadastradas manualmente pelo Admin +
      vagas TRADICIONAIS que já mencionam idade alta/sem limite no
      anúncio (`idade_maxima`) — nunca por ausência de menção.
- [x] `vagas.indicacao` (boolean) — nova coluna, marca origem
      "campanha de indicação" sem duplicar estrutura de dados.
- [x] `indicacoes_config` (singleton) — texto do hero, idade mínima do
      cross-post e WhatsApp de indicação, tudo editável no Admin.
- [x] Painel "Indicações (55+)" no menu do Super Admin: editor do
      banner, publicação manual (reaproveita o Publicador Mágico já
      existente, só prefixando `indicacao:true`), lista das indicações
      publicadas e lista informativa das vagas tradicionais que
      qualificam por idade.
- [x] Campo "Idade máxima" (+ toggle "Sem limite") adicionado ao
      formulário manual do Publicador Mágico — antes só o scraper
      preenchia esse dado.
- ⚠️ Playwright não conseguiu rodar neste ambiente (download do
      Chromium bloqueado pela allowlist de rede do sandbox) — validado
      com `npm run build` limpo + testes de render real via
      `react-dom/server` com dados mockados (IndicacaoCard,
      IndicacoesTab, IndicacoesAdminPanel com AIPublisher/JobCard
      aninhados) + checagem manual de cada import novo. Recomendo um
      clique real no navegador depois de subir, já que isso não
      substitui 100% o teste no Chrome de verdade.
- 🔜 Pendente (combinado pra depois): WhatsApp dedicado de verdade pra
      "Indicar uma vaga" (hoje o botão só aparece se o Admin configurar
      um número em `indicacoes_config.whatsapp_indicar`; sem número,
      fica escondido com uma mensagem "em breve").

## 🔧 v2.5.1 — Ativação manual do cross-post + WhatsApp no Admin
- [x] `vagas.indicacoes_ativa` (boolean, nova coluna) — antes, TODA
      vaga tradicional que qualificava por idade entrava sozinha no
      feed público. Agora só entra se o Admin **ativar** ela
      manualmente na lista "Vagas tradicionais que qualificam".
      Indicação manual (`indicacao=true`) continua sempre visível,
      sem depender dessa ativação.
- [x] `isIndicacaoElegivel` virou duas funções em `jobParsing.js`:
      `isIndicacaoQualificavel` (só o critério de idade) e
      `isIndicacaoVisivel` (qualifica + ativada, ou é manual).
- [x] Cada vaga qualificando agora mostra, direto na lista do Admin:
      botão de ativar/desativar, campo pra corrigir o WhatsApp (o
      scraper às vezes não captura esse campo) e o botão de contato com
      o **mesmo ícone oficial do WhatsApp** (`WhatsAppIcon`) usado no
      card da vaga.
- [x] Novo handler `handleUpdateJobWhatsapp` no App.jsx (patch simples
      via `updateJobInDB`, mesmo padrão dos outros handlers).
- Testado: build limpo + testes de render via `react-dom/server` com 4
  cenários (qualifica mas não ativa, qualifica e ativa, indicação
  manual, não qualifica) confirmando que `isIndicacaoVisivel` decide
  certo em cada caso, e o painel renderiza os botões certos conforme
  o estado de cada vaga.

