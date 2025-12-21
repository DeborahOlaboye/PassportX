import { EventEmitter } from 'events';

export interface UIRefreshEvent {
  badgeId: string;
  refreshType: 'metadata' | 'display' | 'cache' | 'full';
  changedFields: string[];
  timestamp: number;
  transactionHash: string;
  blockHeight: number;
}

export interface RefreshMetrics {
  totalRefreshEvents: number;
  refreshesByType: Map<string, number>;
  refreshesByBadge: Map<string, number>;
  averageRefreshDelay: number;
}

export class BadgeUIRefreshService extends EventEmitter {
  private refreshQueue: UIRefreshEvent[] = [];
  private isProcessingQueue = false;
  private metrics: RefreshMetrics = {
    totalRefreshEvents: 0,
    refreshesByType: new Map(),
    refreshesByBadge: new Map(),
    averageRefreshDelay: 0
  };
  private refreshTimings: number[] = [];
  private readonly MAX_TIMING_SAMPLES = 1000;
  private readonly QUEUE_PROCESSING_INTERVAL = 100;
  private processingInterval: NodeJS.Timeout | null = null;
  private logger: any;

  constructor(logger?: any) {
    super();
    this.logger = logger || this.getDefaultLogger();
    this.startQueueProcessing();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[UIRefreshService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[UIRefreshService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[UIRefreshService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[UIRefreshService] ${msg}`, ...args)
    };
  }

  async notifyBadgeMetadataUpdate(badgeId: string, changedFields: string[], meta: any): Promise<void> {
    const event: UIRefreshEvent = {
      badgeId,
      refreshType: 'metadata',
      changedFields,
      timestamp: Date.now(),
      transactionHash: meta.transactionHash || '',
      blockHeight: meta.blockHeight || 0
    };

    await this.queueRefresh(event);
  }

  async notifyBadgeDisplayUpdate(badgeId: string, meta: any): Promise<void> {
    const event: UIRefreshEvent = {
      badgeId,
      refreshType: 'display',
      changedFields: ['display'],
      timestamp: Date.now(),
      transactionHash: meta.transactionHash || '',
      blockHeight: meta.blockHeight || 0
    };

    await this.queueRefresh(event);
  }

  async notifyFullBadgeRefresh(badgeId: string, changedFields: string[], meta: any): Promise<void> {
    const event: UIRefreshEvent = {
      badgeId,
      refreshType: 'full',
      changedFields,
      timestamp: Date.now(),
      transactionHash: meta.transactionHash || '',
      blockHeight: meta.blockHeight || 0
    };

    await this.queueRefresh(event);
  }

  private async queueRefresh(event: UIRefreshEvent): Promise<void> {
    this.refreshQueue.push(event);
    this.logger.debug(`Queued UI refresh for badge: ${event.badgeId} (type: ${event.refreshType})`);
  }

  private startQueueProcessing(): void {
    this.processingInterval = setInterval(() => {
      if (!this.isProcessingQueue && this.refreshQueue.length > 0) {
        this.processRefreshQueue();
      }
    }, this.QUEUE_PROCESSING_INTERVAL);
  }

  private async processRefreshQueue(): Promise<void> {
    if (this.isProcessingQueue || this.refreshQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.refreshQueue.length > 0) {
        const event = this.refreshQueue.shift();
        if (event) {
          await this.processRefreshEvent(event);
        }
      }
    } catch (error) {
      this.logger.error('Error processing refresh queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async processRefreshEvent(event: UIRefreshEvent): Promise<void> {
    const startTime = performance.now();

    try {
      this.metrics.totalRefreshEvents++;

      const typeCount = (this.metrics.refreshesByType.get(event.refreshType) || 0) + 1;
      this.metrics.refreshesByType.set(event.refreshType, typeCount);

      const badgeCount = (this.metrics.refreshesByBadge.get(event.badgeId) || 0) + 1;
      this.metrics.refreshesByBadge.set(event.badgeId, badgeCount);

      this.logger.debug(`Processing UI refresh for badge: ${event.badgeId}`, {
        type: event.refreshType,
        fields: event.changedFields
      });

      this.emit('refresh', event);

      this.emit(`refresh:${event.refreshType}`, event);
      this.emit(`refresh:badge:${event.badgeId}`, event);

      const duration = performance.now() - startTime;
      this.recordRefreshTiming(duration);
    } catch (error) {
      this.logger.error(`Error processing refresh event for badge ${event.badgeId}:`, error);
    }
  }

  private recordRefreshTiming(time: number): void {
    this.refreshTimings.push(time);

    if (this.refreshTimings.length > this.MAX_TIMING_SAMPLES) {
      this.refreshTimings = this.refreshTimings.slice(-this.MAX_TIMING_SAMPLES);
    }

    if (this.refreshTimings.length > 0) {
      const sum = this.refreshTimings.reduce((a, b) => a + b, 0);
      this.metrics.averageRefreshDelay = sum / this.refreshTimings.length;
    }
  }

  getMetrics(): any {
    return {
      totalRefreshEvents: this.metrics.totalRefreshEvents,
      averageRefreshDelay: parseFloat(this.metrics.averageRefreshDelay.toFixed(4)),
      queueSize: this.refreshQueue.length,
      refreshesByType: Object.fromEntries(this.metrics.refreshesByType),
      topRefreshedBadges: Array.from(this.metrics.refreshesByBadge.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([badgeId, count]) => ({ badgeId, count }))
    };
  }

  async flush(): Promise<void> {
    while (this.refreshQueue.length > 0) {
      await this.processRefreshQueue();
    }

    this.logger.info('UI refresh queue flushed');
  }

  resetMetrics(): void {
    this.metrics = {
      totalRefreshEvents: 0,
      refreshesByType: new Map(),
      refreshesByBadge: new Map(),
      averageRefreshDelay: 0
    };
    this.refreshTimings = [];
    this.logger.info('UI refresh metrics reset');
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.logger.info('UI refresh service stopped');
  }

  destroy(): void {
    this.stop();
    this.refreshQueue = [];
    this.removeAllListeners();
    this.logger.info('BadgeUIRefreshService destroyed');
  }
}

export default BadgeUIRefreshService;
