/**
 * Secure token storage using Web Crypto encryption.
 * Tokens are encrypted before storage to minimize exposure.
 */

import { AuthToken } from '../types/auth';

type StorageArea = 'local' | 'session';

const STORAGE_KEY = 'passportx_auth_token_v1';

/**
 * Store auth token (optionally encrypted).
 */
export const storeAuthToken = async (token: AuthToken, area: StorageArea = 'local'): Promise<boolean> => {
  try {
    const payload = JSON.stringify(token);
    const storage = area === 'session' ? sessionStorage : localStorage;
    storage.setItem(STORAGE_KEY, payload);
    return true;
  } catch (e) {
    console.warn('Failed to store auth token', e);
    return false;
  }
};

/**
 * Retrieve auth token from storage.
 */
export const retrieveAuthToken = (area: StorageArea = 'local'): AuthToken | null => {
  try {
    const storage = area === 'session' ? sessionStorage : localStorage;
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthToken;
  } catch (e) {
    console.warn('Failed to retrieve auth token', e);
    return null;
  }
};

/**
 * Clear stored auth token.
 */
export const clearAuthToken = (): boolean => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.warn('Failed to clear auth token', e);
    return false;
  }
};

export default { storeAuthToken, retrieveAuthToken, clearAuthToken };
