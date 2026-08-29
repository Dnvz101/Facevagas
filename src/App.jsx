// ---------------------------------------------------------------
// App.jsx — componente raiz. Reúne todo o estado global, carregamento
// inicial do Supabase, e roteamento entre as abas. Adaptações feitas
// nessa montagem (documentadas nos pontos exatos abaixo):
//  1. Removido <GlobalStyle /> — o CSS já entra globalmente via
//     src/index.css (importado em main.jsx), não precisa mais ser
//     injetado por um componente React.
//  2. Login do Super Admin já vinha adaptado do PartnerAuthModal.jsx
//     (chama a Vercel Function, não compara texto puro).
//  3. STORAGE_BACKEND/claudeAdapter não existem mais — sempre Supabase.
// ---------------------------------------------------------------

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Sun, Moon, LogIn, Calculator, LogOut, X, Bell, MessageCircle,
  Briefcase, TrendingUp, Users, Building2,
} from "lucide-react";

import BannerCard, { BannerEditor } from "./components/BannerCard.jsx";
import FilterBar from "./components/FilterBar.jsx";
import { AlertBanner, AlertBannerEditor, WhatsAppAlertModal } from "./components/AlertBanner.jsx";
import JobCard from "./components/JobCard.jsx";
import RankingsTab from "./components/RankingsTab.jsx";
import KakeiboApp from "./components/kakeibo/KakeiboApp.jsx";
import SalaryCalculatorModal from "./components/kakeibo/SalaryCalculator.jsx";
import CommunidadeTab from "./components/CommunidadeTab.jsx";
import DbStatusBadge from "./components/DbStatusBadge.jsx";
import PlanosManager from "./components/PlanosManager.jsx";
import AIPublisher from "./components/AIPublisher.jsx";
import JSONImporter from "./components/JSONImporter.jsx";
import JobsTable from "./components/JobsTable.jsx";
import StatsDashboard from "./components/StatsDashboard.jsx";
import CommunityAdminPanel from "./components/CommunityAdminPanel.jsx";
import ServiceCategoryManager, { ServiceListingsAdminPanel } from "./components/ServiceCategoryManager.jsx";
import ProviderDashboard from "./components/ProviderDashboard.jsx";
import ClientDashboard from "./components/ClientDashboard.jsx";
import PartnerAuthModal from "./components/PartnerAuthModal.jsx";
import AdminSwitcherMenu from "./components/AdminSwitcherMenu.jsx";
import PartnerManagementModal from "./components/PartnerManagementModal.jsx";
import IosInstallHelpModal from "./components/IosInstallHelpModal.jsx";

import { usePermissions } from "./hooks/usePermissions.js";

import {
  backendReady,
  fetchJobsFromDB, insertJobToDB, insertJobsBulkToDB, updateJobInDB, deleteJobFromDB,
  fetchBannerFromDB, upsertBannerInDB,
  fetchCommunityBannerFromDB, upsertCommunityBannerInDB,
  fetchAlertBannerFromDB, upsertAlertBannerInDB,
  fetchAlertSubscriptionsFromDB, insertAlertSubscriptionToDB,
  fetchSiteStatsFromDB, upsertSiteStatsInDB,
  fetchCommunityContentFromDB, insertCommunityContentToDB, deleteCommunityContentFromDB,
  fetchServiceCategoriesFromDB, upsertServiceCategoriesInDB,
  fetchServiceListingsFromDB, insertServiceListingToDB, updateServiceListingInDB, deleteServiceListingFromDB,
  fetchPlanosFromDB, upsertPlanosInDB,
  fetchPartnersFromDB, upsertPartnersInDB,
} from "./lib/supabase.js";
import { personalStorageGet, personalStorageSet } from "./lib/personalStorage.js";

import { uid, simplifyNihongo } from "./utils/jobParsing.js";
import { toWhatsAppLink } from "./utils/format.js";
import { bumpDailyStat, generateAppIcon } from "./utils/misc.js";
import { isDestaqueCicloConcluido, isNovoCicloConcluido, isJobStale } from "./utils/badgeCycles.js";
import { CATEGORY_COLOR_OPTIONS } from "./utils/categoryStyle.js";

import { PLANOS_DEFAULT } from "./config/plans.js";
import { ADMIN_TOOL_TITLES, FAVORITES_STORAGE_KEY, SERVICE_LIKES_STORAGE_KEY } from "./config/constants.js";
import { initialJobs, initialRegisteredPartners, SERVICE_CATEGORIES_SEED, SERVICE_LISTINGS_SEED } from "./config/seedData.js";

