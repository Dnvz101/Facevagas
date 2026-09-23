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

## 🎨 v2.5.2 — Herói da aba Indicações virou imagem (fundo azul full-bleed)
- [x] Depois de várias rodadas de mockup HTML aprovadas em conversa, o
      `IndicacoesTab.jsx` foi reescrito: fundo azul-marinho contínuo
      (`-mx-5 -mt-6` cancela o padding do `<main>` só nessa aba, pra
      bater na borda da tela como as outras abas não fazem), herói
      agora é `/public/indicacoes-hero.png` (imagem gerada por IA,
      texto já embutido nos pixels — recortada e limpa localmente a
      partir do banner original que o ChatGPT gerou).
- [x] Cards "Indique aqui" / "Ver Indicações" com gradiente vívido
      (laranja/azul) + botão de seta circular, texto todo em branco
      (negrito no título E no subtítulo) — corrigido depois de um
      round de "texto preto sumindo no fundo colorido".
- [x] "Como funciona" virou card escuro translúcido com as 3 etapas em
      colunas centralizadas (número + texto centralizados), em vez da
      lista vertical antiga.
- [x] Botão de WhatsApp (grande + nos cards da lista) trocado do emoji
      📱 pro SVG oficial (`WhatsAppIcon`), mesmo ícone usado no
      `JobCard`.
