export interface DedupeConfig {
  windowMs: number;
  maxErrors: number;
  enableGrouping: boolean;
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

  constructor(config: Partial<DedupeConfig> = {}) {
    this.config = {
      windowMs: config.windowMs || 60000,
      maxErrors: config.maxErrors || 100,
      enableGrouping: config.enableGrouping ?? true,
    };
  }

  private generateHash(message: string, stack?: string): string {
    const key = `${message}:${stack || ''}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  shouldLogError(message: string, stack?: string): boolean {
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
      return false;
    }

    entry.count++;
    entry.lastSeen = now;
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
}

export const errorDeduplicator = new ErrorDeduplicator();
