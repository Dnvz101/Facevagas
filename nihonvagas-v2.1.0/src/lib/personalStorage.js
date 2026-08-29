// src/lib/personalStorage.js
//
// No artifact original, dado PESSOAL (favoritos, modo escuro, Kakeibo,
// curtidas) usava window.storage em modo privado (shared: false) —
// essa API só existe dentro do Claude, não em navegador nenhum fora
// daqui. Aqui a substituição é localStorage: mesma ideia (dado preso
// só a esse navegador/aparelho), funciona em produção de verdade.
//
// ⚠️ Diferença importante de guardar: localStorage é POR NAVEGADOR,
// não por conta de usuário — ao contrário do window.storage pessoal,
// que era por CONTA do Claude (a mesma conta em outro navegador via
// o mesmo dispositivo Claude.ai também veria o dado). Aqui, se a
// pessoa trocar de navegador ou aparelho, os favoritos/preferências
// não acompanham — isso só se resolve de verdade com login real
// (Supabase Auth), guardando esse dado atrelado ao usuário logado em
// vez de no navegador. É uma melhoria natural pra quando a Auth
// migrar; por enquanto, localStorage é a base sólida e correta.
//
// Mantém as funções async (mesmo o localStorage sendo síncrono) só
// pra manter EXATAMENTE a mesma assinatura usada em todo o app — troca
// só o import, nenhum outro código precisa mudar.

export async function personalStorageGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // chave ainda não existe, ou navegador bloqueou localStorage (modo privado, etc)
  }
}

export async function personalStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  } catch (err) {
    throw new Error(`Falha ao salvar "${key}" no armazenamento local: ${err.message}`);
  }
}
