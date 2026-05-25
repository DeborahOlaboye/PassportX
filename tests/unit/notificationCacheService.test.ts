import { notificationCacheService } from '../../src/services/NotificationCacheService';

describe('Notification Cache Service', () => {
  beforeEach(() => {
    notificationCacheService.clear();
  });

  describe('set', () => {
    it('should set a value in cache', () => {
      notificationCacheService.set('key1', 'value1');
      expect(notificationCacheService.has('key1')).toBe(true);
    });
  });

  describe('get', () => {
    it('should get a value from cache', () => {
      notificationCacheService.set('key1', 'value1');
      const value = notificationCacheService.get('key1');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent key', () => {
      const value = notificationCacheService.get('nonexistent');
      expect(value).toBeNull();
    });

    it('should return null for expired entry', (done) => {
      notificationCacheService.set('key1', 'value1', 100);
      setTimeout(() => {
        const value = notificationCacheService.get('key1');
        expect(value).toBeNull();
        done();
      }, 150);
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      notificationCacheService.set('key1', 'value1');
      expect(notificationCacheService.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(notificationCacheService.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a key from cache', () => {
      notificationCacheService.set('key1', 'value1');
      const deleted = notificationCacheService.delete('key1');
      expect(deleted).toBe(true);
      expect(notificationCacheService.has('key1')).toBe(false);
    });

    it('should return false for non-existent key', () => {
      const deleted = notificationCacheService.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      notificationCacheService.set('key1', 'value1');
      notificationCacheService.set('key2', 'value2');
      notificationCacheService.clear();
      expect(notificationCacheService.size()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', (done) => {
      notificationCacheService.set('key1', 'value1', 100);
      notificationCacheService.set('key2', 'value2', 10000);
      setTimeout(() => {
        notificationCacheService.cleanup();
        expect(notificationCacheService.has('key1')).toBe(false);
        expect(notificationCacheService.has('key2')).toBe(true);
        done();
      }, 150);
    });
  });

  describe('size', () => {
    it('should return cache size', () => {
      notificationCacheService.set('key1', 'value1');
      notificationCacheService.set('key2', 'value2');
      expect(notificationCacheService.size()).toBe(2);
    });
  });

  describe('setDefaultTTL', () => {
    it('should set default TTL', () => {
      notificationCacheService.setDefaultTTL(5000);
      expect(notificationCacheService.getDefaultTTL()).toBe(5000);
    });
  });

  describe('getDefaultTTL', () => {
    it('should return default TTL', () => {
      const ttl = notificationCacheService.getDefaultTTL();
      expect(ttl).toBe(60000);
    });
  });
});
