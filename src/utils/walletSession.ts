export interface WalletSession {
  id: string;
  accounts: string[];
  connectedAt: number; // epoch ms
  expiresAt?: number; // epoch ms
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = 'passportx_wallet_session_v1';

import storageAdapter, { StorageArea } from './storageAdapter';

type SaveOptions = {
  area?: StorageArea;
  encrypt?: (payload: string) => Promise<string> | string;
};

/**
 * Persist a wallet session. `opts.area` can be 'local' or 'session'.
 * Optional `encrypt` can be provided to protect the stored payload.
 */
export const saveSession = async (session: WalletSession, opts?: SaveOptions) => {
  const raw = JSON.stringify(session);
  try {
    const area = opts?.area ?? 'local';
    const payload = opts?.encrypt ? await opts.encrypt(raw) : raw;
    storageAdapter.setItem(STORAGE_KEY, payload, area);
    return true;
  } catch (e) {
    console.warn('Failed to save wallet session', e);
    return false;
  }
};

type LoadOptions = { area?: StorageArea; decrypt?: (payload: string) => Promise<string> | string };

/**
 * Load a persisted wallet session. If `decrypt` is supplied it will be used
 * to transform the stored payload back to plaintext before parsing.
 */
export const loadSession = async (opts?: LoadOptions): Promise<WalletSession | null> => {
  try {
    const area = opts?.area ?? 'local';
    const raw = storageAdapter.getItem(STORAGE_KEY, area);
    if (!raw) return null;
    const payload = opts?.decrypt ? await opts.decrypt(raw) : raw;
    const parsed = JSON.parse(payload) as WalletSession;
    return parsed;
  } catch (e) {
    console.warn('Failed to load wallet session', e);
    return null;
  }
};

export const clearSession = () => {
  try {
    storageAdapter.removeItem(STORAGE_KEY);
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

export const recoverSession = async (opts?: LoadOptions) : Promise<WalletSession | null> => {
  const session = await loadSession(opts);
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