- ⚠️ MUDANÇA IMPORTANTE: como o texto do herói agora é pixel de
      imagem, os campos "eyebrow/título/subtítulo" do
      `indicacoes_config` PARARAM DE FAZER EFEITO VISUAL — removidos
      do `IndicacoesConfigEditor` (só "idade mínima" e "WhatsApp de
      indicar" continuam editáveis de verdade). Pra mudar o texto do
      herói, precisa gerar uma imagem nova e substituir
      `/public/indicacoes-hero.png`.
- Testado: build limpo + `react-dom/server` confirmando que a imagem
  do herói, os textos dos cards e o "Como funciona" renderizam, e que
  o editor antigo (campo "Título") realmente sumiu do Admin.

## 🐛 v2.5.3 — Bugfix: Publicador Mágico não capturava idade mencionada
- [x] Achado testando de verdade: colei uma vaga com "até 53 anos" no
      texto e o campo "Idade máxima" ficou vazio no formulário — o
      campo existia na TELA (adicionado no v2.5.0) mas o PROMPT de
      extração da IA (`EXTRACTION_PROMPT` no AIPublisher.jsx) nunca
      pedia esse dado, então a IA simplesmente não olhava pra idade.
- [x] `EXTRACTION_PROMPT` agora pede "idadeMaxima" explicitamente, com
      regra clara: número quando o anúncio dá um teto real ("até X"),
      a string "sem limite" quando sinaliza abertura sem teto ("acima
      de X", "a partir de X", "~X anos", "sem limite/restrição de
      idade") — nunca inventa quando o anúncio não menciona idade.
- [x] Novo `extractIdadeMaxima()` em `jobParsing.js` — mesma régua,
      mas por regex, usado no parser LOCAL (fallback sem IA,
      `extractJobFromText`) pra cobrir os dois caminhos de extração,
      não só o da IA.
- [x] Merge no AIPublisher: IA tem prioridade; se ela não achou nada,
      cai pro fallback local; um valor "sem limite" (999) marca
      corretamente o checkbox "Sem limite de idade" em vez de mostrar
      literalmente "999" no campo de número.
- Testado com os DOIS anúncios reais que motivaram o achado ("até 53
  anos" e "Homens e mulheres ~50 anos") + mais 4 casos (sem menção,
  "sem limite de idade", "acima de 55 anos", "no máximo 45 anos") — os
  6 bateram certo. Testei também a lógica de merge IA+fallback
  isoladamente (5 cenários, todos corretos). Build limpo.

## 🔧 v2.5.4 — Ajuste de critério: "~N anos" agora captura o número, não "sem limite"
- [x] Testando com uma vaga real ("Homens ~60 anos"), a v2.5.3 marcou
      "Sem limite de idade" em vez de capturar "60" — era uma decisão
      minha (tratar "~N anos"/"acima de N" como sem-teto) que na
      prática esconde um número real que seria útil pra afinar a idade
      mínima do cross-post depois. Perguntei e o usuário confirmou:
      quer o número literal.
- [x] Regra nova em `extractIdadeMaxima` (jobParsing.js) e no
      `EXTRACTION_PROMPT` (AIPublisher.jsx): "até/no máximo/acima
      de/mais de/a partir de/~N anos/N anos ou mais" → sempre captura
      o número N. Só "sem limite de idade", "sem restrição de idade" e
      "qualquer idade" (quando o anúncio NÃO dá nenhum número) viram
      999.
- Testado com 8 casos incluindo o anúncio real da Tobishima ("~60
  anos" → 60) e o "até 53 anos" do v2.5.3 (continua 53) — todos
  corretos. Build limpo.

## 💬 v2.5.5 — WhatsApp sempre sai com mensagem "veio do NihonVagas"
- [x] Achado testando a lista "Vagas tradicionais que qualificam":
      quando o campo `whatsapp` da vaga é um número puro (a maioria),
      o botão de WhatsApp abria uma conversa EM BRANCO — só as vagas
      cujo scraper já entregava um link `wa.me/...?text=` pronto
      vinham com mensagem. `toWhatsAppLink` (format.js) agora aceita
      um 2º parâmetro opcional (`cargo`): quando informado E o número
      é puro (não veio como link pronto), monta
      `?text=Olá! Vi a vaga de *{cargo}* no NihonVagas.jp...`
      automaticamente.
- [x] Link que já vem pronto do scraper (com `?text=` dele mesmo)
      NUNCA é alterado — passa reto, do jeito que já funcionava.
- [x] Atualizado em todo lugar que é candidato falando com empresa
      sobre uma vaga específica: `JobCard.jsx`, `IndicacaoCard.jsx`,
      `IndicacoesAdminPanel.jsx` (botão de teste na lista de
      qualificam) — todos passam `job.cargo` agora.
- [x] ⚠️ Os 3 lugares que usam `toWhatsAppLink` pra CONTATO DE SUPORTE
      (`PlanComparisonCards`, `AlertBanner`, ambos com
      `ADMIN_WHATSAPP_RAW`) e o link de alerta de vagas em `App.jsx`
      continuam SEM passar cargo de propósito — eles já montam a
      própria mensagem por fora, e o `?text=` automático quebraria
      esse link (viraria dois `?text=` na mesma URL). Testado
      explicitamente que isso não regrediu.
- Testado com 4 cenários: número puro + cargo (ganha mensagem), número
  puro sem cargo (suporte — continua limpo), link pronto do scraper
  (nunca mexe), e a simulação exata do padrão usado em
  PlanComparisonCards/AlertBanner (confirmado só um `?text=` na URL
  final). Build limpo.

## 🔠 v2.5.6 — Fonte maior nos cards da lista (público 55+)
- [x] A pedido: como o público da campanha é gente mais velha, aumentei
      as fontes do `IndicacaoCard.jsx` o máximo que deu sem estourar o
      layout — tag de origem, empresa, cargo (14.5px→18px), local/idade,
      preço (13px→17px) e o botão de WhatsApp (11px→14px, ícone maior).
      Cabeçalho "Vagas indicadas"/contador e a nota de rodapé também
      cresceram um pouco, pra ficar consistente com o resto da leitura.
- [x] Rede de segurança: a linha preço+botão ganhou `flex-wrap` — em
      telas bem estreitas (≤360px) com preço em faixa ("¥1.200 ~
      ¥1.350/h") + fonte maior, o botão quebra pra linha de baixo em
      vez de estourar a lateral do card. Contas de largura na mão
      confirmam que em 360px o par preço+botão passa da largura
      disponível (~288px após padding), então o wrap realmente entra
      em ação nesse caso — comportamento esperado, não bug.
- ⚠️ Não consegui tirar print de verdade pra conferir visualmente
  (Playwright sem navegador disponível neste ambiente) — validei com
  render real via `react-dom/server` dos dois cards exatos do print
  que você mandou (Tobishima/Josi e Inuyama/Daikei) + build limpo.
  Vale um olhar seu no celular de verdade depois de subir.

## 🔗 v2.5.7 — Link direto pra cada aba (pra compartilhar no Facebook etc.)
- [x] Achado testando: não existia NENHUM jeito de linkar direto pra
      uma aba específica — todo link pro site sempre abria em "Vagas",
      mesmo compartilhando a URL enquanto em outra aba. `tab` era só
      estado do React, nunca refletido na URL.
- [x] Agora a URL sincroniza sozinha: trocar de aba atualiza
      `?tab=indicacoes` (ou empreiteiras/calculadora/comunidade) na
      barra de endereço via `history.replaceState` (sem recarregar a
      página nem empilhar histórico de navegador a cada clique); "Vagas"
      (padrão) mantém a URL limpa, sem parâmetro nenhum.
      → Pra compartilhar a aba Indicações: entra nela no site e copia a
      URL da barra de endereço — vai ficar `nihonvagas.jp/?tab=indicacoes`.
- [x] Ao ABRIR um link assim, o site já carrega direto na aba certa.
- ⚠️ Por segurança, só as abas públicas entram nesse esquema (vagas,
      empreiteiras, calculadora, comunidade, indicacoes) — um link
      com `?tab=admin` ou `?tab=minhaempresa` NUNCA abre esses painéis
      (caem pra "Vagas"), porque esses dependem de login de verdade,
      não só de trocar de aba.
- Testado com jsdom simulando o navegador: 4 casos de carregamento
  (limpo, `?tab=indicacoes`, `?tab=admin` bloqueado, `?tab=lixo`
  inválido) + 3 casos de sincronização ao trocar de aba (incluindo
  confirmar que trocar pra "admin" não mexe na URL) — os 7 bateram
  certo. Build limpo.

## 🚨 v2.6.0 — CONSERTO DE SEGURANÇA (leitura obrigatória antes de subir)
Achado revisando o projeto com calma: duas falhas reais, uma delas já
explorável hoje sem precisar de nada sofisticado.

**1) Vazamento de senha.** `fetchPartnersFromDB` fazia `select=*` na
tabela `parceiros`, e o login de empresa comparava e-mail/senha DIRETO
NO NAVEGADOR contra essa lista. Ou seja: a senha de TODA empresa
cadastrada (Empreiteira/Prestador/Loja) chegava em texto puro pro
navegador de QUALQUER visitante — dava pra ver abrindo Ferramentas do
Desenvolvedor → Rede, sem nem tentar logar.

**2) Escrita sem login.** Praticamente toda tabela (`vagas`, `banner`,
`planos`, `parceiros`, `indicacoes_config`, `comunidade_conteudo`,
`service_categories`, `service_listings`) tinha política de RLS
`using (true)` pra INSERT/UPDATE/DELETE — sem checar login nenhum. O
login de Super Admin só escondia os BOTÕES da tela; a URL do Supabase
é visível em qualquer requisição de rede, e com ela qualquer um
conseguia apagar vagas, reescrever banner, mudar preço de plano etc.
sem nunca ter logado.

### O que mudou
- [x] **3 novas Vercel Functions**: `api/partner-login.js` (login de
      empresa verificado no servidor, nunca mais no navegador),
      `api/partner-signup.js` (cadastro de empresa nova — único caso
      de escrita em "parceiros" sem sessão prévia; plano sempre
      "grátis" e selo sempre "false" fixados no servidor, nunca
      aceitos do navegador), `api/db-write.js` (portão único de
      escrita pra tudo mais sensível).
- [x] `api/admin-login.js` agora emite um **token de sessão assinado**
      (`api/_lib/session.js`, HMAC próprio via `crypto` do Node, sem
      dependência nova) em vez de só `success: true/false` — antes o
      login não deixava NADA que o servidor pudesse conferir depois.
- [x] `api/db-write.js`: confere o token antes de qualquer escrita.
      Admin tem acesso a uma lista fixa de tabelas; Parceiro só grava
      nas PRÓPRIAS linhas (`vagas.partner_id` / `service_listings.
      provider_id`), e esse "dono" é sempre decidido pelo SERVIDOR a
      partir do token — nunca aceito de um campo que o navegador
      mandou (testei explicitamente: mandar `partner_id` de outra
      empresa no corpo da requisição é ignorado, o servidor usa o
      dono de verdade).
- [x] `vagas.partner_id` (nova coluna) — com backfill automático pras
      vagas já publicadas (casadas por nome da empresa), pra nenhuma
      empresa perder o direito de editar o próprio anúncio depois
      dessa migração. O gateway permite editar uma linha já sua OU
      "reivindicar" uma linha ainda sem dono (`partner_id is null` —
      caso de vaga do scraper sendo assumida pela primeira vez).
- [x] `lib/supabase.js` reescrito: toda escrita sensível passa pelo
      gateway agora; os 4 contadores que QUALQUER visitante anônimo
      incrementa (clique no WhatsApp, visualização, favorito) ficaram
      num caminho público separado (`incrementJobStatInDB`), sem
      exigir login — e o banco (schema v24) só libera essas 4 colunas
      especificamente pra escrita pública, nunca o resto da vaga.
- [x] `schema.sql` v24: `revoke select (password) on parceiros` (fecha
      o vazamento na raiz, no banco — mesmo se algum código no
      frontend tentar pedir de novo, o banco recusa), `drop policy` em
      toda escrita `using(true)` das tabelas sensíveis, `grant update`
      restrito a 4 colunas em `vagas` pra `anon`.
- ⚠️ Fora do escopo dessa rodada, documentado como próximo passo:
  senha ainda em texto puro nas tabelas (era assim desde o início,
  não piorou nem melhorou aqui — migrar pra hash/Supabase Auth de
  verdade é o passo seguinte); o relógio de expiração automática de
  selos (🔥 Destaque/🆕 Nova Vaga) que roda no navegador de QUALQUER
  visitante agora só PERSISTE no banco quando alguém logado (Admin ou
  a própria empresa) está com a aba aberta no momento — o certo de
  verdade é isso virar um cron job no servidor, mas não dava pra
  incluir nessa mesma rodada sem arriscar qualidade.
- Testado: build limpo + checagem de imports em todos os arquivos
  novos/alterados + **12 cenários de autorização do gateway rodados
  de verdade** (chamando o handler real com `fetch` mockado): sem
  token→401, tabela fora da lista→403, parceiro em tabela de
  admin→403, admin escreve livre, parceiro sempre tem `partner_id`
  forçado pro próprio (mesmo mandando o de outra empresa no corpo),
  reivindicação de vaga sem dono funciona, upsert com
  `merge-duplicates`, delete sem filtro só pra Admin, parceiro NUNCA
  consegue delete sem filtro (o `or=` do dono sempre entra). Também
  testei a assinatura de sessão isolada: token adulterado rejeitado,
  expirado rejeitado, segredo diferente rejeitado, entradas
  inválidas nunca quebram (só retornam null).

### ⚠️ AÇÃO OBRIGATÓRIA ANTES DE PUBLICAR
1. Rodar o `schema.sql` inteiro de novo no SQL Editor do Supabase
   (contém o v24 no final).
2. Adicionar a variável de ambiente nova na Vercel:
   `ADMIN_SESSION_SECRET` — uma string aleatória longa (gere com
   `openssl rand -hex 32` ou parecido). Sem ela, login para de
   funcionar de propósito.
3. Depois de publicar, testar de verdade: login de Admin, login de
   uma empresa já cadastrada, cadastro de empresa nova, publicar/
   editar uma vaga como empresa, e publicar/editar como Admin —
   nessa ordem, porque essa mudança toca o coração de como tudo se
   autentica.

## 🐛 v2.6.1 — Dois bugs achados testando o v2.6.0 ao vivo

**1) Cliques/visualizações pararam de ser salvos.** Ao fechar a
escrita pública em `vagas`, o SQL do v24 removeu a política de UPDATE
(`vagas_public_update`) mas não recriou ela — só fez a parte de
"liberar 4 colunas" (GRANT), sem a parte de "liberar a linha" (RLS).
As duas são checadas JUNTAS: sem política de linha, nem as 4 colunas
liberadas gravavam nada. Resultado: todo clique/visualização de
visitante anônimo, entre publicar o v24 e essa correção, foi
silenciosamente recusado pelo banco e perdido (não tem como
recuperar). Corrigido recriando a política (`using (true)`, seguro
porque o GRANT de coluna já limita o que essa política permite tocar).

**2) "Impacto dos Selos" mostrando números absurdos (279.7x).** Bug
separado, não relacionado à segurança — já existia antes do v2.6.0,
só ficou visível agora porque a perda de cliques acima desbalanceou
ainda mais os dados. `computeImpactMultiplier` (utils/stats.js) só se
protegia contra dividir por EXATAMENTE zero — um grupo de comparação
com poucas visualizações (ex: 3 views, 1 clique = 33%) gera uma taxa
minúscula mas não-zero, e dividir por isso explode pra um número sem
sentido. Corrigido exigindo uma amostra mínima (20 visualizações) dos
dois lados antes de calcular qualquer proporção — abaixo disso, mostra
"Ainda sem dados suficientes" em vez de inventar um multiplicador.
- Testado: simulei o cenário exato do bug (grupo pequeno) → agora
  retorna null certo; cenário saudável com amostra boa → continua
  dando o número certo (4.0x); grupo com 0 views → null. Build limpo.

