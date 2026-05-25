import { notificationEncryptionService } from '../../src/services/NotificationEncryptionService';

describe('Notification Encryption Service', () => {
  describe('encrypt', () => {
    it('should encrypt data', () => {
      const encrypted = notificationEncryptionService.encrypt(
        'test data',
        'key'
      );
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe('test data');
    });
  });

  describe('decrypt', () => {
    it('should decrypt data', () => {
      const encrypted = notificationEncryptionService.encrypt(
        'test data',
        'key'
      );
      const decrypted = notificationEncryptionService.decrypt(encrypted, 'key');
      expect(decrypted).toBe('test data');
    });
  });

  describe('setConfig', () => {
    it('should update config', () => {
      notificationEncryptionService.setConfig({ algorithm: 'AES-128' });
      const config = notificationEncryptionService.getConfig();
      expect(config.algorithm).toBe('AES-128');
    });
  });

  describe('getConfig', () => {
    it('should return current config', () => {
      const config = notificationEncryptionService.getConfig();
      expect(config.algorithm).toBe('AES-256-GCM');
    });
  });

  describe('generateKey', () => {
    it('should generate a key', () => {
      const key = notificationEncryptionService.generateKey();
      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
    });
  });

  describe('hash', () => {
    it('should hash data', () => {
      const hash = notificationEncryptionService.hash('test data');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce consistent hash for same data', () => {
      const hash1 = notificationEncryptionService.hash('test data');
      const hash2 = notificationEncryptionService.hash('test data');
      expect(hash1).toBe(hash2);
    });
  });
});
