export interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
}

export class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = { ttl: 60000, maxSize: 100 }) {
    this.config = config;
  }

  set(key: string, value: T, ttl?: number): void {
    if (this.store.size >= this.config.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      value,
      expiry: Date.now() + (ttl || this.config.ttl),
    });
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  prune(): number {
    let pruned = 0;
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiry) {
        this.store.delete(key);
        pruned++;
      }
    }
    return pruned;
  }
}

export const createCache = <T>(config?: CacheConfig): Cache<T> => {
  return new Cache(config);
};

export const defaultCache = createCache();