### Ação: rodar esse SQL isolado no Supabase (já está incluído no v24
atualizado, mas se você já rodou o v24 antes, só precisa desse trecho):
```sql
create policy "vagas_public_update" on public.vagas for update using (true);
revoke update on public.vagas from anon;
grant update (clicks, views, favoritos, daily_stats) on public.vagas to anon;
```

## 🐛 v2.6.2 — Ranking podia elegir vaga já arquivada (clique não ia a lugar nenhum)
- [x] Achado ao vivo: "Top 1 · Zero Nihongo" não navegava ao clicar.
      Causa: `RankingsTab` calculava os Top 5 em cima de `jobs` CRU
      (todas as vagas, incluindo arquivada/rascunho), mas
      `handleGoToJob` procura a vaga em `sortedJobs` (que já filtra
      essas fora, igual a aba Vagas mostra). Se a vaga #1 do ranking
      tivesse sido arquivada nesse meio-tempo — bem provável logo
      depois do relógio automático de expiração de selos rodar —, ela
      aparecia no ranking mas nunca era encontrada pra rolar até ela:
      falha silenciosa, sem erro nenhum na tela.
- [x] Corrigido passando `sortedJobs` (não `jobs`) pro `RankingsTab` —
      agora as duas telas usam exatamente a mesma lista de vagas
      visíveis, então o Ranking estruturalmente nunca mais pode eleger
      algo que não existe do outro lado.