export default function App() {
  const [jobs, setJobs] = useState(initialJobs);
  const [tab, setTab] = useState("vagas");
  const [flippedIds, setFlippedIds] = useState(() => new Set());

  // Favoritos — pessoal (window.storage shared:false), então cada
  // pessoa vê só a própria lista, independente de quem mais usa o site.
  // "favoritesLoaded" evita que o efeito de salvar (mais abaixo) dispare
  // antes da carga inicial terminar e sobrescreva com o valor padrão
  // (mesmo cuidado que já existe no Kakeibo).
  const [favoriteJobIds, setFavoriteJobIds] = useState(() => new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  // Modo escuro — preferência pessoal (window.storage pessoal), mesma
  // lógica de carregamento/gravação dos favoritos.
  const DARK_MODE_KEY = "dark-mode-pref";
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await personalStorageGet(DARK_MODE_KEY);
        if (!cancelled && typeof saved === "boolean") setDarkMode(saved);
      } catch (err) {
        // sem valor salvo ainda — mantém o padrão (claro)
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const handleToggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      personalStorageSet(DARK_MODE_KEY, next).catch((err) => console.error("Falha ao salvar preferência de tema:", err));
      bumpSiteStat(next ? "darkModeOn" : "darkModeOff");
      return next;
    });
  };

  // Autenticação unificada de parceiros (Empreiteira/Prestador/Loja)
  const [registeredPartners, setRegisteredPartners] = useState(initialRegisteredPartners);
  const [partnerAuthModalOpen, setPartnerAuthModalOpen] = useState(false);
  const [partnerManagementOpen, setPartnerManagementOpen] = useState(false);
  // Nasce DESLIGADO — diferente do artifact de teste (que ficava
  // sempre ligado pra facilitar a prévia). Aqui é o site publicado de
  // verdade: o menu/ferramentas de Super Admin só aparecem depois de
  // logar de verdade (via api/admin-login.js), nunca por padrão.
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Simulador de Salário Líquido (Tedori) — acessível pelo cabeçalho ou
  // por qualquer JobCard (já preenchendo o Jikyu daquela vaga).
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [calcInitialJikyu, setCalcInitialJikyu] = useState(1500);
  const handleOpenCalculator = (jikyu) => {
    setCalcInitialJikyu(jikyu || 1500);
    setCalcModalOpen(true);
  };

  /* ---------------------------------------------------------------
     PWA — "Adicionar à tela de início". Duas rotas bem diferentes:
     • Android/Chrome: o navegador dispara "beforeinstallprompt" quando
       a página tem manifest válido + é servida em HTTPS — a gente
       intercepta, guarda o evento e mostra nosso próprio botão em vez
       do banner nativo do navegador; ao clicar, chama .prompt().
     • iOS/Safari: NUNCA existe esse evento (Apple não suporta) — o
       único jeito é instrução manual (Compartilhar > Adicionar à Tela
       de Início), então mostramos um modal explicando o passo a passo.
     ⚠️ O manifest é injetado dinamicamente aqui (via Blob URL), então
     esse botão já fica funcional assim que o site for publicado de
     verdade (Vercel/domínio próprio, HTTPS). Dentro da prévia do
     artifact aqui no Claude, o navegador pode não disparar o evento
     nativo do Chrome mesmo assim — normal, é uma limitação do preview,
     não do código em si.
  --------------------------------------------------------------- */
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [showIosInstallHelp, setShowIosInstallHelp] = useState(false);
  const isIosDevice = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), []);

  useEffect(() => {
    setIsStandaloneApp(
      window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true
    );

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Injeta manifest.json (via Blob) + meta tags de PWA/iOS no <head>.
    const icon192 = generateAppIcon(192);
    const icon512 = generateAppIcon(512);
    const manifest = {
      name: "NihonVagas.jp — Vagas no Japão",
      short_name: "NihonVagas",
      start_url: ".",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#2563eb",
      icons: [
        { src: icon192, sizes: "192x192", type: "image/png" },
        { src: icon512, sizes: "512x512", type: "image/png" },
      ],
    };
    const manifestBlobUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/json" }));
    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = manifestBlobUrl;
    document.head.appendChild(manifestLink);

    const appleIconLink = document.createElement("link");
    appleIconLink.rel = "apple-touch-icon";
    appleIconLink.href = icon192;
    document.head.appendChild(appleIconLink);

    const metaTags = [
      { name: "theme-color", content: "#2563eb" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "NihonVagas" },
    ];
    const addedMetaEls = metaTags.map(({ name, content }) => {
      const el = document.createElement("meta");
      el.name = name;
      el.content = content;
      document.head.appendChild(el);
      return el;
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      document.head.removeChild(manifestLink);
      document.head.removeChild(appleIconLink);
      addedMetaEls.forEach((el) => document.head.removeChild(el));
      URL.revokeObjectURL(manifestBlobUrl);
    };
  }, []);

  const canShowInstallButton = !isStandaloneApp && (installPromptEvent || isIosDevice);

  const handleInstallClick = async () => {
    bumpSiteStat("pwaInstallClicks");
    if (installPromptEvent) {
      installPromptEvent.prompt();
      await installPromptEvent.userChoice;
      setInstallPromptEvent(null);
    } else if (isIosDevice) {
      setShowIosInstallHelp(true);
    }
  };

  // Área do Cliente — não é mais uma "view" separada, é só mais uma aba
  // ("minhaempresa") dentro do MESMO shell público, o que mantém a
  // navegação global (Vagas/Empreiteiras/Calculadora) sempre visível.
  // A empresa ativa é guardada só pelo ID e sempre derivada de
  // registeredPartners (ver currentClientCompany abaixo) — assim, se o
  // Super Admin mudar o plano/selo dela em Parceiros & Selos, quem está
  // logado vê a mudança instantaneamente, sem precisar deslogar e logar
  // de novo.
  const [currentClientCompanyId, setCurrentClientCompanyId] = useState(null);
  const currentClientCompany = useMemo(
    () => registeredPartners.find((p) => p.id === currentClientCompanyId) || null,
    [registeredPartners, currentClientCompanyId]
  );

  const [banner, setBanner] = useState({
    mode: "info",
    imageUrl: null,
    text: "⚠️ Aviso à comunidade: o nihonvagas.jp não cobra nenhuma taxa de candidatos. Desconfie de pedidos de pagamento antecipado, depósitos ou \"taxas de reserva de vaga\". Denuncie tretas para nossa equipe.",
  });

  // Banner do topo da aba Comunidade (Prestadores de Serviço) — igual ao
  // banner principal (mesmo componente, mesma configuração de
  // texto/imagem), só que separado, editável à parte no Admin.
  const [communityBanner, setCommunityBanner] = useState({
    mode: "info",
    imageUrl: null,
    text: "🤝 Espaço da comunidade: aqui, quem presta serviço com dedicação é valorizado. Cadastro e divulgação sempre gratuitos — sem taxa, sem plano pago, sem pegadinha.",
    enabled: true, // ligado por padrão — Admin pode desativar se quiser, mas nasce ativo
  });

  // Alerta de Vagas (WhatsApp) — banner de CTA (editável pelo Admin) +
  // lista de inscrições coletadas (visível pro Admin gerenciar).
  // ⚠️ "enabled" começa DESLIGADO de propósito: a função ainda não tem
  // nenhum envio automático de verdade (isso depende de configurar uma
  // API de WhatsApp Business/backend real). Fica pronta e escondida até
  // você mesmo ligar pelo botão "Habilitar Função WhatsApp" no Admin.
  const [alertBannerConfig, setAlertBannerConfig] = useState({
    enabled: false,
    text: "🔔 Receba vagas novas no seu WhatsApp — configure seu alerta grátis",
  });
  const [alertSubscriptions, setAlertSubscriptions] = useState([]);
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  // Estatísticas de uso do site inteiro (Super Admin) — contadores
  // simples, sem cookies/rastreamento de pessoa. "SITE_STATS_DEFAULT"
  // define a forma inicial pra sempre ter um objeto completo, mesmo
  // antes de carregar nada do banco (evita "undefined" espalhado pelos
  // componentes que leem isso).
  const SITE_STATS_DEFAULT = {
    darkModeOn: 0,
    darkModeOff: 0,
    pwaInstallClicks: 0,
    whatsappSupportClicks: 0,
    alertBannerClicks: 0,
    filters: {}, // chaves compostas tipo "sexo:homens", "provincia:Aichi" — mais simples que aninhar 3 níveis
    tabs: {},
  };
  const [siteStats, setSiteStats] = useState(SITE_STATS_DEFAULT);

  // Gravação da estatística com atraso (debounce) — cliques em aba,
  // filtro, modo escuro etc podem disparar vários bumps em sequência
  // rápida (por exemplo, alguém navegando rápido entre abas). Gravar
  // cada um na hora batia no limite de taxa de escrita do
  // armazenamento do Claude ("Message rate limit exceeded"). Agora a
  // tela atualiza na hora (estado local instantâneo), mas só grava de
  // verdade 1,5s depois do último clique — se vier outro clique antes
  // disso, reinicia a espera e agrupa tudo numa gravação só.
  const siteStatsSaveTimeoutRef = useRef(null);
  const persistSiteStatsDebounced = (next) => {
    if (dbStatus !== "connected") return;
    if (siteStatsSaveTimeoutRef.current) clearTimeout(siteStatsSaveTimeoutRef.current);
    siteStatsSaveTimeoutRef.current = setTimeout(() => {
      upsertSiteStatsInDB(next).catch((err) => console.error("Falha ao salvar estatística:", err));
    }, 1500);
  };

  // Incrementa um contador simples (nível raiz) de siteStats, ex:
  // "pwaInstallClicks", "darkModeOn".
  const bumpSiteStat = (key) => {
    setSiteStats((prev) => {
      const next = { ...prev, [key]: (prev[key] || 0) + 1 };
      persistSiteStatsDebounced(next);
      return next;
    });
  };

  // Incrementa um contador dentro de um grupo (ex: filters.sexo.homens,
  // tabs.vagas) — cria a chave se ainda não existir.
  const bumpSiteStatGroup = (group, key) => {
    if (!key) return;
    setSiteStats((prev) => {
      const groupObj = { ...(prev[group] || {}) };
      groupObj[key] = (groupObj[key] || 0) + 1;
      const next = { ...prev, [group]: groupObj };
      persistSiteStatsDebounced(next);
      return next;
    });
  };

  const [dbStatus, setDbStatus] = useState(backendReady() ? "connecting" : "unconfigured");
  const [dbError, setDbError] = useState(null);

  // Comunidade — conteúdo curado pelo Admin (vídeos + categorias).
  const [communityContent, setCommunityContent] = useState([]);
  const handleAddCommunityContent = (item) => {
    const optimistic = { ...item, id: uid(), createdAt: Date.now() };
    setCommunityContent((prev) => [optimistic, ...prev]);
    if (dbStatus === "connected") {
      insertCommunityContentToDB(item).catch((err) => console.error("Falha ao salvar conteúdo da Comunidade:", err));
    }
  };
  const handleDeleteCommunityContent = (id) => {
    setCommunityContent((prev) => prev.filter((i) => i.id !== id));
    if (dbStatus === "connected") {
      deleteCommunityContentFromDB(id).catch((err) => console.error("Falha ao excluir conteúdo da Comunidade:", err));
    }
  };

  // Prestadores de Serviço da Comunidade — categorias (lista simples,
  // substituída inteira a cada save) + anúncios (coleção com
  // insert/update/delete individual) + curtidas pessoais (mesmo padrão
  // dos favoritos de vaga).
  const [serviceCategories, setServiceCategories] = useState(SERVICE_CATEGORIES_SEED);
  const [serviceListings, setServiceListings] = useState(SERVICE_LISTINGS_SEED);
  const [likedServiceIds, setLikedServiceIds] = useState(() => new Set());
  const [likedServicesLoaded, setLikedServicesLoaded] = useState(false);

  const handleSaveServiceCategories = (next) => {
    setServiceCategories(next);
    if (dbStatus === "connected") {
      upsertServiceCategoriesInDB(next).catch((err) => console.error("Falha ao salvar categorias de prestadores:", err));
    }
  };
  const handleAddServiceListing = (item) => {
    const optimistic = { ...item, id: uid(), createdAt: Date.now() };
    setServiceListings((prev) => [optimistic, ...prev]);
    if (dbStatus === "connected") {
      insertServiceListingToDB(item).catch((err) => console.error("Falha ao salvar prestador:", err));
    }
  };
  const handleUpdateServiceListing = (id, patch) => {
    setServiceListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    if (dbStatus === "connected") {
      updateServiceListingInDB(id, patch).catch((err) => console.error("Falha ao atualizar anúncio:", err));
    }
  };

  // Wrappers usados pelo ProviderDashboard — tratam o flag
  // "isNewCategory" (cria a categoria antes de salvar o anúncio),
  // igual já acontece no cadastro inicial do prestador.
  const handleProviderAddListing = (data) => {
    const { isNewCategory, ...listingData } = data;
    if (isNewCategory) {
      const nextColor = CATEGORY_COLOR_OPTIONS[serviceCategories.length % CATEGORY_COLOR_OPTIONS.length].key;
      handleSaveServiceCategories([...serviceCategories, { nome: data.categoria, color: nextColor, icon: "Building2" }]);
    }
    handleAddServiceListing(listingData);
  };
  const handleProviderUpdateListing = (id, data) => {
    const { isNewCategory, ...listingData } = data;
    if (isNewCategory) {
      const nextColor = CATEGORY_COLOR_OPTIONS[serviceCategories.length % CATEGORY_COLOR_OPTIONS.length].key;
      handleSaveServiceCategories([...serviceCategories, { nome: data.categoria, color: nextColor, icon: "Building2" }]);
    }
    handleUpdateServiceListing(id, listingData);
  };
  const handleDeleteServiceListing = (id) => {
    setServiceListings((prev) => prev.filter((i) => i.id !== id));
    if (dbStatus === "connected") {
      deleteServiceListingFromDB(id).catch((err) => console.error("Falha ao excluir prestador:", err));
    }
  };
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await personalStorageGet(SERVICE_LIKES_STORAGE_KEY);
        if (!cancelled && Array.isArray(saved)) setLikedServiceIds(new Set(saved));
      } catch (err) {
        // sem curtidas salvas ainda
      } finally {
        if (!cancelled) setLikedServicesLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const handleToggleServiceLike = (id) => {
    // Antes: "liking" era decidido DENTRO do updater de setLikedServiceIds,
    // e o updater de setServiceListings (a atualização do contador) podia
    // rodar antes dele terminar — então "liking" ainda estava no valor
    // inicial (false), e o contador só sabia diminuir, nunca aumentar de
    // novo. Calculando aqui fora, direto do estado atual, os dois
    // updaters usam sempre o mesmo valor certo.
    const liking = !likedServiceIds.has(id);

    setLikedServiceIds((prev) => {
      const next = new Set(prev);
      if (liking) next.add(id);
      else next.delete(id);
      if (likedServicesLoaded) {
        personalStorageSet(SERVICE_LIKES_STORAGE_KEY, [...next]).catch((err) => console.error("Falha ao salvar curtida:", err));
      }
      return next;
    });
    setServiceListings((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const nextLikes = Math.max(0, (l.likes || 0) + (liking ? 1 : -1));
        if (dbStatus === "connected") {
          updateServiceListingInDB(id, { likes: nextLikes }).catch((err) => console.error("Falha ao salvar contador de curtidas:", err));
        }
        return { ...l, likes: nextLikes };
      })
    );
  };

  // Planos & Créditos
  const [planos, setPlanos] = useState(PLANOS_DEFAULT);
  const [savingPlanos, setSavingPlanos] = useState(false);
  const [planKey, setPlanKey] = useState("gratis"); // conta atual simulada (Admin > Planos)

  // Submenu do Admin — separa Planos / Publicador / Comunicados / Vagas
  const [adminTab, setAdminTab] = useState("planos");

  useEffect(() => {
    if (!backendReady()) return;
    let cancelled = false;

    (async () => {
      try {
        const [dbJobs, dbBanner, dbAlertBanner, dbAlertSubs, dbPlanos, dbPartners, dbSiteStats, dbCommunity, dbServiceCategories, dbServiceListings, dbCommunityBanner] = await Promise.all([
          fetchJobsFromDB(),
          fetchBannerFromDB(),
          fetchAlertBannerFromDB(),
          fetchAlertSubscriptionsFromDB(),
          fetchPlanosFromDB(),
          fetchPartnersFromDB(),
          fetchSiteStatsFromDB(),
          fetchCommunityContentFromDB(),
          fetchServiceCategoriesFromDB(),
          fetchServiceListingsFromDB(),
          fetchCommunityBannerFromDB(),
        ]);
        if (cancelled) return;
        if (dbJobs.length) setJobs(dbJobs);
        if (dbBanner) setBanner((b) => ({ ...b, ...dbBanner }));
        if (dbAlertBanner) setAlertBannerConfig((c) => ({ ...c, ...dbAlertBanner }));
        if (dbAlertSubs?.length) setAlertSubscriptions(dbAlertSubs);
        if (dbPlanos) setPlanos((p) => ({ ...p, ...dbPlanos }));
        if (dbPartners?.length) setRegisteredPartners(dbPartners);
        if (dbSiteStats) setSiteStats((s) => ({ ...s, ...dbSiteStats }));
        if (dbCommunity?.length) setCommunityContent(dbCommunity);
        if (dbServiceCategories?.length) setServiceCategories(dbServiceCategories);
        if (dbServiceListings?.length) setServiceListings(dbServiceListings);
        if (dbCommunityBanner) setCommunityBanner((b) => ({ ...b, ...dbCommunityBanner }));
        setDbStatus("connected");
      } catch (err) {
        if (cancelled) return;
        console.error("Supabase connection failed:", err);
        setDbStatus("error");
        setDbError(err.message || "Falha na conexão com o armazenamento.");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Persiste registeredPartners a cada mudança (cadastro novo, selo
  // verificado, troca de plano...) — só depois que dbStatus já é
  // "connected" (ou seja, a carga inicial já rodou e já trouxe o que
  // existia salvo). Sem esse gate, o efeito dispararia já na montagem
  // com o valor padrão (initialRegisteredPartners) e sobrescreveria
  // qualquer parceiro real que já estivesse salvo, antes mesmo do fetch
  // inicial terminar.
  useEffect(() => {
    if (dbStatus !== "connected") return;
    upsertPartnersInDB(registeredPartners).catch((err) => console.error("Falha ao salvar parceiros:", err));
  }, [registeredPartners, dbStatus]);

  // Relógio dos ciclos automáticos (🔥 Destaque = 7 dias, 🆕 Nova Vaga =
  // 48h, + arquivamento de vaga "sumida" do scraper) — confere
  // periodicamente se algum ciclo terminou; se sim, desliga sozinho e
  // devolve a cota/limpa o timestamp (sem apagar nada da vaga, só o
  // selo/status). Roda ao montar e a cada minuto — suficiente pro
  // propósito aqui (não precisa de precisão de segundo). Numa migração
  // real pro Supabase, isso viraria um cron/edge function rodando no
  // servidor, não no navegador de quem estiver com a aba aberta.
  useEffect(() => {
    const checkAutoCycles = () => {
      setJobs((prev) => {
        let changed = false;
        const next = prev.map((j) => {
          let patch = null;
          if (isDestaqueCicloConcluido(j)) {
            patch = { ...patch, isFixado: false, destaqueAtivadoEm: null };
          }
          if (isNovoCicloConcluido(j)) {
            patch = { ...patch, isNovo: false, novoAtivadoEm: null };
          }
          if (isJobStale(j, registeredPartners)) {
            patch = { ...patch, arquivada: true };
          }
          if (patch) {
            changed = true;
            if (dbStatus === "connected") {
              updateJobInDB(j.id, patch).catch((err) => console.error("Falha ao renovar ciclo automático:", err));
            }
            return { ...j, ...patch };
          }
          return j;
        });
        return changed ? next : prev;
      });
    };

    checkAutoCycles();
    const interval = setInterval(checkAutoCycles, 60 * 1000);
    return () => clearInterval(interval);
  }, [dbStatus, registeredPartners]);

  const { plan: currentPlan, quotaUsage, canUseBadge } = usePermissions(planos, planKey, jobs);

  // Peso randômico de cada vaga em Destaque, sorteado uma única vez por
  // vaga (não a cada render) e mantido no ref pela duração da sessão do
  // navegador. Isso implementa a regra: "Destaque sempre nas primeiras
  // posições, mas em ordem randômica entre si" — assim nenhum anunciante
  // fica sempre acima dos outros só por ter marcado o selo primeiro.
  // Recarregar a página sorteia uma ordem nova.
  const destaqueWeightsRef = useRef(new Map());

  const sortedJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.status !== "rascunho" && !j.arquivada)
        .sort((a, b) => {
          // "Destaque" (isFixado) vence sempre e vai pra primeira página.
          if (!!b.isFixado !== !!a.isFixado) return (b.isFixado ? 1 : 0) - (a.isFixado ? 1 : 0);
          // Dentro do grupo de Destaque, ordem randômica (sorteada uma vez
          // por vaga) — não por cliques, pra ser justo entre anunciantes.
          if (a.isFixado && b.isFixado) {
            if (!destaqueWeightsRef.current.has(a.id)) destaqueWeightsRef.current.set(a.id, Math.random());
            if (!destaqueWeightsRef.current.has(b.id)) destaqueWeightsRef.current.set(b.id, Math.random());
            return destaqueWeightsRef.current.get(a.id) - destaqueWeightsRef.current.get(b.id);
          }
          // Fora do Destaque, mantém a ordenação por cliques de sempre.
          return b.clicks - a.clicks;
        }),
    [jobs]
  );

  const [filters, setFilters] = useState({ sexo: "todos", provincia: "todas", nihongo: "todos", favoritas: false });

  // Rastreamento de filtros usados (Estatísticas do Admin) — só conta
  // quando um valor DIFERENTE do padrão é escolhido (evita contar toda
  // vez que alguém volta pro "Todos"/"Todas").
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (filters.sexo !== prev.sexo && filters.sexo !== "todos") bumpSiteStatGroup("filters", `sexo:${filters.sexo}`);
    if (filters.provincia !== prev.provincia && filters.provincia !== "todas") bumpSiteStatGroup("filters", `provincia:${filters.provincia}`);
    if (filters.nihongo !== prev.nihongo && filters.nihongo !== "todos") bumpSiteStatGroup("filters", `nihongo:${filters.nihongo}`);
    prevFiltersRef.current = filters;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Rastreamento de abas visitadas (Estatísticas do Admin) — 1 contagem
  // por troca de aba. Aproveita o mesmo gatilho pra também rolar a
  // página de volta pro topo — sem isso, trocar de aba no meio da
  // rolagem (ex: Vagas → Rankings) abria a aba nova já no meio, com o
  // topo dela "cortado" pra cima.
  useEffect(() => {
    bumpSiteStatGroup("tabs", tab);
    window.scrollTo({ top: 0, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Mesmo cuidado ao trocar de sub-aba dentro do Painel Admin
  // (Planos/Publicador/Comunicados/Vagas/Estatísticas).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [adminTab]);

  const filteredJobs = useMemo(() => {
    return sortedJobs.filter((j) => {
      if (filters.sexo === "homens" && !j.vagaHomens) return false;
      if (filters.sexo === "mulheres" && !j.vagaMulheres) return false;
      if (filters.provincia !== "todas" && j.provincia !== filters.provincia) return false;
      if (filters.nihongo !== "todos" && simplifyNihongo(j.nihongo) !== filters.nihongo) return false;
      if (filters.favoritas && !favoriteJobIds.has(j.id)) return false;
      return true;
    });
  }, [sortedJobs, filters, favoriteJobIds]);

  // Só conta o clique — a navegação em si agora é feita pelo próprio
  // <a href> do botão (nativo, mais confiável contra bloqueio de
  // pop-up de navegador desktop dentro de iframe do que window.open()
  // disparado por script). Chamar window.open() aqui também abriria
  // uma segunda aba duplicada.
  const handleContact = (id) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        const nextClicks = j.clicks + 1;
        const nextDaily = bumpDailyStat(j.dailyStats, "clicks");
        if (dbStatus === "connected") {
          updateJobInDB(id, { clicks: nextClicks, dailyStats: nextDaily }).catch((err) => console.error("Falha ao salvar clique:", err));
        }
        return { ...j, clicks: nextClicks, dailyStats: nextDaily };
      })
    );
  };

  // Visualizações — conta 1 por montagem do JobCard no feed público (ver
  // useEffect em JobCard), 1 por sessão por vaga (viewedRef). Agora
  // também persiste (antes só existia localmente/por sessão) e alimenta
  // o histórico diário — base do Gráfico de Evolução.
  const viewedRef = useRef(new Set());
  const handleJobView = (id) => {
    if (viewedRef.current.has(id)) return; // 1 view por sessão por vaga, não por re-render
    viewedRef.current.add(id);
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        const nextViews = (j.views || 0) + 1;
        const nextDaily = bumpDailyStat(j.dailyStats, "views");
        if (dbStatus === "connected") {
          updateJobInDB(id, { views: nextViews, dailyStats: nextDaily }).catch((err) => console.error("Falha ao salvar visualização:", err));
        }
        return { ...j, views: nextViews, dailyStats: nextDaily };
      })
    );
  };

  const handleToggleFlip = (id) =>
    setFlippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Carrega os favoritos salvos dessa conta ao montar.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await personalStorageGet(FAVORITES_STORAGE_KEY);
        if (!cancelled && Array.isArray(saved)) setFavoriteJobIds(new Set(saved));
      } catch (err) {
        console.error("Falha ao carregar favoritos:", err);
      } finally {
        if (!cancelled) setFavoritesLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Favoritar/desfavoritar tem DUAS partes: (1) a lista pessoal de quem
  // favoritou (window.storage pessoal, só essa conta vê) e (2) um
  // contador COMPARTILHADO em cada vaga (job.favoritos), pra empresa
  // conseguir ver no dashboard dela quantas vezes cada anúncio foi
  // favoritado no total — mesmo padrão de clicks/views.
  const handleToggleFavorite = (id) => {
    // Mesmo bug do like dos prestadores: calcular aqui fora, direto do
    // estado atual, em vez de decidir dentro de um dos dois updaters.
    const willFavorite = !favoriteJobIds.has(id);

    setFavoriteJobIds((prev) => {
      const next = new Set(prev);
      if (willFavorite) next.add(id);
      else next.delete(id);
      if (favoritesLoaded) {
        personalStorageSet(FAVORITES_STORAGE_KEY, [...next]).catch((err) => console.error("Falha ao salvar favoritos:", err));
      }
      return next;
    });

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        const nextCount = Math.max(0, (j.favoritos || 0) + (willFavorite ? 1 : -1));
        if (dbStatus === "connected") {
          updateJobInDB(id, { favoritos: nextCount }).catch((err) => console.error("Falha ao salvar contador de favoritos:", err));
        }
        return { ...j, favoritos: nextCount };
      })
    );
  };

  // Destaque temporário (brilho dourado) na vaga alvo, só pra facilitar
  // achar o card na tela depois de vir de um clique no ranking. Apaga
  // sozinho depois de alguns segundos.
  const [highlightedJobId, setHighlightedJobId] = useState(null);

  // Vem do card de Rankings: troca pra aba Vagas, zera os filtros (pra
  // garantir que a vaga não fique escondida por algum filtro ativo), já
  // abre o verso do card com os detalhes, rola suavemente até ele e
  // acende o brilho dourado temporário. Em vez de um delay fixo (que
  // podia não ser suficiente em aparelhos mais lentos), tenta a cada
  // frame até o card aparecer no DOM — mais robusto que um "setTimeout"
  // arbitrário.
  const highlightTimerRef = useRef(null);
  const handleGoToJob = (jobId) => {
    setTab("vagas");
    setFilters({ sexo: "todos", provincia: "todas", nihongo: "todos" });
    setFlippedIds((prev) => new Set(prev).add(jobId));

    setHighlightedJobId(jobId);
    clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedJobId(null), 4000);

    let tentativas = 0;
    const tentarRolar = () => {
      const el = document.getElementById(`job-${jobId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (tentativas < 30) {
        tentativas += 1;
        requestAnimationFrame(tentarRolar);
      }
    };
    requestAnimationFrame(tentarRolar);
  };

  const handlePublish = async (formData) => {
    const optimisticJob = {
      id: uid(), clicks: 0,
      isTopSalario: false, isRecomendado: false, isUrgente: false, isFixado: false, isNovo: false, seloVerificado: false,
      ...formData,
    };
    // Se a vaga já nasce com Destaque ativado, o ciclo de 7 dias começa agora.
    if (optimisticJob.isFixado && !optimisticJob.destaqueAtivadoEm) {
      optimisticJob.destaqueAtivadoEm = Date.now();
    }
    // Se a vaga já nasce com Nova Vaga ativado (publicação da própria
    // empresa via Publicador Mágico dela), o ciclo de 48h começa agora.
    if (optimisticJob.isNovo && !optimisticJob.novoAtivadoEm) {
      optimisticJob.novoAtivadoEm = Date.now();
    }

    if (dbStatus === "connected") {
      try {
        const saved = await insertJobToDB(optimisticJob);
        setJobs((prev) => [saved, ...prev]);
        setTab("vagas");
        return;
      } catch (err) {
        console.error("Falha ao publicar no Supabase:", err);
        setDbError("Não foi possível salvar no banco — a vaga foi adicionada só localmente.");
      }
    }
    setJobs((prev) => [optimisticJob, ...prev]);
    setTab("vagas");
  };

  const handleBulkImport = ({ inserted, updated }) => {
    setJobs((prev) => {
      const updatedMap = new Map(updated.map((u) => [u.id, u.patch]));
      const patched = prev.map((j) => (updatedMap.has(j.id) ? { ...j, ...updatedMap.get(j.id) } : j));
      return [...inserted, ...patched];
    });
    setTab("vagas");
  };

  // Genérico pros selos (isTopSalario, isRecomendado, isUrgente, isFixado,
  // seloVerificado) — reaproveitado tanto pelo JobsTable do Admin quanto
  // pelo da Área do Cliente. A validação de cota NÃO acontece aqui —
  // cada JobsTable já valida com o "canUseBadge" do contexto certo antes
  // de chamar esta função (o do Admin usa a cota simulada global; o da
  // Área do Cliente usa a cota real da empresa logada). Repetir a
  // checagem aqui com o "canUseBadge" do Admin bloqueava silenciosamente
  // os cliques da empresa, mesmo quando ela tinha cota de sobra no
  // próprio plano — por isso os selos pareciam "travados" pro cliente.
  const handleToggleBadge = (id, key) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;

    const turningOn = !job[key];
    const patch = { [key]: turningOn };
    // Destaque tem ciclo de 7 dias: cada vez que liga, começa um ciclo
    // novo (timestamp de agora); ao desligar, limpa — pronto pra um
    // próximo ciclo do zero quando religar, na mesma vaga ou em outra.
    if (key === "isFixado") {
      patch.destaqueAtivadoEm = turningOn ? Date.now() : null;
    }
    // Nova Vaga tem ciclo de 48h — mesma lógica, mas mais curta. Vale
    // tanto pro toggle manual do Admin quanto (indiretamente) pro que a
    // própria empresa liga automaticamente ao publicar.
    if (key === "isNovo") {
      patch.novoAtivadoEm = turningOn ? Date.now() : null;
    }

    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    if (dbStatus === "connected") {
      updateJobInDB(id, patch).catch((err) => console.error("Falha ao atualizar:", err));
    }
  };

  // Marcar/desmarcar "Vaga Preenchida" — status controlado pela própria
  // empresa (não é um selo promocional, não consome cota, não entra em
  // BADGE_DEFS). Guardamos o timestamp (preenchidaEm) mesmo sem usar em
  // lugar nenhum ainda — fica registrado no banco pra uma futura métrica
  // de "tempo até preencher a vaga", sem precisar migrar dado depois.
  // ⚠️ Isso NUNCA entra em nenhuma métrica hoje: como depende só da
  // empresa lembrar de marcar, um número baseado nisso seria enganoso
  // (vaga preenchida sem ninguém marcar continuaria contando como aberta).
  const handleTogglePreenchida = (id) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    const turningOn = !job.preenchida;
    const patch = { preenchida: turningOn, preenchidaEm: turningOn ? Date.now() : null };
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    if (dbStatus === "connected") {
      updateJobInDB(id, patch).catch((err) => console.error("Falha ao marcar vaga preenchida:", err));
    }
  };

  // Reabrir manualmente uma vaga arquivada automaticamente (o scraper
  // parou de vê-la, mas o Admin decide que ainda vale mostrar). Bem
  // menos comum que "preenchida" — é mais um botão de segurança.
  const handleToggleArquivada = (id) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, arquivada: false, lastSeenAt: Date.now() } : j)));
    if (dbStatus === "connected") {
      updateJobInDB(id, { arquivada: false, lastSeenAt: Date.now() }).catch((err) => console.error("Falha ao reabrir vaga:", err));
    }
  };

  const handleDelete = (id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (dbStatus === "connected") deleteJobFromDB(id).catch((err) => console.error("Falha ao excluir:", err));
  };

  // Reivindicação de vagas — agora SEM formulário: a empresa já está
  // logada (empresa/telefone já conhecidos), então só aplica "empresa" +
  // telefone/whatsapp em lote nas vagas selecionadas. Local primeiro,
  // depois persiste cada vaga via updateJobInDB em paralelo (o adapter
  // não tem update em lote de verdade).
  const handleClaimJobs = async (officialName, jobIds, contactPhone) => {
    // Se a empresa já for verificada (concessão manual permanente do
    // Admin, ou o plano dela já incluir) as vagas recém-reivindicadas já
    // nascem com o selo — sem precisar de um novo toggle manual.
    const partner = registeredPartners.find((p) => p.name === officialName);
    const jaVerificada = !!(partner?.seloVerificado || planos[partner?.planKey]?.seloVerificado);

    setJobs((prev) =>
      prev.map((j) =>
        jobIds.includes(j.id)
          ? { ...j, empresa: officialName, telefone: contactPhone, whatsapp: contactPhone, seloVerificado: jaVerificada || j.seloVerificado }
          : j
      )
    );
    if (dbStatus === "connected") {
      // Fire-and-forget, igual ao resto do app (handleToggleBadge, etc.):
      // o estado local já foi atualizado acima, então a UI já reflete a
      // reivindicação com sucesso. Se a persistência em segundo plano
      // falhar (rede, storage), só loga no console — nunca propaga o
      // erro pro modal, que já fechou achando (corretamente) que deu certo.
      Promise.all(
        jobIds.map((id) =>
          updateJobInDB(id, { empresa: officialName, telefone: contactPhone, whatsapp: contactPhone, seloVerificado: jaVerificada })
        )
      ).catch((err) => console.error("Falha ao persistir reivindicação de vagas:", err));
    }
  };

  // Cadastro de parceiro (PartnerAuthModal) — cria a entrada em
  // registeredPartners (fonte única, também usada pro login e pra gestão
  // do Super Admin) e já loga a empresa na Área do Cliente (aba "minhaempresa").
  // ⚠️ "password" fica só no objeto local — numa migração real pro
  // Supabase, isso vira Supabase Auth (signUp) de verdade.
  const handlePartnerSignup = async (formData) => {
    const newPartner = {
      id: uid(),
      tipo: formData.tipo,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phonePt: formData.phonePt,
      phoneJp: formData.phoneJp,
      planKey: "gratis", // toda empresa nova entra no Grátis — upgrade é fluxo de pagamento futuro
      seloVerificado: false,
    };
    setRegisteredPartners((prev) => [...prev, newPartner]);
    setCurrentClientCompanyId(newPartner.id);
    setTab("minhaempresa");

    // Prestador de serviço: o cadastro já cria o primeiro anúncio junto
    // — categoria (nova, se for o caso) + o anúncio em si.
    if (formData.tipo === "prestador") {
      if (formData.isNewListingCategory) {
        const nextColor = CATEGORY_COLOR_OPTIONS[serviceCategories.length % CATEGORY_COLOR_OPTIONS.length].key;
        handleSaveServiceCategories([...serviceCategories, { nome: formData.listingCategoria, color: nextColor, icon: "Building2" }]);
      }
      handleAddServiceListing({
        providerId: newPartner.id,
        categoria: formData.listingCategoria,
        nome: formData.name,
        descricao: formData.listingDescricao,
        whatsapp: formData.phonePt,
        likes: 0,
        status: "publicado",
      });
    }
  };

  // Login de parceiro já cadastrado — busca em registeredPartners
  // (chamado de dentro do PartnerAuthModal, que já validou email/senha).
  const handleClientLogin = (partner) => {
    setCurrentClientCompanyId(partner.id);
    setTab("minhaempresa");
  };

  const handleClientLogout = () => {
    setCurrentClientCompanyId(null);
    setTab("vagas");
  };

  // Super Admin — login separado do fluxo de parceiro (não é uma
  // empresa, é acesso master). Vai direto pro painel Admin existente.
  const handleSuperAdminLogin = () => {
    setIsSuperAdmin(true);
    setTab("admin");
  };

  const handleSuperAdminLogout = () => {
    setIsSuperAdmin(false);
    setCurrentClientCompanyId(null);
    setTab("vagas");
  };

  // Ativa/desativa o Verificado da EMPRESA e cascateia pra todas as vagas
  // dela (job.seloVerificado é o campo que realmente aparece no card e na
  // tabela — sem essa propagação, o toggle mudava só a ficha do parceiro
  // aqui dentro, sem efeito nenhum visível nas vagas).
  const handleToggleVerificado = (partnerId) => {
    const partner = registeredPartners.find((p) => p.id === partnerId);
    if (!partner) return;
    const novoValor = !partner.seloVerificado;

    setRegisteredPartners((prev) =>
      prev.map((p) => (p.id === partnerId ? { ...p, seloVerificado: novoValor } : p))
    );

    const jobIdsDaEmpresa = jobs.filter((j) => j.empresa === partner.name).map((j) => j.id);
    setJobs((prev) =>
      prev.map((j) => (j.empresa === partner.name ? { ...j, seloVerificado: novoValor } : j))
    );
    if (dbStatus === "connected" && jobIdsDaEmpresa.length > 0) {
      Promise.all(jobIdsDaEmpresa.map((id) => updateJobInDB(id, { seloVerificado: novoValor }))).catch((err) =>
        console.error("Falha ao propagar selo verificado pras vagas:", err)
      );
    }
  };

  const handleChangePartnerPlano = (partnerId, newPlanKey) => {
    setRegisteredPartners((prev) => prev.map((p) => (p.id === partnerId ? { ...p, planKey: newPlanKey } : p)));
  };

  // Abre uma ferramenta do Painel Admin direto pela chave do adminTab
  // (publicador/planos/comunicados/vagas) — chamado pelo AdminSwitcherMenu.
  const handleOpenAdminTool = (key) => {
    setTab("admin");
    setAdminTab(key);
  };

  // "Alternar Modo / Ver Como..." do AdminSwitcherMenu — o Super Admin
  // continua logado (isSuperAdmin nunca muda aqui), só troca a aba
  // sendo VISUALIZADA no momento.
  const handleViewAs = (mode) => {
    if (mode === "publico") {
      setTab("vagas");
      return;
    }
    // jto / prestador / loja — carrega um parceiro real de registeredPartners
    const seedIdByMode = { jto: "seed-jto", prestador: "seed-prestador", loja: "seed-loja" };
    const targetId = seedIdByMode[mode];
    if (targetId && registeredPartners.some((p) => p.id === targetId)) {
      setCurrentClientCompanyId(targetId);
      setTab("minhaempresa");
    }
  };

  const handleBannerChange = (updater) => {
    setBanner((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (dbStatus === "connected") upsertBannerInDB(next).catch((err) => console.error("Falha ao salvar banner:", err));
      return next;
    });
  };

  const handleCommunityBannerChange = (updater) => {
    setCommunityBanner((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (dbStatus === "connected") upsertCommunityBannerInDB(next).catch((err) => console.error("Falha ao salvar banner da Comunidade:", err));
      return next;
    });
  };

  const handleAlertBannerChange = (updater) => {
    setAlertBannerConfig((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (dbStatus === "connected") upsertAlertBannerInDB(next).catch((err) => console.error("Falha ao salvar banner do alerta:", err));
      return next;
    });
  };

  // Nova inscrição no Alerta de Vagas — salva local otimista + persiste.
  // Sem envio automático (isso exige backend real); a confirmação em si
  // já acontece pelo link do WhatsApp aberto no modal.
  const handleSubscribeAlert = (sub) => {
    const optimistic = { ...sub, id: uid(), createdAt: Date.now() };
    setAlertSubscriptions((prev) => [optimistic, ...prev]);
    if (dbStatus === "connected") {
      insertAlertSubscriptionToDB(sub).catch((err) => console.error("Falha ao salvar inscrição do alerta:", err));
    }
  };

  // Planos são editados localmente enquanto o admin digita; salvamos no
  // armazenamento com um pequeno debounce pra não gerar uma escrita por tecla.
  const planosSaveTimer = useRef(null);
  const handlePlanosChange = (updater) => {
    setPlanos((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (dbStatus === "connected") {
        setSavingPlanos(true);
        clearTimeout(planosSaveTimer.current);
        planosSaveTimer.current = setTimeout(() => {
          upsertPlanosInDB(next)
            .catch((err) => console.error("Falha ao salvar planos:", err))
            .finally(() => setSavingPlanos(false));
        }, 600);
      }
      return next;
    });
  };

  // Navegação padrão sempre tem Vagas/Empreiteiras/Calculadora — "Admin"
  // não é mais uma aba clicável aqui (centralizado no AdminSwitcherMenu).
  // "Minha Empresa" só aparece quando um parceiro está logado — é a
  // ÚNICA forma de chegar no ClientDashboard agora, e a navegação padrão
  // continua toda visível e clicável ao lado dela.
  const tabs = [
    { key: "vagas", label: "Vagas", icon: Briefcase },
    { key: "empreiteiras", label: "Rankings", icon: TrendingUp },
    { key: "calculadora", label: "Calculadora", icon: Calculator },
    { key: "comunidade", label: "Comunidade", icon: Users },
    ...(currentClientCompany ? [{ key: "minhaempresa", label: currentClientCompany.tipo === "prestador" ? "Meus Anúncios" : "Minha Empresa", icon: Building2 }] : []),
  ];

  return (
    <div className={`nv-body min-h-screen bg-slate-50 pb-16 ${darkMode ? "nv-dark-invert" : ""}`}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <div className="nv-display flex items-baseline text-[22px] font-extrabold tracking-tight">
            <span className="text-slate-900">nihon</span>
            <span className="text-blue-600">vagas</span>
            <span className="text-slate-400">.jp</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleDarkMode}
              title={darkMode ? "Modo claro" : "Modo escuro"}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {/* Botão do PWA ("Adicione a tela") temporariamente fora daqui —
                trocado pelo botão de cadastro de empreiteira, que estava
                ficando escondido demais (some quando logado como Super
                Admin, que é como a conta de teste geralmente navega). A
                lógica do PWA continua intacta por baixo (handleInstallClick,
                canShowInstallButton etc.) — é só questão de trazer o botão
                de volta pra cá quando fizer sentido.
            {canShowInstallButton && (
              <button
                onClick={handleInstallClick}
                title="Adicionar à tela de início"
                className="flex h-9 flex-shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 text-blue-600 hover:bg-blue-100"
              >
                <Download className="h-4 w-4 flex-shrink-0" />
                <span className="nv-body whitespace-nowrap text-[10px] font-semibold">Adicione a tela</span>
              </button>
            )}
            */}
            {!currentClientCompany && (
              <button
                onClick={() => setPartnerAuthModalOpen(true)}
                title="Entrar ou cadastrar sua empresa/negócio"
                className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-100"
              >
                <LogIn className="h-3.5 w-3.5 flex-shrink-0" /> Login / Cadastro
              </button>
            )}
            {/* Ícone de calculadora rápida removido do cabeçalho — a
                calculadora completa já vive na aba "Calculadora" da
                navegação principal, então esse atalho ficava redundante.
                handleOpenCalculator/SalaryCalculatorModal continuam
                intactos por baixo, só sem gatilho aqui. */}
            {/* Super Admin: nada aqui (o hambúrguer fixo já cobre login/logout).
                Parceiro logado: "Sair da Conta". Visitante: já tem o botão
                "Sou Empreiteira" acima (trocado de lugar com o PWA), então
                não repete outro botão de cadastro aqui. */}
            {!isSuperAdmin && currentClientCompany && (
              <button
                onClick={handleClientLogout}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-[12px] font-semibold text-slate-500 hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair da Conta
              </button>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-5 pb-4">
          <div className={`grid gap-1 rounded-2xl bg-slate-100 p-1 ${tabs.length === 5 ? "grid-cols-5" : tabs.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-colors ${
                  tab === key ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-5 py-6">
        {tab === "vagas" && (
          <div className="space-y-4">
            <BannerCard banner={banner} />

            <FilterBar jobs={jobs} filters={filters} setFilters={setFilters} />

            <AlertBanner config={alertBannerConfig} onClick={() => { bumpSiteStat("alertBannerClicks"); setAlertModalOpen(true); }} />

            {filteredJobs.length === 0 ? (
              <p className="nv-body py-8 text-center text-[13px] text-slate-400">Nenhuma vaga encontrada com esses filtros.</p>
            ) : (
              filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isFlipped={flippedIds.has(job.id)}
                  onToggleFlip={() => handleToggleFlip(job.id)}
                  onContact={handleContact}
                  onView={handleJobView}
                  isTop={job.isFixado}
                  isHighlighted={highlightedJobId === job.id}
                  onSimulate={handleOpenCalculator}
                  isFavorited={favoriteJobIds.has(job.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))
            )}
          </div>
        )}

        {tab === "empreiteiras" && (
          <div className="space-y-4">
            <h2 className="nv-display text-[16px] font-bold text-slate-900">Rankings do site</h2>
            <RankingsTab jobs={jobs} onGoToJob={handleGoToJob} />
          </div>
        )}

        {tab === "calculadora" && (
          <div className="space-y-4">
            <h2 className="nv-display text-[16px] font-bold text-slate-900">Kakeibo · Orçamento Familiar</h2>
            <KakeiboApp />
          </div>
        )}

        {tab === "comunidade" && (
          <CommunidadeTab
            banner={communityBanner}
            listings={serviceListings.filter((l) => l.status !== "rascunho")}
            categories={serviceCategories}
            likedIds={likedServiceIds}
            onToggleLike={handleToggleServiceLike}
            onCadastrar={() => setPartnerAuthModalOpen(true)}
          />
        )}

        {tab === "admin" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab("vagas")}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                  title="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
                <h2 className="nv-display text-[16px] font-bold text-slate-900">{ADMIN_TOOL_TITLES[adminTab] || "Painel administrativo"}</h2>
              </div>
              <DbStatusBadge status={dbStatus} error={dbError} />
            </div>

            {adminTab === "planos" && (
              <PlanosManager
                planos={planos}
                setPlanos={handlePlanosChange}
                savingPlanos={savingPlanos}
                planKey={planKey}
                setPlanKey={setPlanKey}
                quotaUsage={quotaUsage}
              />
            )}

            {adminTab === "publicador" && (
              <AIPublisher
                onPublish={handlePublish}
                currentPlan={currentPlan}
                planKey={planKey}
                canUseBadge={canUseBadge}
                quotaUsage={quotaUsage}
              />
            )}

            {adminTab === "comunicados" && (
              <div className="space-y-5">
                <BannerEditor banner={banner} setBanner={handleBannerChange} />
                <BannerEditor
                  banner={communityBanner}
                  setBanner={handleCommunityBannerChange}
                  title="Banner da Comunidade (Prestadores)"
                  description="Aparece no topo da aba Comunidade, acima da lista de prestadores."
                  variant="comunidade"
                />
                <AlertBannerEditor config={alertBannerConfig} setConfig={handleAlertBannerChange} />

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="nv-display flex items-center gap-2 text-[15px] font-bold text-slate-900">
                    <Bell className="h-4 w-4 text-emerald-600" /> Inscritos no Alerta de Vagas
                  </h3>
                  <p className="nv-body mb-3 text-[12px] text-slate-500">
                    {alertSubscriptions.length} inscrição{alertSubscriptions.length === 1 ? "" : "ões"}. Toque em "WhatsApp" pra avisar essa
                    pessoa quando surgir uma vaga que combine com o filtro dela — hoje esse aviso ainda é manual.
                  </p>
                  {alertSubscriptions.length === 0 ? (
                    <p className="nv-body py-6 text-center text-[12px] text-slate-400">Ninguém se inscreveu ainda.</p>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {alertSubscriptions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="nv-body truncate text-[12px] font-semibold text-slate-700">
                              {sub.sexo === "homens" ? "Homens" : sub.sexo === "mulheres" ? "Mulheres" : "Todos"}
                              {" · "}
                              {sub.provincia === "todas" ? "Todas províncias" : sub.provincia}
                              {" · "}
                              {sub.nihongo === "todos" ? "Nihongo: todos" : sub.nihongo}
                            </p>
                            <p className="nv-body truncate text-[11px] text-slate-400">{sub.whatsapp}</p>
                          </div>
                          <a
                            href={toWhatsAppLink(sub.whatsapp) || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nv-body flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <MessageCircle className="h-3 w-3" /> WhatsApp
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {adminTab === "vagas" && (
              <div className="space-y-5">
                <JSONImporter dbStatus={dbStatus} jobs={jobs} onImported={handleBulkImport} />
                <JobsTable jobs={jobs} onToggleBadge={handleToggleBadge} onDelete={handleDelete} canUseBadge={canUseBadge} showNovoBadge onTogglePreenchida={handleTogglePreenchida} onToggleArquivada={handleToggleArquivada} />
              </div>
            )}

            {adminTab === "estatisticas" && <StatsDashboard siteStats={siteStats} jobs={jobs} />}

            {adminTab === "comunidade" && (
              <CommunityAdminPanel items={communityContent} onAdd={handleAddCommunityContent} onDelete={handleDeleteCommunityContent} />
            )}

            {adminTab === "prestadores" && (
              <div className="space-y-5">
                <ServiceCategoryManager categories={serviceCategories} onSave={handleSaveServiceCategories} listings={serviceListings} />
                <ServiceListingsAdminPanel
                  listings={serviceListings}
                  categories={serviceCategories}
                  onAdd={handleAddServiceListing}
                  onDelete={handleDeleteServiceListing}
                />
              </div>
            )}
          </div>
        )}

        {tab === "minhaempresa" && currentClientCompany && currentClientCompany.tipo === "prestador" && (
          <ProviderDashboard
            provider={currentClientCompany}
            listings={serviceListings.filter((l) => l.providerId === currentClientCompany.id)}
            categories={serviceCategories}
            onAddListing={handleProviderAddListing}
            onUpdateListing={handleProviderUpdateListing}
            onDeleteListing={handleDeleteServiceListing}
          />
        )}

        {tab === "minhaempresa" && currentClientCompany && currentClientCompany.tipo !== "prestador" && (
          <ClientDashboard
            company={currentClientCompany}
            jobs={jobs}
            planos={planos}
            registeredPartners={registeredPartners}
            onPublish={handlePublish}
            onToggleBadge={handleToggleBadge}
            onDelete={handleDelete}
            onClaimJobs={handleClaimJobs}
            onTogglePreenchida={handleTogglePreenchida}
            onTrackWhatsappSupport={() => bumpSiteStat("whatsappSupportClicks")}
          />
        )}
      </main>

      <PartnerAuthModal
        isOpen={partnerAuthModalOpen}
        onClose={() => setPartnerAuthModalOpen(false)}
        registeredPartners={registeredPartners}
        onSignup={handlePartnerSignup}
        onClientLogin={handleClientLogin}
        onSuperAdminLogin={handleSuperAdminLogin}
        serviceCategories={serviceCategories}
      />

      {isSuperAdmin && (
        <AdminSwitcherMenu
          onManagePartners={() => setPartnerManagementOpen(true)}
          onOpenAdminTool={handleOpenAdminTool}
          onViewAs={handleViewAs}
          onLogout={handleSuperAdminLogout}
        />
      )}

      <PartnerManagementModal
        isOpen={partnerManagementOpen}
        onClose={() => setPartnerManagementOpen(false)}
        registeredPartners={registeredPartners}
        onToggleVerificado={handleToggleVerificado}
        onChangePlano={handleChangePartnerPlano}
      />

      <SalaryCalculatorModal
        isOpen={calcModalOpen}
        onClose={() => setCalcModalOpen(false)}
        initialJikyu={calcInitialJikyu}
      />

      <IosInstallHelpModal isOpen={showIosInstallHelp} onClose={() => setShowIosInstallHelp(false)} />

      <WhatsAppAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        jobs={jobs}
        onSubscribe={handleSubscribeAlert}
      />
    </div>
  );
}
