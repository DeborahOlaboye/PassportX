import { ErrorDeduplicator, DedupeConfig } from '../ErrorDeduplicator';

describe('ErrorDeduplicator', () => {
  let deduplicator: ErrorDeduplicator;

  beforeEach(() => {
    deduplicator = new ErrorDeduplicator({ windowMs: 1000, maxErrors: 3 });
  });

  describe('shouldLogError', () => {
    it('should log first occurrence of error', () => {
      expect(deduplicator.shouldLogError('test error')).toBe(true);
    });

    it('should suppress duplicate errors within window', () => {
      deduplicator.shouldLogError('test error');
      expect(deduplicator.shouldLogError('test error')).toBe(false);
    });

    it('should allow maxErrors within window', () => {
      expect(deduplicator.shouldLogError('test error')).toBe(true);
      expect(deduplicator.shouldLogError('test error')).toBe(false);
      expect(deduplicator.shouldLogError('test error')).toBe(false);
    });

    it('should differentiate different error messages', () => {
      deduplicator.shouldLogError('error1');
      expect(deduplicator.shouldLogError('error2')).toBe(true);
    });

    it('should differentiate based on stack trace', () => {
      const stack1 = 'Error at line 1';
      const stack2 = 'Error at line 2';
      expect(deduplicator.shouldLogError('test error', stack1)).toBe(true);
      expect(deduplicator.shouldLogError('test error', stack2)).toBe(true);
    });
  });

  describe('pruneOldEntries', () => {
    it('should remove old entries', () => {
      deduplicator.shouldLogError('old error');
      jest.advanceTimersByTime(2000);
      expect(deduplicator.pruneOldEntries()).toBe(1);
      expect(deduplicator.getStats().uniqueErrors).toBe(0);
    });

    it('should keep recent entries', () => {
      deduplicator.shouldLogError('recent error');
      jest.advanceTimersByTime(500);
      expect(deduplicator.pruneOldEntries()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should track total and unique errors', () => {
      deduplicator.shouldLogError('error1');
      deduplicator.shouldLogError('error2');
      deduplicator.shouldLogError('error1');
      expect(deduplicator.getStats()).toEqual({
        totalErrors: 3,
        uniqueErrors: 2,
      });
    });
  });

  describe('clear', () => {
    it('should clear all cached errors', () => {
      deduplicator.shouldLogError('error1');
      deduplicator.clear();
      expect(deduplicator.getStats().uniqueErrors).toBe(0);
    });
  });

  describe('hash collision resistance', () => {
    it('should generate unique hashes for similar error messages', () => {
      const hashes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const msg = `Error message ${i}`;
        const hash1 = deduplicator.shouldLogError(msg);
        const hash2 = deduplicator.shouldLogError(msg + ' ');
        expect(hash1).toBe(true);
        expect(hash2).toBe(true);
      }
    });

    it('should differentiate errors with different stack traces', () => {
      const stack1 = 'Error: Test\n    at test (test.ts:1:1)';
      const stack2 = 'Error: Test\n    at test (test.ts:2:2)';
      deduplicator.shouldLogError('Test error', stack1);
      const stats = deduplicator.getStats();
      expect(stats.uniqueErrors).toBe(1);
      deduplicator.shouldLogError('Test error', stack2);
      const stats2 = deduplicator.getStats();
      expect(stats2.uniqueErrors).toBe(2);
    });

    it('should handle very long error messages', () => {
      const longMsg = 'A'.repeat(10000);
      expect(deduplicator.shouldLogError(longMsg)).toBe(true);
      expect(deduplicator.getStats().uniqueErrors).toBe(1);
    });

    it('should handle unicode characters in messages', () => {
      expect(deduplicator.shouldLogError('Error with émoji 🎉')).toBe(true);
      expect(deduplicator.shouldLogError('Error with 中文')).toBe(true);
      expect(deduplicator.getStats().uniqueErrors).toBe(2);
    });

    it('should handle empty and whitespace-only messages', () => {
      expect(deduplicator.shouldLogError('')).toBe(true);
      expect(deduplicator.shouldLogError('   ')).toBe(true);
      expect(deduplicator.getStats().uniqueErrors).toBe(2);
    });

    it('should differentiate messages with special characters', () => {
      expect(deduplicator.shouldLogError('Error: "test"')).toBe(true);
      expect(deduplicator.shouldLogError("Error: 'test'")).toBe(true);
      expect(deduplicator.getStats().uniqueErrors).toBe(2);
    });
  });
});
