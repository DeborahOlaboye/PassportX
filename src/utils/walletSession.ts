export interface WalletSession {
  id: string;
  accounts: string[];
  connectedAt: number; // epoch ms
  expiresAt?: number; // epoch ms
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = 'passportx_wallet_session_v1';

export const saveSession = (session: WalletSession, useSessionStorage = false) => {
  const raw = JSON.stringify(session);
  try {
    if (useSessionStorage && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, raw);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, raw);
    }
    return true;
  } catch (e) {
    console.warn('Failed to save wallet session', e);
    return false;
  }
};

export const loadSession = (preferSessionStorage = false): WalletSession | null => {
  try {
    const raw = preferSessionStorage && typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(STORAGE_KEY)
      : typeof localStorage !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY)
        : null;

    if (!raw) return null;
    const parsed = JSON.parse(raw) as WalletSession;
    return parsed;
  } catch (e) {
    console.warn('Failed to load wallet session', e);
    return null;
  }
};

export const clearSession = () => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.warn('Failed to clear wallet session', e);
    return false;
  }
};

export const isExpired = (session: WalletSession | null) => {
  if (!session) return true;
  if (!session.expiresAt) return false;
  return Date.now() > session.expiresAt;
};

export const recoverSession = (preferSessionStorage = false): WalletSession | null => {
  const session = loadSession(preferSessionStorage);
  if (!session) return null;
  if (isExpired(session)) {
    clearSession();
    return null;
  }
  return session;
};

export default {
  saveSession,
  loadSession,
  clearSession,
  isExpired,
  recoverSession,
};
