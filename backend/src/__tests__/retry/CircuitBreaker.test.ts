import { describe, it, expect, beforeEach } from '@jest/globals';
import { CircuitBreaker } from '../../services/CircuitBreakerService';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-breaker', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      volumeThreshold: 3,
      errorThresholdPercentage: 50,
      monitoringPeriod: 60000
    });
  });

  describe('execute', () => {
    it('should execute function when circuit is closed', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await breaker.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should reject when circuit is open', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Trigger failures to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(mockFn);
        } catch (e) {
          // Expected failures
        }
      }

      // Circuit should now be open
      await expect(breaker.execute(mockFn)).rejects.toThrow('Circuit breaker');
    });

    it('should transition to half-open after timeout', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(mockFn);
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('OPEN');

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Next call should transition to HALF_OPEN
      const successFn = jest.fn().mockResolvedValue('success');
      await breaker.execute(successFn);

      expect(breaker.getState()).not.toBe('OPEN');
    });
  });

  describe('state management', () => {
    it('should track consecutive failures', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(mockFn);
        } catch (e) {
          // Expected
        }
      }

      const stats = breaker.getStats();
      expect(stats.consecutiveFailures).toBe(2);
    });

    it('should reset consecutive failures on success', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('failure'));
      const successFn = jest.fn().mockResolvedValue('success');

      try {
        await breaker.execute(failFn);
      } catch (e) {
        // Expected
      }

      await breaker.execute(successFn);

      const stats = breaker.getStats();
      expect(stats.consecutiveFailures).toBe(0);
      expect(stats.consecutiveSuccesses).toBe(1);
    });
  });

  describe('force state changes', () => {
    it('should force circuit open', () => {
      breaker.forceOpen();
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should force circuit closed', async () => {
      breaker.forceOpen();
      breaker.forceClose();
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should force circuit half-open', () => {
      breaker.forceHalfOpen();
      expect(breaker.getState()).toBe('HALF_OPEN');
    });
  });

  describe('statistics', () => {
    it('should track total calls and successes', async () => {
      const successFn = jest.fn().mockResolvedValue('success');

      await breaker.execute(successFn);
      await breaker.execute(successFn);

      const stats = breaker.getStats();
      expect(stats.totalCalls).toBe(2);
      expect(stats.totalSuccesses).toBe(2);
    });

    it('should track total failures', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('failure'));

      try {
        await breaker.execute(failFn);
      } catch (e) {
        // Expected
      }

      const stats = breaker.getStats();
      expect(stats.totalFailures).toBe(1);
    });

    it('should track rejected calls when circuit is open', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(mockFn);
        } catch (e) {
          // Expected
        }
      }

      // Try to execute when circuit is open
      try {
        await breaker.execute(mockFn);
      } catch (e) {
        // Expected
      }

      const stats = breaker.getStats();
      expect(stats.rejectedCalls).toBeGreaterThan(0);
    });
  });
});
