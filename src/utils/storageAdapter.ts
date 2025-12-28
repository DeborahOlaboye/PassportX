export type StorageArea = 'local' | 'session';

const available = (kind: StorageArea) => {
  try {
    if (kind === 'local') return typeof localStorage !== 'undefined';
    return typeof sessionStorage !== 'undefined';
  } catch (e) {
    return false;
  }
};

export const setItem = (key: string, value: string, area: StorageArea = 'local') => {
  try {
    if (area === 'session' && available('session')) return sessionStorage.setItem(key, value);
    if (area === 'local' && available('local')) return localStorage.setItem(key, value);
  } catch (e) {
    // ignore
  }
};

export const getItem = (key: string, area: StorageArea = 'local') => {
  try {
    if (area === 'session' && available('session')) return sessionStorage.getItem(key);
    if (area === 'local' && available('local')) return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
  return null;
};

export const removeItem = (key: string) => {
  try {
    if (available('local')) localStorage.removeItem(key);
    if (available('session')) sessionStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
};

export default { setItem, getItem, removeItem };
