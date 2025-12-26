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
  async handleReorgEvent(chainhookEvent: any): Promise<ReorgEvent | null> {
    try {
      // Check if this is a reorg event
      if (!this.isReorgEvent(chainhookEvent)) {
        return null;
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

      return reorgEvent;

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

    // Get instances of reorg-aware services
    const reorgDatabase = new (require('./ReorgAwareDatabase').default)(
      ReorgHandlerService.getInstance(this.logger),
      this.logger
    );
    const reorgCache = new (require('./ReorgAwareCache').default)(
      ReorgHandlerService.getInstance(this.logger),
      this.logger
    );

    // Rollback database state
    await reorgDatabase.handleReorg(reorgEvent);

    // Rollback cache state
    await reorgCache.handleReorg(reorgEvent);

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

    // In a real implementation, you would need to fetch the canonical
    // chain events from Chainhook or a reliable source and re-process them
    // For now, we'll emit an event to trigger re-processing of canonical events

    // Get the ChainhookEventProcessor to reprocess events
    const eventProcessor = require('./chainhookEventProcessor').default ?
      new (require('./chainhookEventProcessor').default)(this.logger) :
      null;

    if (eventProcessor) {
      // Trigger reprocessing of canonical events
      // This is a simplified implementation - in production, you'd fetch
      // the actual canonical events from the blockchain or Chainhook
      this.logger.info('Triggering reprocessing of canonical events via ChainhookEventProcessor');
    } else {
      this.logger.warn('ChainhookEventProcessor not available for reprocessing canonical events');
    }
  }

  /**
   * Update UI state after reorg
   */
  private async updateUIState(reorgEvent: ReorgEvent): Promise<void> {
    this.logger.info('Updating UI state after reorg');

    // Get the ReorgStateManager instance
    const reorgStateManager = require('../../src/services/ReorgStateManager').default ?
      require('../../src/services/ReorgStateManager').default.getInstance(this.logger) :
      null;

    if (reorgStateManager) {
      // Notify the UI state manager of the reorg
      await reorgStateManager.handleReorgEvent(reorgEvent);
      this.logger.info('UI state updated via ReorgStateManager');
    } else {
      this.logger.warn('ReorgStateManager not available for UI state updates');
    }

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



  private async rollbackWebhookState(reorgEvent: ReorgEvent): Promise<void> {
    // Handle webhook deliveries that might need to be reversed
    // This would involve checking if any webhooks were sent for the rolled-back transactions
    // and potentially sending correction webhooks or marking them as invalid

    const webhookService = require('./WebhookService').default ?
      require('./WebhookService').default.getInstance(this.logger) :
      null;

    if (webhookService) {
      // Mark webhooks for affected transactions as potentially invalid
      for (const txHash of reorgEvent.affectedTransactions) {
        await webhookService.markWebhookInvalid(txHash, 'reorg');
      }
      this.logger.debug('Webhook state rolled back for affected transactions');
    } else {
      this.logger.warn('WebhookService not available for webhook state rollback');
    }
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
    // This would integrate with your WebSocket service
    const websocketService = require('./WebhookService').default ?
      require('./WebhookService').default.getInstance(this.logger) :
      null;

    if (websocketService) {
      // Emit reorg event to all connected clients
      await websocketService.broadcastReorgEvent(reorgEvent);
      this.logger.debug('Reorg event broadcasted via WebSocket');
    } else {
      this.logger.warn('WebhookService not available for broadcasting reorg events');
    }
  }

  private async invalidateAffectedCaches(reorgEvent: ReorgEvent): Promise<void> {
    // Invalidate caches for affected data
    const reorgCache = new (require('./ReorgAwareCache').default)(
      ReorgHandlerService.getInstance(this.logger),
      this.logger
    );

    // Rollback cache to canonical state (already done in rollbackToCanonicalChain)
    // But we can also invalidate specific keys if needed
    this.logger.debug('Cache invalidation handled via ReorgAwareCache.handleReorg');
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