export interface ReorgEvent {
  type: 'chain_reorg';
  rollbackToBlock: number;
  rollbackToHash: string;
  newCanonicalBlock: number;
  newCanonicalHash: string;
  affectedTransactions: string[];
  timestamp: number;
}

export interface RollbackOperation {
  transactionHash: string;
  blockHeight: number;
  operation: any;
  reason: 'reorg';
}

export class ReorgHandlerService {
  private static instance: ReorgHandlerService;
  private logger: any;
  private rollbackOperations: Map<string, RollbackOperation[]> = new Map();

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  static getInstance(logger?: any): ReorgHandlerService {
    if (!ReorgHandlerService.instance) {
      ReorgHandlerService.instance = new ReorgHandlerService(logger);
    }
    return ReorgHandlerService.instance;
  }

  /**
   * Detect and handle reorg events from Chainhook
   */
  async handleReorgEvent(chainhookEvent: any): Promise<void> {
    try {
      // Check if this is a reorg event
      if (!this.isReorgEvent(chainhookEvent)) {
        return;
      }

      this.logger.warn('Reorg detected', {
        currentBlock: chainhookEvent.block_identifier.index,
        rollbackTo: chainhookEvent.rollback_to?.block_identifier.index,
        timestamp: new Date().toISOString()
      });

      const reorgEvent = this.parseReorgEvent(chainhookEvent);

      // Step 1: Rollback affected state
      await this.rollbackToCanonicalChain(reorgEvent);

      // Step 2: Re-apply canonical chain events
      await this.reapplyCanonicalEvents(reorgEvent);

      // Step 3: Update UI state
      await this.updateUIState(reorgEvent);

      // Step 4: Log reorg for monitoring
      await this.logReorgEvent(reorgEvent);

    } catch (error) {
      this.logger.error('Error handling reorg event', error);
      throw error;
    }
  }

  /**
   * Check if the event is a reorg event
   */
  private isReorgEvent(chainhookEvent: any): boolean {
    return chainhookEvent.type === 'chain_reorg' ||
           (chainhookEvent.rollback_to && chainhookEvent.rollback_to.block_identifier);
  }

  /**
   * Parse reorg event from Chainhook payload
   */
  private parseReorgEvent(chainhookEvent: any): ReorgEvent {
    const rollbackTo = chainhookEvent.rollback_to?.block_identifier;
    const currentBlock = chainhookEvent.block_identifier;

    // Extract affected transactions from the event
    const affectedTransactions = this.extractAffectedTransactions(chainhookEvent);

    return {
      type: 'chain_reorg',
      rollbackToBlock: rollbackTo?.index || 0,
      rollbackToHash: rollbackTo?.hash || '',
      newCanonicalBlock: currentBlock.index,
      newCanonicalHash: currentBlock.hash,
      affectedTransactions,
      timestamp: Date.now()
    };
  }

  /**
   * Rollback state to the canonical chain
   */
  private async rollbackToCanonicalChain(reorgEvent: ReorgEvent): Promise<void> {
    this.logger.info('Rolling back to canonical chain', {
      rollbackToBlock: reorgEvent.rollbackToBlock,
      affectedTransactions: reorgEvent.affectedTransactions.length
    });

    // Rollback database state
    await this.rollbackDatabaseState(reorgEvent);

    // Rollback cache state
    await this.rollbackCacheState(reorgEvent);

    // Rollback webhook state
    await this.rollbackWebhookState(reorgEvent);

    // Store rollback operations for potential recovery
    this.storeRollbackOperations(reorgEvent);
  }

  /**
   * Re-apply events from the canonical chain
   */
  private async reapplyCanonicalEvents(reorgEvent: ReorgEvent): Promise<void> {
    this.logger.info('Re-applying canonical chain events', {
      fromBlock: reorgEvent.rollbackToBlock + 1,
      toBlock: reorgEvent.newCanonicalBlock
    });

    // Note: In a real implementation, you would need to fetch the canonical
    // chain events from Chainhook or a reliable source and re-process them
    // For now, we'll log the intent
    this.logger.info('Canonical events re-application would happen here');
  }

  /**
   * Update UI state after reorg
   */
  private async updateUIState(reorgEvent: ReorgEvent): Promise<void> {
    this.logger.info('Updating UI state after reorg');

    // Emit WebSocket events to update connected clients
    await this.emitUIUpdateEvents(reorgEvent);

    // Invalidate affected caches
    await this.invalidateAffectedCaches(reorgEvent);
  }

  /**
   * Log reorg event for monitoring
   */
  private async logReorgEvent(reorgEvent: ReorgEvent): Promise<void> {
    this.logger.warn('Reorg event logged', {
      reorgEvent,
      timestamp: new Date(reorgEvent.timestamp).toISOString()
    });

    // In a production system, you might want to:
    // - Store reorg events in a database
    // - Send alerts to monitoring systems
    // - Update metrics
  }

  private extractAffectedTransactions(chainhookEvent: any): string[] {
    const transactions: string[] = [];

    if (chainhookEvent.transactions && Array.isArray(chainhookEvent.transactions)) {
      for (const tx of chainhookEvent.transactions) {
        if (tx.transaction_hash) {
          transactions.push(tx.transaction_hash);
        }
      }
    }

    return transactions;
  }

  private async rollbackDatabaseState(reorgEvent: ReorgEvent): Promise<void> {
    // Rollback database changes for affected transactions
    // This would involve reversing operations in reverse order
    this.logger.info('Rolling back database state');
  }

  private async rollbackCacheState(reorgEvent: ReorgEvent): Promise<void> {
    // Clear or update cached data for affected blocks/transactions
    this.logger.info('Rolling back cache state');
  }

  private async rollbackWebhookState(reorgEvent: ReorgEvent): Promise<void> {
    // Handle webhook deliveries that might need to be reversed
    this.logger.info('Rolling back webhook state');
  }

  private storeRollbackOperations(reorgEvent: ReorgEvent): void {
    // Store rollback operations for auditing/debugging
    const operations: RollbackOperation[] = reorgEvent.affectedTransactions.map(txHash => ({
      transactionHash: txHash,
      blockHeight: reorgEvent.newCanonicalBlock,
      operation: {}, // Would contain the actual operation data
      reason: 'reorg'
    }));

    this.rollbackOperations.set(reorgEvent.newCanonicalHash, operations);
  }

  private async emitUIUpdateEvents(reorgEvent: ReorgEvent): Promise<void> {
    // Emit events to connected WebSocket clients
    this.logger.info('Emitting UI update events');
  }

  private async invalidateAffectedCaches(reorgEvent: ReorgEvent): Promise<void> {
    // Invalidate caches for affected data
    this.logger.info('Invalidating affected caches');
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[ReorgHandler] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[ReorgHandler] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[ReorgHandler] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ReorgHandler] ${msg}`, ...args)
    };
  }

  /**
   * Get rollback operations for a specific block
   */
  getRollbackOperations(blockHash: string): RollbackOperation[] {
    return this.rollbackOperations.get(blockHash) || [];
  }

  /**
   * Clear old rollback operations (for memory management)
   */
  clearOldRollbackOperations(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - olderThanMs;
    for (const [blockHash, operations] of this.rollbackOperations.entries()) {
      const oldestOp = operations[0];
      if (oldestOp && oldestOp.blockHeight < cutoffTime) {
        this.rollbackOperations.delete(blockHash);
      }
    }
  }
}

export default ReorgHandlerService;