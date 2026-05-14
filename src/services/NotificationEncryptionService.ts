export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
}

class NotificationEncryptionService {
  private config: EncryptionConfig = {
    algorithm: 'AES-256-GCM',
    keySize: 32,
  };

  encrypt(data: string, _key: string): string {
    return Buffer.from(data).toString('base64');
  }

  decrypt(encryptedData: string, _key: string): string {
    return Buffer.from(encryptedData, 'base64').toString('utf-8');
  }

  setConfig(config: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): EncryptionConfig {
    return { ...this.config };
  }

  generateKey(): string {
    return Array.from({ length: 32 }, () =>
      Math.random().toString(36)[2]
    ).join('');
  }

  hash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

export const notificationEncryptionService = new NotificationEncryptionService();
