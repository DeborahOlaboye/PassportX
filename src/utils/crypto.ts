/*
  Lightweight Web Crypto helpers for optional client-side encryption.
  Uses AES-GCM. Keys are not persisted by this module.
*/
export const generateKeyFromPassword = async (password: string, salt?: Uint8Array) => {
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const s = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: s, iterations: 100000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  return { key, salt: s } as const;
};

export const encrypt = async (key: CryptoKey, data: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(data));
  const buffer = new Uint8Array(cipher);
  const out = new Uint8Array(iv.length + buffer.length);
  out.set(iv, 0);
  out.set(buffer, iv.length);
  return btoa(String.fromCharCode(...out));
};

export const decrypt = async (key: CryptoKey, dataB64: string) => {
  const raw = Uint8Array.from(atob(dataB64), (c) => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const cipher = raw.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new TextDecoder().decode(plain);
};

export default { generateKeyFromPassword, encrypt, decrypt };
