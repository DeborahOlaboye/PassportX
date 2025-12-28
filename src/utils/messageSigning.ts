/**
 * Message signing utilities for WalletConnect authentication.
 * Uses standard Web Crypto API for signature generation.
 */

export interface SignatureRequest {
  message: string;
  domain?: string; // e.g., 'passportx.app'
  timestamp?: number;
}

export interface SignaturePayload extends SignatureRequest {
  timestamp: number;
}

/**
 * Create a message payload to be signed.
 * Includes domain and timestamp to prevent replay attacks.
 */
export const createSignaturePayload = (req: SignatureRequest): SignaturePayload => {
  return {
    message: req.message,
    domain: req.domain ?? 'passportx.app',
    timestamp: req.timestamp ?? Date.now()
  };
};

/**
 * Format payload for signing (human readable).
 */
export const formatMessageForSigning = (payload: SignaturePayload): string => {
  return `${payload.domain} wants you to sign in with your wallet.\n\nMessage: ${payload.message}\n\nTimestamp: ${payload.timestamp}`;
};

export default { createSignaturePayload, formatMessageForSigning };
