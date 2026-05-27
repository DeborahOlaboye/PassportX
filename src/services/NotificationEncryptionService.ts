import crypto from 'crypto';

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  ivLength: number;
  authTagLength: number;
}

class NotificationEncryptionService {
  private config: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keySize: 32,
    ivLength: 16,
    authTagLength: 16,
  };

  encrypt(data: string, key: string): string {
    if (!data) throw new Error('Data cannot be empty');
    if (!key || key.length < 8) throw new Error('Key must be at least 8 characters');
    const keyBuffer = crypto.scryptSync(key, 'passportx-salt', this.config.keySize);
    const iv = crypto.randomBytes(this.config.ivLength);
    const cipher = crypto.createCipheriv(this.config.algorithm, keyBuffer, iv, {
      authTagLength: this.config.authTagLength,
    });
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(encryptedData: string, key: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const keyBuffer = crypto.scryptSync(key, 'passportx-salt', this.config.keySize);
    const decipher = crypto.createDecipheriv(this.config.algorithm, keyBuffer, iv, {
      authTagLength: this.config.authTagLength,
    });
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  }

  setConfig(config: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): EncryptionConfig {
    return { ...this.config };
  }

  generateKey(): string {
    return crypto.randomBytes(this.config.keySize).toString('hex');
  }

  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export const notificationEncryptionService =
  new NotificationEncryptionService();
