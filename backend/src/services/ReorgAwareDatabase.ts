import mongoose from 'mongoose'
import ReorgHandlerService, { ReorgEvent, RollbackOperation } from './ReorgHandlerService'

export interface ReorgAwareDocument {
  _id: any;
  blockHeight: number;
  transactionHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReorgAwareDatabase {
  private reorgHandler: ReorgHandlerService;
  private logger: any;
  private rollbackLog: RollbackOperation[] = [];

  constructor(reorgHandler: ReorgHandlerService, logger?: any) {
    this.reorgHandler = reorgHandler;
    this.logger = logger || this.getDefaultLogger();
  }

  /**
   * Save a document with reorg awareness
   */
  async saveWithReorgAwareness(
    model: mongoose.Model<any>,
    document: any,
    blockHeight: number,
    transactionHash?: string
  ): Promise<any> {
    // Add reorg metadata
    document.blockHeight = blockHeight;
    if (transactionHash) {
      document.transactionHash = transactionHash;
    }
    document.createdAt = new Date();
    document.updatedAt = new Date();

    const savedDoc = await model.create(document);

    // Log the operation for potential rollback
    this.logOperation('create', model.modelName, savedDoc._id, blockHeight, transactionHash);

    this.logger.debug(`Saved ${model.modelName} with reorg awareness`, {
      id: savedDoc._id,
      blockHeight,
      transactionHash
    });

    return savedDoc;
  }

  /**
   * Update a document with reorg awareness
   */
  async updateWithReorgAwareness(
    model: mongoose.Model<any>,
    filter: any,
    update: any,
    blockHeight: number,
    transactionHash?: string
  ): Promise<any> {
    // Get the original document for rollback
    const originalDoc = await model.findOne(filter);

    // Add reorg metadata to update
    update.updatedAt = new Date();
    update.blockHeight = blockHeight;
    if (transactionHash) {
      update.transactionHash = transactionHash;
    }

    const updatedDoc = await model.findOneAndUpdate(filter, update, { new: true });

    if (updatedDoc && originalDoc) {
      // Log the operation for potential rollback
      this.logOperation('update', model.modelName, updatedDoc._id, blockHeight, transactionHash, {
        original: originalDoc,
        updated: updatedDoc
      });
    }

    this.logger.debug(`Updated ${model.modelName} with reorg awareness`, {
      filter,
      blockHeight,
      transactionHash
    });

    return updatedDoc;
  }

  /**
   * Delete a document with reorg awareness
   */
  async deleteWithReorgAwareness(
    model: mongoose.Model<any>,
    filter: any,
    blockHeight: number,
    transactionHash?: string
  ): Promise<any> {
    // Get the document before deletion for rollback
    const document = await model.findOne(filter);

    if (!document) {
      return null;
    }

    const deletedDoc = await model.findOneAndDelete(filter);

    // Log the operation for potential rollback
    this.logOperation('delete', model.modelName, document._id, blockHeight, transactionHash, {
      deleted: document
    });

    this.logger.debug(`Deleted ${model.modelName} with reorg awareness`, {
      filter,
      blockHeight,
      transactionHash
    });

    return deletedDoc;
  }

  /**
   * Handle reorg by rolling back affected operations
   */
  async handleReorg(reorgEvent: ReorgEvent): Promise<void> {
    this.logger.warn('Handling reorg in database', {
      rollbackToBlock: reorgEvent.rollbackToBlock,
      affectedTransactions: reorgEvent.affectedTransactions.length
    });

    // Find all operations that need to be rolled back
    const operationsToRollback = this.rollbackLog.filter(op =>
      op.blockHeight > reorgEvent.rollbackToBlock ||
      reorgEvent.affectedTransactions.includes(op.transactionHash!)
    );

    // Sort operations by reverse chronological order for rollback
    operationsToRollback.sort((a, b) => b.blockHeight - a.blockHeight);

    for (const operation of operationsToRollback) {
      await this.rollbackOperation(operation);
    }

    // Clean up the rollback log
    this.cleanupRollbackLog(reorgEvent.rollbackToBlock);

    this.logger.info(`Database reorg handling complete. Rolled back ${operationsToRollback.length} operations`);
  }

  /**
   * Rollback a specific operation
   */
  private async rollbackOperation(operation: RollbackOperation): Promise<void> {
    try {
      const model = this.getModelByName(operation.operation.modelName);

      switch (operation.operation.type) {
        case 'create':
          // Delete the created document
          await model.findByIdAndDelete(operation.operation.documentId);
          this.logger.debug(`Rolled back create operation for ${operation.operation.modelName}`);
          break;

        case 'update':
          // Restore the original document
          if (operation.operation.rollbackData?.original) {
            await model.findByIdAndUpdate(
              operation.operation.documentId,
              operation.operation.rollbackData.original
            );
          }
          this.logger.debug(`Rolled back update operation for ${operation.operation.modelName}`);
          break;

        case 'delete':
          // Restore the deleted document
          if (operation.operation.rollbackData?.deleted) {
            await model.create(operation.operation.rollbackData.deleted);
          }
          this.logger.debug(`Rolled back delete operation for ${operation.operation.modelName}`);
          break;
      }
    } catch (error) {
      this.logger.error('Error rolling back operation', error);
    }
  }

  /**
   * Log an operation for potential rollback
   */
  private logOperation(
    type: 'create' | 'update' | 'delete',
    modelName: string,
    documentId: any,
    blockHeight: number,
    transactionHash?: string,
    rollbackData?: any
  ): void {
    const operation: RollbackOperation = {
      transactionHash: transactionHash || '',
      blockHeight,
      operation: {
        type,
        modelName,
        documentId,
        rollbackData
      },
      reason: 'reorg'
    };

    this.rollbackLog.push(operation);

    // Limit the size of the rollback log
    if (this.rollbackLog.length > 10000) {
      this.rollbackLog = this.rollbackLog.slice(-5000);
    }
  }

  /**
   * Clean up old rollback log entries
   */
  private cleanupRollbackLog(rollbackToBlock: number): void {
    this.rollbackLog = this.rollbackLog.filter(op => op.blockHeight <= rollbackToBlock);
  }

  /**
   * Get mongoose model by name
   */
  private getModelByName(modelName: string): mongoose.Model<any> {
    // This is a simplified implementation. In a real app, you might have
    // a model registry or use mongoose.models
    switch (modelName) {
      case 'Badge':
        return require('../models/Badge').default;
      case 'User':
        return require('../models/User').default;
      case 'Community':
        return require('../models/Community').default;
      // Add other models as needed
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }
  }

  /**
   * Get rollback statistics
   */
  getRollbackStats(): {
    totalOperations: number;
    operationsByBlock: Record<number, number>;
  } {
    const operationsByBlock: Record<number, number> = {};

    for (const op of this.rollbackLog) {
      operationsByBlock[op.blockHeight] = (operationsByBlock[op.blockHeight] || 0) + 1;
    }

    return {
      totalOperations: this.rollbackLog.length,
      operationsByBlock
    };
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[ReorgAwareDatabase] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[ReorgAwareDatabase] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[ReorgAwareDatabase] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ReorgAwareDatabase] ${msg}`, ...args)
    };
  }
}

export default ReorgAwareDatabase;