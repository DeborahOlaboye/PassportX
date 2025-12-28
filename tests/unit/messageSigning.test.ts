/**
 * Unit tests for message signing and verification.
 */

import { createSignaturePayload, formatMessageForSigning } from '../../src/utils/messageSigning';
import { verifySignature, isSignatureExpired } from '../../src/utils/signatureVerification';
import { SignedMessage } from '../../src/utils/signatureVerification';

describe('Message signing and verification', () => {
  it('should create signature payload with domain and timestamp', () => {
    const payload = createSignaturePayload({ message: 'test', domain: 'example.com' });
    expect(payload.message).toBe('test');
    expect(payload.domain).toBe('example.com');
    expect(payload.timestamp).toBeGreaterThan(0);
  });

  it('should format message for human-readable signing', () => {
    const payload = createSignaturePayload({ message: 'Login request' });
    const formatted = formatMessageForSigning(payload);
    expect(formatted).toContain('wants you to sign');
    expect(formatted).toContain('Login request');
  });

  it('should verify valid signature structure', () => {
    const signed: SignedMessage = {
      payload: createSignaturePayload({ message: 'test' }),
      signature: 'abc123def456',
      account: 'ST1234567890'
    };
    const result = verifySignature(signed);
    expect(result.valid).toBe(true);
  });

  it('should reject signature with empty signature', () => {
    const signed: SignedMessage = {
      payload: createSignaturePayload({ message: 'test' }),
      signature: '',
      account: 'ST1234567890'
    };
    const result = verifySignature(signed);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('should check signature expiration', () => {
    const payload = createSignaturePayload({ message: 'test' });
    payload.timestamp = Date.now() - 1000 * 60 * 10; // 10 minutes ago
    const signed: SignedMessage = {
      payload,
      signature: 'abc123',
      account: 'ST1234567890'
    };
    const expired = isSignatureExpired(signed, 1000 * 60 * 5); // 5 minute window
    expect(expired).toBe(true);
  });
});
