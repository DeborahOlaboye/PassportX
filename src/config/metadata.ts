import { MetadataConfig } from '@/types/walletconnect-config';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://passportx.io';
};

export const APP_METADATA: MetadataConfig = {
  name: 'PassportX',
  description: 'Achievement Passport - Verify and manage your digital credentials on Stacks Blockchain',
  url: getBaseUrl(),
  icons: [
    `${getBaseUrl()}/logo.png`,
    `${getBaseUrl()}/logo-192.png`,
    `${getBaseUrl()}/logo-512.png`,
  ],
  verifyUrl: `${getBaseUrl()}/verify`,
};

export const WALLET_METADATA = {
  name: APP_METADATA.name,
  description: APP_METADATA.description,
  url: APP_METADATA.url,
  icons: APP_METADATA.icons,
};

export const METADATA_LINKS = {
  website: 'https://passportx.io',
  documentation: 'https://docs.passportx.io',
  github: 'https://github.com/DeborahOlaboye/PassportX',
  twitter: 'https://twitter.com/passportx',
  discord: 'https://discord.gg/passportx',
};

export function getAppMetadata(): MetadataConfig {
  return {
    ...APP_METADATA,
    url: getBaseUrl(),
    icons: [
      `${getBaseUrl()}/logo.png`,
      `${getBaseUrl()}/logo-192.png`,
      `${getBaseUrl()}/logo-512.png`,
    ],
  };
}

export function validateMetadata(metadata: MetadataConfig): boolean {
  return !!(
    metadata.name &&
    metadata.description &&
    metadata.url &&
    metadata.icons &&
    metadata.icons.length > 0
  );
}
