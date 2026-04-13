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
});
