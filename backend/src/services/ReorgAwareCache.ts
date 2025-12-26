import ReorgHandlerService, { ReorgEvent } from './ReorgHandlerService'

export interface CacheEntry {
  key: string;
  value: any;
  blockHeight: number;
  timestamp: number;
}

export class ReorgAwareCache {
  private cache: Map<string, CacheEntry> = new Map();
  private blockIndex: Map<number, Set<string>> = new Map(); // blockHeight -> keys
  private reorgHandler: ReorgHandlerService;
  private logger: any;

  constructor(reorgHandler: ReorgHandlerService, logger?: any) {
    this.reorgHandler = reorgHandler;
    this.logger = logger || this.getDefaultLogger();

    // Listen for reorg events
    this.setupReorgListener();
  }

  /**
   * Set a value in the cache with block height tracking
   */
  set(key: string, value: any, blockHeight: number): void {
    const entry: CacheEntry = {
      key,
      value,
      blockHeight,
      timestamp: Date.now()
    };

    this.cache.set(key, entry);

    // Track keys by block height
    if (!this.blockIndex.has(blockHeight)) {
      this.blockIndex.set(blockHeight, new Set());
    }
    this.blockIndex.get(blockHeight)!.add(key);

    this.logger.debug(`Cache set: ${key} at block ${blockHeight}`);
  }

  /**
   * Get a value from the cache
   */
  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    return entry?.value;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      // Remove from block index
      const blockKeys = this.blockIndex.get(entry.blockHeight);
      if (blockKeys) {
        blockKeys.delete(key);
        if (blockKeys.size === 0) {
          this.blockIndex.delete(entry.blockHeight);
        }
      }

      this.cache.delete(key);
      this.logger.debug(`Cache deleted: ${key}`);
      return true;
    }
    return false;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.blockIndex.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * Rollback cache to a specific block height
   */
  rollbackToBlock(blockHeight: number): void {
    this.logger.info(`Rolling back cache to block ${blockHeight}`);

    // Get all block heights greater than the rollback point
    const blocksToRemove = Array.from(this.blockIndex.keys())
      .filter(height => height > blockHeight);

    for (const height of blocksToRemove) {
      const keys = this.blockIndex.get(height);
      if (keys) {
        for (const key of keys) {
          this.cache.delete(key);
          this.logger.debug(`Rolled back cache entry: ${key} from block ${height}`);
        }
      }
      this.blockIndex.delete(height);
    }

    this.logger.info(`Cache rollback complete. Removed entries from ${blocksToRemove.length} blocks`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    blocksTracked: number;
    oldestBlock: number | null;
    newestBlock: number | null;
  } {
    const blocks = Array.from(this.blockIndex.keys()).sort((a, b) => a - b);

    return {
      totalEntries: this.cache.size,
      blocksTracked: this.blockIndex.size,
      oldestBlock: blocks.length > 0 ? blocks[0] : null,
      newestBlock: blocks.length > 0 ? blocks[blocks.length - 1] : null
    };
  }

  /**
   * Get all keys for a specific block height
   */
  getKeysForBlock(blockHeight: number): string[] {
    const keys = this.blockIndex.get(blockHeight);
    return keys ? Array.from(keys) : [];
  }

  /**
   * Setup listener for reorg events
   */
  private setupReorgListener(): void {
    // Note: In a real implementation, you would subscribe to reorg events
    // from the ReorgHandlerService. For now, this is a placeholder.
    this.logger.info('Reorg listener setup (placeholder)');
  }

  /**
   * Handle reorg event (called by external reorg handler)
   */
  async handleReorg(reorgEvent: ReorgEvent): Promise<void> {
    this.logger.warn('Handling reorg in cache', {
      rollbackToBlock: reorgEvent.rollbackToBlock,
      newCanonicalBlock: reorgEvent.newCanonicalBlock
    });

    // Rollback cache to the canonical chain
    this.rollbackToBlock(reorgEvent.rollbackToBlock);

    // Note: In a real implementation, you would also need to:
    // 1. Re-populate cache with canonical chain data
    // 2. Handle any cache invalidation for affected keys
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[ReorgAwareCache] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[ReorgAwareCache] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[ReorgAwareCache] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ReorgAwareCache] ${msg}`, ...args)
    };
  }
}

export default ReorgAwareCache;