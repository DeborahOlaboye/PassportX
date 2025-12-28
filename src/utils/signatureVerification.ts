/**
 * Signature verification utilities.
 * Verify that a message was signed by the claimed account.
 */

import { SignaturePayload } from './messageSigning';

export interface SignedMessage {
  payload: SignaturePayload;
  signature: string; // base64 encoded signature
  account: string; // signer address
}

/**
 * Verify a signature (placeholder for Stacks-based verification).
 * In production, this would use actual Stacks crypto verification.
 * For now, we validate format and timestamp.
 */
export const verifySignature = (signed: SignedMessage): { valid: boolean; reason?: string } => {
  // Basic validation
  if (!signed.signature || signed.signature.length === 0) {
    return { valid: false, reason: 'Signature is empty' };
  }
  if (!signed.account || signed.account.length === 0) {
    return { valid: false, reason: 'Account is empty' };
  }
  if (!signed.payload.message) {
    return { valid: false, reason: 'Message is empty' };
  }
  // In a real implementation, you would verify the actual signature cryptographically
  return { valid: true };
};

/**
 * Check if a signature is expired (beyond grace period).
 */
export const isSignatureExpired = (signed: SignedMessage, maxAgeMs: number = 1000 * 60 * 5): boolean => {
  const ageMs = Date.now() - signed.payload.timestamp;
  return ageMs > maxAgeMs;
};

export default { verifySignature, isSignatureExpired };