- Testado: simulei o cenário exato (vaga #1 arquivada) — com `jobs`
  cru, a vaga eleita não era encontrada (bug confirmado); com
  `sortedJobs`, a vaga eleita é sempre encontrada. Build limpo.

## 🛡️ v2.6.3 — Rede de segurança contra ID duplicado (card "flipando todos juntos")
- [x] Relatado ao vivo: clicar num card pra virar, nas páginas 2/3/4
      da lista de Vagas, virava TODOS os cards daquela página junto.
      Sintoma clássico de dois registros com o mesmo `id` — o React
      trata cards com `id` repetido como "o mesmo componente", então
      virar um vira todos que compartilham aquele id. (Quando testado
      de novo, pareceu ter sumido sozinho — pode ter sido uma
      duplicata pontual que já não existe mais no banco.)
- [x] `fetchJobs` (lib/supabase.js) agora remove duplicata de `id`
      automaticamente (mantém só a primeira ocorrência) e avisa no
      console do navegador qual vaga foi ignorada — assim, se acontecer
      de novo, dá pra ver exatamente qual registro duplicou e de onde
      veio, sem o visitante nunca ver o bug do card se comportando
      estranho.
- Testado: simulei uma resposta do Supabase com um "id" repetido de
  propósito — a duplicata foi removida e o aviso certo apareceu no
  console. Build limpo.

## 🐛 v2.6.4 — Média salarial (e Top Salários) misturava hora com diária
- [x] Achado com print real: "Média salarial por estado" mostrava
      Aichi em ¥2.162, bem acima do que os cards realmente pagam
      (maioria ¥1.300-1.700/h). Causa: já existia proteção contra
      salário MENSAL contaminar os rankings, mas nunca contra DIÁRIO —
      um único "¥35.000/dia" (Fujiarte, Kanrisha) entrava na mesma
      soma que dezenas de vagas por hora, empurrando a média inteira
      do estado pra cima sozinho.
- [x] `isComparableSalary` (RankingsTab.jsx) agora só aceita "hora" —
      antes só excluía "mês", deixando "dia" passar junto. Afeta TODOS
      os rankings de salário de uma vez (Top Salários, Top Zero
      Nihongo, Top Moradia, Top Mukae, Top Homens/Mulheres, Média por
      Província), já que todos compartilhavam essa mesma checagem.
- Testado: reproduzi os valores aproximados dos 4 prints de vagas de
  Aichi que você mandou + o registro de ¥35.000/dia — a conta "antes"
  bateu em ¥2.279 (bem perto do ¥2.162 real, confirmando a causa); a
  conta "depois" caiu pra ¥1.481, condizente com os cards. Build
  limpo.

## ✨ v2.6.5 — Partículas discretas no rodapé
- [x] Adaptado de um componente do 21st.dev (feito originalmente pra
      Next.js/shadcn, tela cheia, 140 partículas com interação de
      hover) pra uma versão bem mais sutil: só 25 partículas, devagar,
      baixa opacidade, sem nenhuma interação — decoração de fundo, não
      protagonista da tela. Presa só à altura do rodapé (`position:
      relative` + `overflow:hidden`), nunca vaza por cima do resto do
      site.
- [x] Sem lógica própria de detecção de tema escuro — o site inteiro
      já resolve isso com UM filtro CSS (`nv-dark-invert`); o canvas
      das partículas segue essa mesma regra em vez de reimplementar
      detecção de tema com MutationObserver (como o componente
      original fazia, pensado pro next-themes).
      `pointer-events:none` garante que nunca atrapalha o clique nos
      links reais do rodapé (Termos, WhatsApp, etc.), mesmo estando
      por baixo deles visualmente.
- Testado: build limpo + render real (`react-dom/server`) do
  `SiteFooter` confirmando que a div do canvas e os links legais
  continuam presentes juntos.

## 🎲 v2.6.7 — Vagas sem Destaque agora aparecem em ordem aleatória
- [x] A pedido: antes, fora do grupo "Destaque" (que já tinha sorteio
      justo entre anunciantes), o resto das vagas era ordenado por
      cliques — mas com a maioria empatada em 0 cliques, o sort
      estável do JS mantinha a ordem de chegada do JSON na prática,
      então sempre as mesmas vagas apareciam por cima.
- [x] `sortedJobs` (App.jsx) agora sorteia um peso aleatório por vaga
      (mesmo esquema já usado pro Destaque) pra esse grupo também —
      Destaque continua sempre no topo, mas o resto passa a se
      distribuir aleatoriamente em vez de fixo por clique/chegada.
      Cliques continuam contando normalmente pras Estatísticas de Uso
      — só pararam de decidir a posição na lista.
- Testado: simulei 20 embaralhamentos — confirmado que Destaque sempre
  fica primeiro, a ordem é estável entre re-renders (não fica
  reembaralhando a cada clique), e uma vaga com 100 cliques não fica
  mais garantida no topo do grupo "outras". Build limpo.

## 📊 v2.6.8 — Resumo por parceiro em "Parceiros & Selos"
- [x] A pedido: cada parceiro na lista agora mostra um bloco de
      resumo (só quando já tem pelo menos 1 vaga publicada) com:
      total de cliques no WhatsApp, cliques/visualizações no card,
      curtidas — tudo somado de todas as vagas da empresa — e o uso de
      cada selo controlável (🔥 Destaque, ⭐ Recomendado, ⚡ Urgente)
      contra a cota do plano atual dela (ex: "Recomendado 2/3").
- [x] Selo que já bateu no limite da cota fica destacado em âmbar, pra
      o Admin identificar rápido quem está "cheio" antes de tentar
      ativar mais um selo pra essa empresa.
- [x] Selo sem direito nenhum no plano atual (cota 0) nem aparece na
      lista — evita ficar mostrando "Destaque 0/0" pra toda conta
      Grátis, que é informação sem uso nenhum.
- [x] Vínculo vaga↔empresa usa o mesmo critério (nome) que o resto do
      Admin já usa (handleToggleVerificado/handleRenamePartner), pra
      não introduzir uma segunda fonte de verdade divergente.
- Testado: render real (`react-dom/server`) com 3 vagas de uma empresa
  no plano Start (cota de 3 Recomendado) — soma de cliques bateu certo
  (55 WhatsApp), "Recomendado 3/3" apareceu com o destaque âmbar de
  limite batido, e uma empresa sem vaga nenhuma não mostrou bloco de
  resumo vazio. Build limpo.

## 🧮 v2.6.9 — Calculadora de salário: pausa noturna + horas Hiru/Yakin separadas
- [x] Achado comparando um quadro de turno real (Tokai Rika) com a
      calculadora: `calculateNightHours` calculava o adicional de 25%
      (22h~5h) olhando só entrada/saída do turno, sem descontar as
      pausas sem pagamento que caem dentro dessa janela — no turno
      noturno real (18:45~3:30, pausas de 45min + 10min de alongamento
      dentro do 22h~5h), isso inflava a conta de 4h35 reais pra 5h30
      calculadas, quase 1h de diferença por turno.
- [x] `calculateNightHours` (utils/kakeibo.js) ganhou um 3º parâmetro
      opcional (minutos de pausa dentro da janela) que desconta do
      resultado, nunca deixando ficar negativo.
- [x] Ponto separado, mas relacionado: "Horas padrão/dia" era UM único
      número pra turno diurno E noturno juntos, tanto na calculadora
      pública quanto no perfil completo do Kakeibo — quando na prática
      os dois podem ter pausas/horas líquidas diferentes. Virou dois
      campos (`standardHoursHiru`/`standardHoursYakin`) nos dois
      lugares, com fallback pro campo antigo em perfil já salvo (não
      quebra ninguém que já vinha usando).
- [x] `ProfileEditor.jsx` (perfil completo) e `SalaryCalculator.jsx`
      (aba pública) atualizados com os campos novos + texto explicando
      que só a pausa DENTRO do 22h~5h importa.
- Testado com os números reais do turno que motivou o achado: sem
  desconto de pausa dava 5.50h (o bug), com os 55min corretos dá
  4.58h (4h35, batendo com o quadro real). Testado também que perfil
  antigo (só com "standardHours", sem os campos novos) continua
  funcionando via fallback, e que pausa maior que a janela nunca gera
  resultado negativo. Render real dos dois componentes + build limpo.

## 🔧 v2.6.10 — Pausas por horário (não mais minutos calculados na mão)
- [x] Achado revisando o v2.6.9 junto com o contrato de trabalho real
      (Tokai Rika): pedir "quantos minutos de pausa caem no 22h~5h"
      forçava a pessoa a calcular isso na cabeça — mas o contrato (e o
      quadro de horários da empresa) já mostra as pausas como
      HORÁRIOS de início/fim, não como minutos prontos. O campo não
      batia com o formato que os dados realmente chegam.
- [x] `calculateNightHours` (utils/kakeibo.js) agora recebe uma lista
      de pausas (`[{start,end}, ...]`, até 3 por turno) em vez de um
      número de minutos — calcula sozinha quanto de cada pausa cai
      dentro do 22h~5h, sem a pessoa precisar somar nada.
- [x] Novo `breaksEditor` compartilhado (`fields.jsx`) — 3 pares de
      horário início/fim por turno, pausa em branco é ignorada.
      Reaproveitado tanto no perfil completo (`ProfileEditor.jsx`,
      hirukin E yakin) quanto na aba pública (`SalaryCalculator.jsx`,
      só yakin).
- [x] Perfil ganhou `hirukinBreaks`/`yakinBreaks` (arrays de 3 pausas)
      no lugar de `hirukinPauseMin`/`yakinPauseMin` — como o campo
      antigo foi lançado há poucas entregas (v2.6.9) e ainda não tinha
      chegado a ser usado de verdade, não criei fallback de
      compatibilidade pra ele (diferente do "standardHours" antigo,
      que sim tem usuário real).
- Testado copiando os horários EXATOS do contrato real (pausas
  20:45~20:55, 22:50~23:35, 1:35~1:45) — bateu certo em 4.58h (4h35),
  confirmando que a pausa das 20:45 (fora do 22h~5h) é corretamente
  ignorada e só as outras duas (55min) descontam. Testado turno
  diurno inteiro fora da janela (pausas não afetam nada, 0h) e pausa
  parcialmente preenchida (só uma das 3, resto ignorado sem erro).
  Render real dos dois componentes + build limpo.

## 🔍 v2.6.12 — Dica de conferência nas "Horas padrão/dia" (achou erro de digitação real)
- [x] A pedido: como "Horas padrão/dia" continua sendo digitado à mão
      de propósito (empresa que banca a pausa e paga as horas cheias
      existe, então não dá pra travar isso num cálculo automático), a
      calculadora agora mostra uma dica de REFERÊNCIA ao lado —
      entrada−saída menos as pausas do turno — sem forçar nada, só
      pra ajudar a pessoa a perceber se o número bate ou não.
- [x] Novo `calculateShiftNetHours` (utils/kakeibo.js) — span do turno
      inteiro menos todas as pausas preenchidas (diferente do
      `calculateNightHours`, que só olha a fatia dentro do 22h~5h).
- [x] Usado ao vivo com dados reais e achou um erro de digitação de
      verdade: uma pausa preenchida como "12:30→15:15" (quase 3h!)
      devia ser "12:30→13:15" (45min, almoço) — o campo teria
      calculado 5,67h quando o esperado era ~7,67h. Corrigido o
      próprio conteúdo de exemplo nos testes também (eu tinha
      sugerido um horário de pausa errado numa resposta anterior).
- [x] Aviso só aparece (em âmbar) quando a diferença passa de 0,1h —
      pequena discrepância (tipo empresa arredondando um número
      "oficial" que não bate exato com o relógio) não dispara alarme
      falso.
- [x] `ProfileEditor.jsx` (perfil completo, Hiru + Yakin) e
      `SalaryCalculator.jsx` (aba pública, só Yakin — reposicionei a
      dica pra ficar junto dos campos de horário do turno, não lá em
      cima antes da pessoa nem ter chegado neles).
- Testado com o cenário real da tela (pausa errada) — o aviso âmbar
  apareceu certo mostrando "5.67h calculado". Corrigindo a pausa pro
  valor certo (12:30→13:15, confirmado contra o quadro de turnos
  original), o cálculo sobe pra 7.67h — bem perto do 7.83h do
  contrato, com o aviso ainda aparecendo pela diferença pequena
  (comportamento esperado, não bug). Build limpo.

## 🎨 v2.6.11 — Resumo do salário fixo no topo ao rolar (Kakeibo)
- [x] A pedido: o card azul "Líquido estimado" no topo do perfil
      (`ProfileEditor.jsx`, aba Calculadora → Perfis) agora fica FIXO
      na tela enquanto rola (igual o cabeçalho do site), compacto, e
      trocou de azul pra verde — a mesma cor/estilo do card de
      fechamento "Saldo Líquido" que já existia lá embaixo.
- [x] Passou a mostrar bruto − descontos = líquido numa linha só (info
      que antes só aparecia no card de baixo), em vez de só o número
      líquido sozinho — resumido pra caber numa faixa fina.
- [x] `top-[142px]` é a altura estimada do cabeçalho do site (logo +
      abas de navegação) — não consigo confirmar o pixel exato sem
      testar num navegador de verdade; se a faixa verde ficar um
      pouco alta ou baixa demais em relação à borda do cabeçalho, é
      só ajustar esse número.
- [x] Card verde de fechamento no final da tela (Proventos/Descontos)
      continua no lugar, sem mudança — a faixa fixa é um resumo
      rápido sempre à vista, não substitui o detalhamento completo.
- Testado: render real (`react-dom/server`) confirmando que o
  gradiente verde entrou, o azul antigo saiu, e a faixa mostra
  bruto−descontos=líquido. Build limpo.

## 🎚️ v2.6.13 — Toggle "Turno de 8h" (esconde pausas quando não fazem diferença)
- [x] A pedido: pra empresa que paga o turno cheio (8h) sem descontar
      pausa nem do salário nem do adicional noturno, preencher os
      horários de pausa é trabalho sem utilidade nenhuma — agora tem
      um Sim/Não ("Turno de 8h — empresa paga cheio?") perto de cada
      campo "Horas padrão/dia". Marcando "Sim", o editor de pausas
      daquele turno some da tela e some do cálculo por igual (mesmo
      que ainda tenha pausa preenchida de antes de marcar).
- [x] `hirukinTurno8h`/`yakinTurno8h` (perfil completo) e
      `yakinTurno8h` (aba pública, só tem turno noturno) — nos dois
      lugares, `computeProfilePayslip`/`SalaryCalculatorContent`
      passam `[]` no lugar das pausas guardadas quando o toggle está
      em "Sim", então uma pausa "esquecida" preenchida antes de trocar
      pra "Sim" não afeta mais nada.
- [x] O aviso de comparação (v2.6.12) some junto quando "Sim" está
      marcado — comparar "horas digitadas" com "span menos pausa" não
      faz sentido nesse modo, já que a pausa nem entra na conta.
- Testado: perfil padrão (Não) mostra o editor de pausas normal;
  perfil com os dois turnos em "Sim" não mostra editor nenhum, mostra
  a explicação do porquê, e não mostra mais o aviso de divergência.
  Confirmado com um turno real que cruza o 22h~5h que o cálculo do
  adicional noturno realmente MUDA entre os dois modos (¥2.063 vs
  ¥4.125 no cenário de teste) — prova que a pausa é mesmo ignorada
  quando "Sim" está marcado, não só escondida da tela. Build limpo.

## 📍 v2.6.14 — Editor de pausas movido pra perto do Sim/Não "Turno de 8h"
- [x] A pedido: o editor de pausas ficava numa seção separada
      ("Turnos Nikoutai"), longe do Sim/Não "Turno de 8h" (que fica em
      "⚙️ Dados Contratuais") — quem marcava "Não" tinha que rolar a
      tela até uma seção diferente pra achar os campos que acabaram
      de ficar relevantes.
- [x] Movido: o editor de pausas (e o aviso de comparação do v2.6.12)
      agora abre direto abaixo do próprio Sim/Não, na mesma seção —
      tanto no perfil completo (`ProfileEditor.jsx`, Hiru e Yakin)
      quanto na aba pública (`SalaryCalculator.jsx`, Yakin).
- [x] "Turnos Nikoutai" continua só com os horários de início/fim de
      cada turno (isso sim faz sentido ficar junto do resto da
      identidade do turno) + uma nota curta apontando pra onde foram
      as pausas, pra quem chegar primeiro nessa seção não ficar
      perdido.
- Testado: render real confirmando a nova ordem (Dados Contratuais →
  toggle → pausas, tudo antes de chegar em Turnos Nikoutai) nos dois
  componentes, e que a seção de Turnos Nikoutai não tem mais o editor
  de pausas duplicado. Build limpo.

## ↩️ v2.6.15 — Removida a pauta de pausas (voltou a ser campo simples) + Teate Hiru/Yakin
- [x] A pedido: todo o sistema de pausas/turno8h (v2.6.9 a v2.6.14) foi
      revertido. "Horas padrão/dia" voltou a ser só um número digitado
      direto (ex: 8, 7,8), sem editor de pausas, sem toggle "Turno de
      8h", sem aviso de comparação. `calculateNightHours` voltou à
      versão simples (só entrada/saída do turno, sem descontar pausa).
- [x] `calculateShiftNetHours` e `breaksEditor` removidos do código
      (não sobrou nenhum uso depois da reversão).
- [x] Peça nova, aproveitando a limpeza: **Teate separado por turno**
      (`teatePerHour` pro Hiru — nome mantido por compatibilidade —,
      `teatePerHourYakin` novo pro Yakin) — tem fábrica que paga um
      adicional diferente à noite (ex: ¥100 no Hiru, ¥200 no Yakin).
      Zangyo normal soma no teate do Hiru, zangyo noturno soma no do
      Yakin (mesmo raciocínio já usado pra separar as horas padrão).
- [x] Modo "Base + Teate" do Zangyo também ficou correto por turno:
      zangyo diurno usa Jikyu+Teate do Hiru, zangyo noturno usa
      Jikyu+Teate do Yakin (antes usava só o teate do Hiru pros dois).
- [x] Bônus condicional "porHora" continua ligado só ao Teate do Hiru
      (não duplicado pro Yakin) — texto explicativo do painel
      atualizado pra deixar isso claro.
- [x] `ProfileEditor.jsx` e `SalaryCalculator.jsx` (aba pública)
      atualizados nos dois — grade de "Dados Contratuais" ganhou os
      dois campos de Teate lado a lado.
- Testado: render real confirmando que sumiu todo vestígio de
  pausas/turno8h nos dois componentes, que os dois campos de Teate
  aparecem, e a matemática (¥100/h Hiru + ¥200/h Yakin, 10 dias/8h
  cada turno = ¥24.000 esperado) bateu exato. Build limpo.
## 💬 v2.6.16 — WhatsApp sempre menciona NihonVagas, mesmo em link pronto do scraper
- [x] Achado com um JSON real do scraper: quando ele já entrega o
      link pronto (`https://wa.me/...?text=...`), a mensagem embutida
      é genérica ("Olá, estou interessado na vaga...") e NUNCA
      menciona o NihonVagas — o v2.5.5 só cobria o caso de número
      puro (sem link pronto), então boa parte das vagas do scraper
      ficava de fora dessa mensagem.
- [x] `toWhatsAppLink` (format.js) agora reconstrói a mensagem SEMPRE
      que tem `cargo` (candidato falando sobre uma vaga específica),
      mesmo partindo de um link pronto — extrai só o número do link
      (nunca tenta "consertar" prefixo de país) e troca o texto pela
      mensagem padrão mencionando NihonVagas.jp.
- ⚠️ Achado separado, fora do alcance desse conserto: o JSON tinha um
      link com `55` (código do Brasil) em vez de `81` (Japão) —
      `wa.me/558051560609` em vez de `wa.me/818051560609`. Isso é bug
      no SCRAPER (script Python separado, fora deste repositório), não
      no site. O conserto de hoje preserva esse número exatamente como
      veio (não tenta adivinhar/reescrever o prefixo, pra nunca deixar
      pior) — mas o número em si continua errado até corrigir na
      origem. Vale revisar a lógica de montagem do link no scraper.
- Testado com o JSON exato que você mandou (incluindo o número com o
  bug 55/81) + 4 cenários de regressão: sem cargo não muda nada, link
  pronto sem cargo passa reto, número puro com cargo continua igual
  ao v2.5.5, e o link de suporte (PlanComparisonCards) continua com
  só um "?text=" na URL final. Build limpo.
## 📋 v2.6.17 — Importação de JSON ganhou tela de revisão antes de publicar
- [x] A pedido: antes, subir o .json gravava DIRETO no banco sem
      nenhuma chance de revisar. Agora o fluxo é: sobe o arquivo →
      aparece uma lista de revisão (cargo + salário de cada vaga, com
      checkbox) → só grava de verdade ao clicar em "Publicar".
- [x] Cada linha mostra: checkbox, título, empresa/cidade, tag
      "Atualização" quando já existe (deduplicada), e o salário — ou
      um aviso "⚠️ Sem salário" no lugar do valor.
- [x] Vaga sem título mostra "Sem título" em itálico âmbar no lugar do
      texto vazio; linha inteira fica com fundo âmbar claro quando
      falta título OU salário. Um resumo no topo mostra quantas vagas
      têm algum aviso, mas nenhuma é desmarcada automaticamente — a
      decisão de manter ou não fica com quem está revisando.
- [x] Checkbox "marcar/desmarcar todas" no topo da lista, contador de
      quantas estão selecionadas, e botão "Cancelar" pra descartar a
      importação sem gravar nada.
- [x] Lista com altura máxima e rolagem própria (não empurra a página
      inteira pra baixo em lotes grandes).
- Testado: estado inicial (antes de subir arquivo) mostra só o
  dropzone, sem botão Publicar. Lógica de detecção de aviso testada
  com `mapScrapedJob` de verdade em 4 cenários (vaga completa, sem
  título, sem salário, sem nada) — os 3 casos problemáticos foram
  identificados corretamente. Build limpo.
## 🗂️ v2.6.18 — Filtros na tabela de vagas + arquivamento configurável + remove conflito de Verificado
- [x] **Filtros**: "Vagas cadastradas" (Admin) ganhou dois selects —
      Status (Todas/Ativas/Preenchidas/Arquivadas) e Província (lista
      dinâmica, montada a partir das vagas que existem). Combinam com
      a busca por texto já existente.
- [x] **Dias até arquivar, configurável**: era um número fixo (9 dias)
      direto no código (`STALE_THRESHOLD_MS`). Agora tem um campo na
      tela do Admin (acima da tabela de vagas) pra digitar quantos
      dias sem o scraper ver a vaga até ela arquivar sozinha — salvo
      na tabela nova `site_config` (singleton, mesmo padrão de
      `indicacoes_config`, escrita só via gateway com sessão de
      Admin). `isJobStale` ganhou um 3º parâmetro opcional (o limite
      em dias); sem ele, cai no padrão de 9 dias de sempre.
- ⚠️ Continua só ARQUIVANDO, nunca deletando de verdade — isso já era
      proposital (dado nunca se perde, sempre reversível) e não mudei
      esse comportamento. Se quiser um limite adicional pra apagar de
      verdade depois de arquivada por muito tempo, isso é uma decisão
      à parte (mais arriscada, irreversível) que prefiro confirmar
      com você separadamente antes de implementar.
- [x] Confirmado: vaga arquivada que aparece de nov num JSON reimportado
      volta a ficar ativa sozinha (o `lastSeenAt` atualiza e o
      `isJobStale` já checa isso desde sempre) — não mudei esse
      comportamento, só confirmei que continua funcionando com o
      limite configurável.
- [x] **Removido o conflito do Selo Verificado**: a tabela de vagas do
      Admin tinha um botão clicável de "Verificado" POR VAGA, que
      brigava com o Selo Verificado gerenciado em "Parceiros & Selos"
      (por EMPRESA) — ligar um lá sobrescrevia o outro sem avisar.
      Virou `canToggleVerificado={false}` no Admin (mesma trava que a
      Área do Cliente já tinha) — agora "Verificado" aparece só como
      informação (cinza, não clicável) na tabela de vagas; a única
      forma de mudar é em "Parceiros & Selos".
- Testado: `isJobStale` com limite customizado (3 dias arquiva uma
  vaga de 5 dias, 10 dias não arquiva a mesma vaga — os dois batendo
  certo), vaga de empresa cadastrada nunca arquiva mesmo com limite de
  1 dia, e reimportação reativa corretamente. Filtros testados com 6
  cenários combinados (status sozinho, província sozinha, os dois
  juntos, busca+status) — todos bateram. Build limpo.
## ☑️ v2.6.19 — Vaga sem título/salário já entra desmarcada na revisão
- [x] A pedido: na lista de revisão do import (v2.6.17), vaga com
      aviso (sem título e/ou sem salário) agora entra DESMARCADA por
      padrão — antes entrava marcada igual as outras, e a decisão
      "publicar mesmo assim" tinha que ser tomada ativamente desmarcando.
      Agora é o oposto: só publica se marcar de volta, de propósito.
- [x] Texto do aviso ajustado pra refletir o novo comportamento.
- Testado com 3 cenários (vaga completa, sem título, sem salário) —
  a completa vem marcada, as duas com problema vêm desmarcadas. Build
  limpo.
## 🟢 v2.6.20 — Banner "Vagas atualizadas a cada hora" virou contador real de 7 dias
- [x] A pedido: trocado "Vagas atualizadas a cada hora" (texto fixo)
      pelo número REAL de vagas tocadas por um import nos últimos 7
      dias — conta vaga nova E atualizada igual (as duas passam por
      `mapScrapedJob` no import, que sempre atualiza `lastSeenAt` pra
      "agora"), do jeito que foi pedido. Não é número fixo nem
      aleatório — é `jobs.filter(lastSeenAt dentro de 7 dias).length`.
- [x] Ícone trocou de relógio estático pra um ponto branco com
      `animate-pulse` (efeito "ao vivo"), mesmo quadrado azul de
      antes. Resto do banner (subtítulo, "Sem cadastro/Um toque/Fale
      direto", "Vagas reunidas de diversas fontes") ficou 100%
      intocado, como pedido.
- [x] `InfoBanner`/`BannerCard`/`BannerEditor` ganharam prop `jobs`
      (default `[]`, seguro mesmo se algum call site esquecer de
      passar) — encadeado até o App.jsx nos 3 pontos onde são usados.
- Testado com 5 vagas de idades variadas (1, 6, 8 dias e uma sem
  `lastSeenAt`) — contou certinho só as 3 dentro da janela de 7 dias,
  resto do banner permaneceu idêntico. Build limpo.
## 🟢 v2.6.21 — "Vagas reunidas de fontes" subiu pra logo abaixo do subtítulo, textos com "Vagas" na frente + brilho em "Exclusivas"
- [x] A pedido: o bloco de fontes (antes lá embaixo, depois do trio
      "Sem cadastro/Um toque/Fale direto", com o rótulo "Vagas
      reunidas de diversas fontes:") subiu pra logo abaixo do
      subtítulo "Novas oportunidades todos os dias, incluindo vagas
      exclusivas." — é a primeira coisa que aparece depois da
      mensagem de contagem.
- [x] Trocado o grid 2x2 compacto (com truncate) por uma lista vertical
      de 4 linhas, já que os textos novos são mais longos.
- [x] Rótulos trocados, todos começando com "Vagas" como pedido:
      "Vagas direto do Facebook (dezenas de comunidades)", "Vagas dos
      sites de emprego", "Vagas direto da empreiteira", "Vagas
      Exclusivas". Instagram saiu da lista (não foi pedido no novo
      texto); ícone de "Exclusivas" virou uma estrela.
- [x] "Exclusivas" ganhou efeito de brilho animado (gradiente azul
      correndo pelo texto, `nv-text-shine`/`@keyframes nv-shine` novos
      no `index.css`) — só essa palavra anima, "Vagas" fica no texto
      normal, igual foi pedido ("dar um efeito de animação no
      EXCLUSIVAS").
      `BANNER_SOURCES` (era só usado por essa seção) ganhou os campos
      `suffix` e `shine` pra isso.
- Testado renderizando o `InfoBanner` isolado num harness Playwright:
  os 4 itens aparecem na nova posição, "Exclusivas" muda de tom entre
  dois momentos (confirma que a animação está rodando). `npm run
  build` limpo; CSS de produção confere com `grid-cols-3` e
  `nv-text-shine` presentes no bundle final.
## 🟣 v2.6.22 — Lista de fontes virou diagrama "tudo converge pro NihonVagas"
- [x] A pedido ("não gostei, vamos brincar com outro estilo" + prompt
      de referência de um componente de integração 21st.dev/shadcn):
      troquei a lista vertical da v2.6.21 por um diagrama visual —
      Facebook, Sites de emprego, Empreiteira e Exclusivas nas 4
      pontas, com linhas animadas fluindo PRA DENTRO, convergindo pro
      "N" do NihonVagas no centro (`SourcesFlowDiagram`, novo, dentro
      de `BannerCard.jsx`).
- [x] O componente de referência era TypeScript + shadcn + Base UI +
      pacote `motion` — nosso projeto é JS puro (sem TS, sem shadcn),
      então recriei o efeito só com Tailwind + SVG + CSS puro (mesmo
      padrão já usado no projeto pros badges com glow), sem adicionar
      nenhuma dependência nova no `package.json`.
- [x] `index.css` ganhou `@keyframes nv-flow-dash` (traço animado
      "andando" ao longo da linha, sentido fonte→centro) e
      `@keyframes nv-orbit-ping` (anel pulsando atrás do "N", como um
      radar/sinal chegando).
- [x] `BANNER_SOURCES` foi removido (não é mais usado em lugar nenhum
      — confirmado com grep antes de tirar) e substituído por
      `FLOW_NODES` + `flowPath()`, que calculam a posição de cada
      ícone e o caminho SVG em "cotovelo" até o centro a partir de um
      viewBox fixo (400x230), sem números soltos espalhados pelo JSX.
- [x] "Exclusivas" manteve o efeito de brilho (`nv-text-shine`) da
      v2.6.21, agora aplicado no rótulo abaixo do ícone de estrela.
- ⚠️ Achado durante o teste: o harness de preview com Tailwind via
  CDN (usado nas versões anteriores pra screenshot rápido) tem um bug
  próprio — `position: absolute` e `grid-cols-3` não renderizam
  certo por lá, mesmo com o código correto. Passei a testar visual
  trocando temporariamente o `src/main.jsx` pra renderizar só o
  `InfoBanner`, rodando o `vite` de verdade do projeto (pipeline real
  do PostCSS/Tailwind), tirando o screenshot, e restaurando o
  `main.jsx` original depois — confirmado com `diff` que voltou
  idêntico. Com o pipeline real, diagrama, brilho, grid de 3 colunas
  e tudo mais renderizaram exatamente como esperado. `npm run build`
  limpo depois da restauração.
