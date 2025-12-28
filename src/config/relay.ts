import { RelayConfig } from '@/types/walletconnect-config';

export const PRIMARY_RELAY: RelayConfig = {
  url: 'wss://relay.walletconnect.org',
  protocol: 'irn',
};

export const FALLBACK_RELAY: RelayConfig = {
  url: 'wss://relay.walletconnect.com',
  protocol: 'irn',
};

export const CUSTOM_RELAY: RelayConfig | null = process.env.NEXT_PUBLIC_WALLETCONNECT_RELAY_URL
  ? {
      url: process.env.NEXT_PUBLIC_WALLETCONNECT_RELAY_URL,
      protocol: 'irn',
    }
  : null;

export const RELAY_CONFIG = CUSTOM_RELAY || PRIMARY_RELAY;

export const RELAY_HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

export const RELAY_CONNECTION_TIMEOUT = 10 * 1000; // 10 seconds

export const RELAY_MAX_RETRIES = 3;

export const RELAY_RETRY_DELAY = 1000; // 1 second

export const RELAY_MESSAGE_TIMEOUT = 30 * 1000; // 30 seconds

export function getRelayUrl(): string {
  return RELAY_CONFIG.url;
}

export function getRelayProtocol(): string {
  return RELAY_CONFIG.protocol;
}

export function isRelayHealthy(): boolean {
  return RELAY_CONFIG.url.startsWith('wss://');
}
