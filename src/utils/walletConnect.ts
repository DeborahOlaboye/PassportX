export interface WalletConnectionConfig {
  projectId: string;
  relayUrl?: string;
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

export interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  downloadUrl: string;
}

const DEFAULT_RELAY_URL = 'wss://relay.walletconnect.org';

export function getWalletConnectConfig(): WalletConnectionConfig {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

  if (!projectId) {
    console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
  }

  return {
    projectId,
    relayUrl: process.env.NEXT_PUBLIC_WALLETCONNECT_RELAY_URL || DEFAULT_RELAY_URL,
    metadata: {
      name: 'PassportX',
      description: 'Achievement Passport on Stacks Blockchain',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://passportx.io',
      icons: [
        `${typeof window !== 'undefined' ? window.location.origin : 'https://passportx.io'}/logo.png`,
      ],
    },
  };
}

export const SUPPORTED_WALLET_INFO: Record<string, WalletInfo> = {
  xverse: {
    id: 'xverse',
    name: 'Xverse',
    icon: '🔷',
    downloadUrl: 'https://www.xverse.app',
  },
  hiro: {
    id: 'hiro',
    name: 'Hiro Wallet',
    icon: '🔶',
    downloadUrl: 'https://www.hiro.so/wallet',
  },
  leather: {
    id: 'leather',
    name: 'Leather',
    icon: '🟫',
    downloadUrl: 'https://leather.io',
  },
};

export function generateSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateWalletConnectUri(projectId: string): string {
  const sessionId = generateSessionId();
  const key = generateRandomKey();

  return `wc:${sessionId}@2?bridge=https://bridge.walletconnect.org&key=${key}&projectId=${projectId}`;
}

function generateRandomKey(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

export function validateWalletAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const stacksAddressRegex = /^(SP|SM)[A-Z0-9]{39}$/;
  return stacksAddressRegex.test(address);
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function isWalletConnectUri(uri: string): boolean {
  return /^wc:.+@2\?/.test(uri);
}

export async function saveSessionToStorage(sessionKey: string, sessionData: unknown): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`walletconnect_session_${sessionKey}`, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save session to storage:', error);
  }
}

export async function loadSessionFromStorage(sessionKey: string): Promise<unknown | null> {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(`walletconnect_session_${sessionKey}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load session from storage:', error);
    return null;
  }
}

export async function clearSessionFromStorage(sessionKey: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(`walletconnect_session_${sessionKey}`);
  } catch (error) {
    console.error('Failed to clear session from storage:', error);
  }
}
