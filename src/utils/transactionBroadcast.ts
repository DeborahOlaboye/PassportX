import { SignedTransaction } from '@/types/transaction-signing';

export class TransactionBroadcaster {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  static async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Simulate broadcasting delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock successful broadcast - in real implementation, this would send to blockchain
        const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`;

        console.log(`Transaction broadcasted successfully on attempt ${attempt}:`, mockHash);
        return mockHash;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Broadcast attempt ${attempt} failed:`, error);

        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }

    throw new Error(`Failed to broadcast transaction after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  static async broadcastBatch(transactions: SignedTransaction[]): Promise<string[]> {
    const results = await Promise.allSettled(
      transactions.map(tx => this.broadcastTransaction(tx))
    );

    const hashes: string[] = [];
    const errors: Error[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        hashes.push(result.value);
      } else {
        errors.push(result.reason);
        console.error(`Batch transaction ${index} failed:`, result.reason);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Batch broadcast failed: ${errors.length} transactions failed`);
    }

    return hashes;
  }

  static async getBroadcastStatus(hash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    // Mock status check - in real implementation, this would query blockchain
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate random status for demo
    const statuses: Array<'pending' | 'confirmed' | 'failed'> = ['pending', 'confirmed', 'failed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  static async waitForConfirmation(hash: string, confirmations: number = 1): Promise<void> {
    let currentConfirmations = 0;

    while (currentConfirmations < confirmations) {
      const status = await this.getBroadcastStatus(hash);

      if (status === 'confirmed') {
        currentConfirmations++;
      } else if (status === 'failed') {
        throw new Error(`Transaction ${hash} failed`);
      }

      if (currentConfirmations < confirmations) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
  }
}

export class TransactionQueue {
  private queue: SignedTransaction[] = [];
  private isProcessing = false;

  async addToQueue(transaction: SignedTransaction): Promise<void> {
    this.queue.push(transaction);
    this.processQueue();
  }

  async addBatchToQueue(transactions: SignedTransaction[]): Promise<void> {
    this.queue.push(...transactions);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const transaction = this.queue.shift()!;
        await TransactionBroadcaster.broadcastTransaction(transaction);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
  }
}