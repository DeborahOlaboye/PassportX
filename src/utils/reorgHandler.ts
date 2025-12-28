// Blockchain reorganization (reorg) handling logic
import {
  ReorgEvent,
  ChainhookEvent
} from '../types/chainhook';

/**
 * Reorg State
 * Tracks state changes during reorganizations
 */
export interface ReorgState {
  reorgHeight: number;
  commonAncestorHeight: number;
  affectedTransactions: Set<string>;
  removedBlocks: Set<string>;
  addedBlocks: Set<string>;
  timestamp: number;
}

/**
 * Reorg Handler
 * Manages blockchain reorganization scenarios
 */
export class ReorgHandler {
  private reorgHistory: ReorgState[] = [];
  private maxReorgDepth: number = 100;
  private affectedDataCallbacks: ((txHashes: string[]) => Promise<void>)[] = [];

  constructor(maxReorgDepth: number = 100) {
    this.maxReorgDepth = maxReorgDepth;
  }

  /**
   * Handle a reorganization event
   */
  async handleReorg(event: ReorgEvent): Promise<ReorgState> {
    const state: ReorgState = {
      reorgHeight: event.blockHeight,
      commonAncestorHeight: event.commonAncestorHeight,
      affectedTransactions: new Set(event.affectedTransactions),
      removedBlocks: new Set(event.removedBlockHashes),
      addedBlocks: new Set(event.addedBlockHashes),
      timestamp: Date.now()
    };

    this.reorgHistory.push(state);

    // Keep only recent history
    if (this.reorgHistory.length > 10) {
      this.reorgHistory.shift();
    }

    // Notify affected data callbacks
    for (const callback of this.affectedDataCallbacks) {
      try {
        await callback(Array.from(state.affectedTransactions));
      } catch (error) {
        console.error('Error in reorg callback:', error);
      }
    }

    return state;
  }

  /**
   * Check if a transaction was affected by reorg
   */
  isTransactionAffected(txHash: string): boolean {
    for (const state of this.reorgHistory) {
      if (state.affectedTransactions.has(txHash)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a block was removed due to reorg
   */
  isBlockRemoved(blockHash: string): boolean {
    for (const state of this.reorgHistory) {
      if (state.removedBlocks.has(blockHash)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the current reorg depth
   */
  getCurrentReorgDepth(): number {
    if (this.reorgHistory.length === 0) {
      return 0;
    }
    const latestReorg = this.reorgHistory[this.reorgHistory.length - 1];
    return latestReorg.reorgHeight - latestReorg.commonAncestorHeight;
  }

  /**
   * Check if reorg is within acceptable depth
   */
  isReorgWithinDepth(maxDepth: number = this.maxReorgDepth): boolean {
    return this.getCurrentReorgDepth() <= maxDepth;
  }

  /**
   * Register callback for affected transactions
   */
  onAffectedTransactions(callback: (txHashes: string[]) => Promise<void>): void {
    this.affectedDataCallbacks.push(callback);
  }

  /**
   * Get affected transactions since a specific height
   */
  getAffectedTransactionsSince(blockHeight: number): string[] {
    const affected = new Set<string>();

    for (const state of this.reorgHistory) {
      if (state.reorgHeight >= blockHeight) {
        for (const tx of state.affectedTransactions) {
          affected.add(tx);
        }
      }
    }

    return Array.from(affected);
  }

  /**
   * Reset reorg history
   */
  reset(): void {
    this.reorgHistory = [];
  }

  /**
   * Get reorg history
   */
  getHistory(): ReorgState[] {
    return [...this.reorgHistory];
  }

  /**
   * Recover state after reorg
   * Lists blocks and transactions that need to be reprocessed
   */
  getRecoveryActions(): {
    reprocessBlocks: string[];
    reprocessTransactions: string[];
    verifyDataIntegrity: boolean;
  } {
    const reprocessBlocks = new Set<string>();
    const reprocessTransactions = new Set<string>();

    for (const state of this.reorgHistory) {
      for (const block of state.removedBlocks) {
        reprocessBlocks.add(block);
      }
      for (const tx of state.affectedTransactions) {
        reprocessTransactions.add(tx);
      }
    }

    return {
      reprocessBlocks: Array.from(reprocessBlocks),
      reprocessTransactions: Array.from(reprocessTransactions),
      verifyDataIntegrity: reprocessBlocks.size > 0 || reprocessTransactions.size > 0
    };
  }

  /**
   * Check if events occurred before a reorg
   */
  eventsOccurredBeforeReorg(events: ChainhookEvent[]): boolean {
    if (this.reorgHistory.length === 0) {
      return true;
    }

    const earliestReorg = this.reorgHistory[0];

    return events.every(event => {
      if ('txHash' in event) {
        const txHash = (event as any).txHash;
        return !this.isTransactionAffected(txHash);
      }
      return event.blockHeight < earliestReorg.reorgHeight;
    });
  }
}

/**
 * Reorg-aware event processor
 * Ensures events are not processed if they're in a reorg
 */
export class ReorgAwareEventProcessor {
  constructor(private reorgHandler: ReorgHandler) {}

  /**
   * Process event safely considering reorg state
   */
  async processEvent(
    event: ChainhookEvent,
    processor: (event: ChainhookEvent) => Promise<void>
  ): Promise<{ processed: boolean; reason?: string }> {
    if ('txHash' in event && this.reorgHandler.isTransactionAffected((event as any).txHash)) {
      return {
        processed: false,
        reason: 'Transaction affected by reorganization'
      };
    }

    if (this.reorgHandler.isBlockRemoved(event.blockHash)) {
      return {
        processed: false,
        reason: 'Block removed due to reorganization'
      };
    }

    try {
      await processor(event);
      return { processed: true };
    } catch (error) {
      return {
        processed: false,
        reason: (error as Error).message
      };
    }
  }

  /**
   * Process events in reorg-safe manner
   */
  async processEvents(
    events: ChainhookEvent[],
    processor: (event: ChainhookEvent) => Promise<void>
  ): Promise<Map<string, { processed: boolean; reason?: string }>> {
    const results = new Map<string, { processed: boolean; reason?: string }>();

    for (const event of events) {
      const eventId = event.txHash || event.blockHash;
      const result = await this.processEvent(event, processor);
      results.set(eventId, result);
    }

    return results;
  }
}
