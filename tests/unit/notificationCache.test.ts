import { notificationCache } from '../../src/utils/notificationCache';

describe('Notification Cache', () => {
  beforeEach(() => {
    notificationCache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const testData = { id: '1', message: 'test' };
      notificationCache.set('key1', testData);
      const retrieved = notificationCache.get('key1');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent key', () => {
      const retrieved = notificationCache.get('nonexistent');
      expect(retrieved).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      notificationCache.set('key1', { data: 'test' });
      expect(notificationCache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(notificationCache.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove key from cache', () => {
      notificationCache.set('key1', { data: 'test' });
      notificationCache.delete('key1');
      expect(notificationCache.has('key1')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      notificationCache.set('key1', { data: 'test1' });
      notificationCache.set('key2', { data: 'test2' });
      notificationCache.clear();
      expect(notificationCache.has('key1')).toBe(false);
      expect(notificationCache.has('key2')).toBe(false);
    });
  });

  describe('TTL', () => {
    it('should expire entries after TTL', (done) => {
      notificationCache.set('key1', { data: 'test' }, 100);
      setTimeout(() => {
        const retrieved = notificationCache.get('key1');
        expect(retrieved).toBeNull();
        done();
      }, 150);
    });

    it('should not expire entries before TTL', () => {
      notificationCache.set('key1', { data: 'test' }, 5000);
      const retrieved = notificationCache.get('key1');
      expect(retrieved).toEqual({ data: 'test' });
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', (done) => {
      notificationCache.set('key1', { data: 'test1' }, 100);
      notificationCache.set('key2', { data: 'test2' }, 5000);
      setTimeout(() => {
        notificationCache.cleanup();
        expect(notificationCache.has('key1')).toBe(false);
        expect(notificationCache.has('key2')).toBe(true);
        done();
      }, 150);
    });
  });
});
