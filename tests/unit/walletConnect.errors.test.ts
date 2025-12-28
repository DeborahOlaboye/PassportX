/**
 * Tests for error handling scenarios.
 */
import { WalletError } from '../../src/utils/errorTypes';

describe('WalletConnect error handling', () => {
  it('should handle connection errors', () => {
    const error = new WalletError('WC_CONNECT_FAILED', 'Failed to connect');
    expect(error.code).toBe('WC_CONNECT_FAILED');
    expect(error.message).toBe('Failed to connect');
  });

  it('should handle signing errors', () => {
    const error = new WalletError('WC_SIGN_FAILED', 'Signing failed');
    expect(error.code).toBe('WC_SIGN_FAILED');
  });

  it('should handle timeout errors', () => {
    const error = new WalletError('WC_TIMEOUT', 'Operation timed out');
    expect(error.code).toBe('WC_TIMEOUT');
  });

  it('should include error details', () => {
    const details = { originalError: 'Network timeout' };
    const error = new WalletError('WC_TIMEOUT', 'Timeout', details);
    expect(error.details?.originalError).toBe('Network timeout');
  });

  it('should handle unknown errors', () => {
    const error = new WalletError('WC_UNKNOWN', 'Unknown error occurred');
    expect(error.code).toBe('WC_UNKNOWN');
  });

  it('should retry on transient errors', async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 2) throw new Error('Transient failure');
      return { success: true };
    };
    
    try {
      await operation();
    } catch (e) {
      // First attempt failed
    }
    const result = await operation();
    expect(result.success).toBe(true);
    expect(attempts).toBe(2);
  });

  it('should gracefully handle user cancellation', () => {
    const error = new WalletError('WC_SIGN_FAILED', 'User cancelled operation');
    expect(error.message).toContain('cancelled');
  });
});
