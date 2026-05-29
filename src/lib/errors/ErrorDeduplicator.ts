export interface DedupeConfig {
  windowMs: number;
  maxErrors: number;
  enableGrouping: boolean;
  pruneIntervalMs?: number;
  onErrorSpike?: (errorKey: string, count: number) => void;
  onCacheFull?: (currentSize: number) => void;
}

export interface DedupeEntry {
  count: number;
  firstSeen: number;
  lastSeen: number;
  errorHash: string;
}

export class ErrorDeduplicator {
  private cache = new Map<string, DedupeEntry>();
  private config: DedupeConfig;
  private pruneTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<DedupeConfig> = {}) {
    this.config = {
      windowMs: config.windowMs || 60000,
      maxErrors: config.maxErrors || 100,
      enableGrouping: config.enableGrouping ?? true,
      pruneIntervalMs: config.pruneIntervalMs,
      onErrorSpike: config.onErrorSpike,
      onCacheFull: config.onCacheFull,
    };

    if (this.config.pruneIntervalMs && this.config.pruneIntervalMs > 0) {
      this.pruneTimer = setInterval(() => {
        this.pruneOldEntries();
      }, this.config.pruneIntervalMs);
    }
  }

  private checkErrorSpike(entry: DedupeEntry): void {
    if (this.config.onErrorSpike && entry.count >= 10) {
      this.config.onErrorSpike(entry.errorHash, entry.count);
    }
  }

  private checkCacheFull(): void {
    if (this.config.onCacheFull && this.cache.size >= 1000) {
      this.config.onCacheFull(this.cache.size);
    }
  }

  private generateHash(message: string, stack?: string): string {
    const key = `${message}:${stack || ''}`;
    let hash = 0;
    const salt = 'PassportX_ErrorDeduplicator_v1';
    const saltedKey = salt + key + salt;
    for (let i = 0; i < saltedKey.length; i++) {
      const char = saltedKey.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    let result = Math.abs(hash).toString(36);
    result += '_' + key.length.toString(36);
    const prefix = key.substring(0, 16).replace(/[^a-z0-9]/gi, 'x');
    return prefix.substring(0, 16) + '_' + result;
  }

  shouldLogError(message: string, stack?: string): boolean {
    this.checkCacheFull();
    const hash = this.generateHash(message, stack);
    const now = Date.now();
    const entry = this.cache.get(hash);

    if (!entry) {
      this.cache.set(hash, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        errorHash: hash,
      });
      return true;
    }

    if (now - entry.lastSeen > this.config.windowMs) {
      entry.count = 1;
      entry.firstSeen = now;
      entry.lastSeen = now;
      return true;
    }

    if (entry.count >= this.config.maxErrors) {
      this.checkErrorSpike(entry);
      return false;
    }

    entry.count++;
    entry.lastSeen = now;
    this.checkErrorSpike(entry);
    return true;
  }

  getStats(): { totalErrors: number; uniqueErrors: number } {
    return {
      totalErrors: Array.from(this.cache.values()).reduce(
        (sum, e) => sum + e.count,
        0
      ),
      uniqueErrors: this.cache.size,
    };
  }

  clear(): void {
    this.cache.clear();
  }

  pruneOldEntries(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this.cache) {
      if (now - entry.lastSeen > this.config.windowMs) {
        this.cache.delete(key);
        pruned++;
      }
    }
    return pruned;
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheEntries(): Map<string, DedupeEntry> {
    return new Map(this.cache);
  }

  getConfig(): Readonly<DedupeConfig> {
    return { ...this.config };
  }

  updateConfig(config: Partial<DedupeConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  destroy(): void {
    if (this.pruneTimer !== null) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
    this.cache.clear();
  }
}

export const errorDeduplicator = new ErrorDeduplicator();
