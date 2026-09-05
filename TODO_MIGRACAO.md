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

