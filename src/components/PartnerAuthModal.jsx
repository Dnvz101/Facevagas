// ---------------------------------------------------------------
// PartnerAuthModal — cadastro/login de Empreiteira, Prestador de
// Serviço e Loja/Comércio. Login do Super Admin agora passa pela
// Vercel Function (ver adaptação de handleLogin abaixo).
// ---------------------------------------------------------------

import { useState } from "react";
import { Building2, X, LogIn, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import ServiceProviderCard from "./ServiceProviderCard.jsx";
import { PARTNER_TYPES, partnerTypeLabel, partnerTypeEmoji, partnerTypeExample } from "../config/partnerTypes.js";
import { CATEGORY_COLOR_OPTIONS } from "../utils/categoryStyle.js";
import { checkSuperAdminLogin } from "../lib/adminAuth.js";

export default function PartnerAuthModal({ isOpen, onClose, registeredPartners, onSignup, onClientLogin, onSuperAdminLogin, serviceCategories }) {
  const [mode, setMode] = useState("cadastro"); // "cadastro" | "login"
  const [step, setStep] = useState("tipo"); // "tipo" | "dados" (só no modo cadastro)
  const [tipo, setTipo] = useState(null);

  // Etapa 2 — dados básicos
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phonePt, setPhonePt] = useState("");
  const [phoneJp, setPhoneJp] = useState("");
  const [signupError, setSignupError] = useState(null);
  const [signingUp, setSigningUp] = useState(false);

  // Campos extras — só aparecem quando tipo === "prestador" (o
  // cadastro já cria o anúncio na hora, não só a conta). Mesmo padrão
  // de categoria "escolher existente ou criar nova" usado nos vídeos.
  const [listingCategoriaSelect, setListingCategoriaSelect] = useState("");
  const [listingNovaCategoria, setListingNovaCategoria] = useState("");
  const [listingDescricao, setListingDescricao] = useState("");
  const isNewListingCategory = listingCategoriaSelect === "__nova__";
  const listingCategoriaFinal = isNewListingCategory ? listingNovaCategoria.trim() : listingCategoriaSelect;

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const resetAll = () => {
    setMode("cadastro");
    setStep("tipo");
    setTipo(null);
    setName("");
    setEmail("");
    setPassword("");
    setPhonePt("");
    setPhoneJp("");
    setSignupError(null);
    setSigningUp(false);
    setListingCategoriaSelect("");
    setListingNovaCategoria("");
    setListingDescricao("");
    setLoginEmail("");
    setLoginPassword("");
    setLoginError(null);
    setLoggingIn(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const canFinishSignup =
    name.trim() && email.trim() && password.trim() && phonePt.trim() &&
    (tipo !== "prestador" || (listingCategoriaFinal && listingDescricao.trim()));

  const handleFinishSignup = async () => {
    if (!canFinishSignup) return;
    // E-mail já cadastrado? Evita duplicar parceiro.
    const emailLower = email.trim().toLowerCase();
    if (registeredPartners.some((p) => p.email.toLowerCase() === emailLower)) {
      setSignupError("Já existe um cadastro com esse e-mail. Tente entrar em vez de cadastrar.");
      return;
    }
    setSigningUp(true);
    setSignupError(null);
    try {
      await onSignup({
        tipo,
        name: name.trim(),
        email: email.trim(),
        password,
        phonePt: phonePt.trim(),
        phoneJp: phoneJp.trim(),
        ...(tipo === "prestador"
          ? {
              listingCategoria: listingCategoriaFinal,
              listingDescricao: listingDescricao.trim(),
              isNewListingCategory,
            }
          : {}),
      });
      handleClose();
    } catch (err) {
      console.error("Falha ao cadastrar parceiro:", err);
      setSignupError("Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setSigningUp(false);
    }
  };

  // Antes: comparava e-mail/senha do Super Admin direto aqui (texto
  // puro no código). Agora chama a Vercel Function (api/admin-login.js
  // via src/lib/adminAuth.js), que verifica no servidor contra a
  // tabela "admin_users" — sem RLS pública, protegida pela service
  // role key. Isso só funciona com o site publicado de verdade (ver
  // TODO_MIGRACAO.md).
  const handleLogin = async () => {
    const emailLower = loginEmail.trim().toLowerCase();
    setLoginError(null);
    setLoggingIn(true);

    const isSuperAdmin = await checkSuperAdminLogin(loginEmail.trim(), loginPassword);
    if (isSuperAdmin) {
      onSuperAdminLogin();
      handleClose();
      return;
    }

    const partner = registeredPartners.find(
      (p) => p.email.toLowerCase() === emailLower && p.password === loginPassword
    );
    if (!partner) {
      setLoginError("E-mail ou senha incorretos.");
      setLoggingIn(false);
      return;
    }
    onClientLogin(partner);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="nv-rise flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:max-w-md sm:rounded-3xl"
      >
        {/* Header fixo */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
            <h3 className="nv-display text-[15px] font-bold text-slate-900">
              {mode === "login" ? "Entrar" : "Cadastrar / Anunciar"}
            </h3>
          </div>
          <button onClick={handleClose} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo (rola se precisar) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {mode === "cadastro" && step === "tipo" && (
            <div className="space-y-4">
              <button
                onClick={() => setMode("login")}
                className="nv-body flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-100"
              >
                <LogIn className="h-3.5 w-3.5" /> Já tem cadastro? Entrar
              </button>

              <p className="nv-body text-[13px] leading-relaxed text-slate-600">
                Que tipo de negócio você quer anunciar no nihonvagas.jp?
              </p>
              <div className="space-y-2">
                {PARTNER_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setTipo(t.key); setStep("dados"); }}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <span className="text-[20px]">{t.emoji}</span>
                    <span className="nv-body text-[14px] font-semibold text-slate-800">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "cadastro" && step === "dados" && (
            <div className="space-y-4">
              <button onClick={() => setStep("tipo")} className="nv-body flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-blue-600">
                ← {partnerTypeEmoji(tipo)} {partnerTypeLabel(tipo)}
              </button>

              {tipo !== "prestador" && (
                <div>
                  <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">Nome da Empresa / Negócio</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`Ex: ${partnerTypeExample(tipo)}`}
                    maxLength={60}
                    className="nv-body w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                  />
                </div>
              )}
              <div>
                <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@suaempresa.com"
                  className="nv-body w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="nv-body w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">🇧🇷 WhatsApp Corporativo</label>
                <input
                  value={phonePt}
                  onChange={(e) => setPhonePt(e.target.value)}
                  placeholder="090-1234-5678"
                  className="nv-body w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                />
                <p className="nv-body mt-1 text-[11px] text-slate-400">
                  Informe de preferência o número de um atendente que fale português, pois mensagens e alertas serão disparados nesse idioma.
                </p>
              </div>

              {tipo === "prestador" && (
                <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                  <p className="nv-body flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                    <Sparkles className="h-3.5 w-3.5" /> Seu anúncio (já entra no ar com o cadastro)
                  </p>
                  <div>
                    <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">Nome do negócio</label>
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={`Ex: ${partnerTypeExample(tipo)}`}
                      maxLength={40}
                      className="nv-body w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                    />
                    <p className="nv-body text-right text-[10px] text-slate-400">{name.length}/40</p>
                  </div>
                  <div>
                    <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">Categoria</label>
                    <select
                      value={listingCategoriaSelect}
                      onChange={(e) => setListingCategoriaSelect(e.target.value)}
                      className="nv-body w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-700 outline-none focus:border-blue-400"
                    >
                      <option value="" disabled>Selecione uma categoria...</option>
                      {serviceCategories.map((c) => (
                        <option key={c.nome} value={c.nome}>{c.nome}</option>
                      ))}
                      <option value="__nova__">➕ Criar nova categoria</option>
                    </select>
                    {isNewListingCategory && (
                      <input
                        value={listingNovaCategoria}
                        onChange={(e) => setListingNovaCategoria(e.target.value)}
                        placeholder="Nome da categoria"
                        maxLength={30}
                        autoFocus
                        className="nv-body mt-2 w-full rounded-lg border border-blue-300 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
                      />
                    )}
                  </div>
                  <div>
                    <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">Descrição do serviço</label>
                    <textarea
                      value={listingDescricao}
                      onChange={(e) => setListingDescricao(e.target.value)}
                      rows={2}
                      maxLength={120}
                      placeholder="Ex: Reparo geral, troca de óleo e revisão pra shaken."
                      className="nv-body w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
                    />
                    <p className="nv-body text-right text-[10px] text-slate-400">{listingDescricao.length}/120</p>
                  </div>

                  <div>
                    <p className="nv-body mb-1.5 text-[10px] font-semibold text-slate-400">Prévia do card</p>
                    <ServiceProviderCard
                      item={{
                        id: "preview",
                        nome: name.trim() || "Nome do seu negócio",
                        categoria: listingCategoriaFinal || "Categoria",
                        descricao: listingDescricao.trim() || "Descreva seu serviço aqui...",
                        whatsapp: phonePt.trim() || "090-0000-0000",
                        likes: 0,
                      }}
                      isLiked={false}
                      onToggleLike={() => {}}
                      categories={
                        isNewListingCategory && listingNovaCategoria.trim()
                          ? [...serviceCategories, { nome: listingNovaCategoria.trim(), color: CATEGORY_COLOR_OPTIONS[serviceCategories.length % CATEGORY_COLOR_OPTIONS.length].key, icon: "Building2" }]
                          : serviceCategories
                      }
                    />
                  </div>
                </div>
              )}
              {tipo !== "prestador" && (
                <div>
                  <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">🇯🇵 Telefone Corporativo / Recepção Japonês <span className="font-normal text-slate-400">(opcional)</span></label>
                  <input
                    value={phoneJp}
                    onChange={(e) => setPhoneJp(e.target.value)}
                    placeholder="0120-12-3456 ou 052-123-4567"
                    className="nv-body w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                  />
                </div>
              )}

              {signupError && <p className="nv-body text-[12px] font-medium text-rose-600">{signupError}</p>}

              <button
                onClick={handleFinishSignup}
                disabled={!canFinishSignup || signingUp}
                className="nv-body flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {signingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Criar Conta e Acessar
              </button>
            </div>
          )}

          {mode === "login" && (
            <div className="space-y-4">
              <p className="nv-body text-[13px] leading-relaxed text-slate-600">
                Entre com o e-mail e a senha cadastrados.
              </p>
              <div>
                <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">E-mail</label>
                <input
                  autoFocus
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="contato@suaempresa.com"
                  className="nv-body w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="nv-body mb-1 block text-[11px] font-semibold text-blue-600">Senha</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="nv-body w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                />
              </div>
              {loginError && <p className="nv-body text-[12px] font-medium text-rose-600">{loginError}</p>}
              <button
                onClick={handleLogin}
                disabled={!loginEmail.trim() || !loginPassword.trim() || loggingIn}
                className="nv-body flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Entrar
              </button>
              <button
                onClick={() => setMode("cadastro")}
                className="nv-body block w-full text-center text-[12px] font-semibold text-slate-500 hover:text-blue-600"
              >
                ← Ainda não tenho cadastro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
