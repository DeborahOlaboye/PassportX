import { BadgeMetadataUpdateEvent } from '../chainhook/types/handlers';
import BadgeMetadataCacheInvalidator from './badgeMetadataCacheInvalidator';
import BadgeUIRefreshService from './badgeUIRefreshService';
import BadgeMetadataChangeDetector from '../chainhook/utils/badgeMetadataChangeDetector';

export interface MetadataUpdateResult {
  success: boolean;
  badgeId: string;
  invalidated: boolean;
  uiNotified: boolean;
  changeCount: number;
  timestamp: number;
  error?: string;
}

export class BadgeMetadataUpdateService {
  private cacheInvalidator: BadgeMetadataCacheInvalidator;
  private uiRefreshService: BadgeUIRefreshService;
  private changeDetector: BadgeMetadataChangeDetector;
  private logger: any;
  private processedCount = 0;
  private errorCount = 0;

  constructor(
    cacheInvalidator: BadgeMetadataCacheInvalidator,
    uiRefreshService: BadgeUIRefreshService,
    logger?: any
  ) {
    this.cacheInvalidator = cacheInvalidator;
    this.uiRefreshService = uiRefreshService;
    this.changeDetector = new BadgeMetadataChangeDetector(logger);
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[MetadataUpdateService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[MetadataUpdateService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[MetadataUpdateService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[MetadataUpdateService] ${msg}`, ...args)
    };
  }

  async processMetadataUpdate(event: BadgeMetadataUpdateEvent): Promise<MetadataUpdateResult> {
    const startTime = Date.now();

    try {
      if (!event.badgeId || !event.transactionHash) {
        throw new Error('Invalid metadata update event: missing required fields');
      }

      this.logger.info(`Processing metadata update for badge: ${event.badgeId}`, {
        blockHeight: event.blockHeight,
        transactionHash: event.transactionHash
      });

      const changeResult = this.changeDetector.detectChanges(event);
      const impactLevel = this.changeDetector.getImpactLevel(changeResult);

      this.logger.debug(`Detected ${changeResult.changeCount} changes with impact level: ${impactLevel}`);

      let invalidated = false;
      let uiNotified = false;

      if (this.changeDetector.shouldInvalidateCache(changeResult)) {
        await this.cacheInvalidator.invalidateBadgeCache({
          badgeId: event.badgeId,
          changedFields: changeResult.changedFields,
          timestamp: event.timestamp || Date.now(),
          transactionHash: event.transactionHash,
          blockHeight: event.blockHeight || 0
        });
        invalidated = true;
      }

      if (this.changeDetector.shouldRefreshUI(changeResult)) {
        await this.uiRefreshService.notifyBadgeMetadataUpdate(
          event.badgeId,
          changeResult.changedFields,
          {
            transactionHash: event.transactionHash,
            blockHeight: event.blockHeight
          }
        );
        uiNotified = true;
      }

      this.processedCount++;

      const result: MetadataUpdateResult = {
        success: true,
        badgeId: event.badgeId,
        invalidated,
        uiNotified,
        changeCount: changeResult.changeCount,
        timestamp: Date.now()
      };

      this.logger.info(`Metadata update processed successfully`, {
        badgeId: event.badgeId,
        changes: changeResult.changeCount,
        processingTime: Date.now() - startTime
      });

      return result;
    } catch (error) {
      this.errorCount++;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing metadata update: ${errorMessage}`, {
        badgeId: event.badgeId,
        error
      });

      return {
        success: false,
        badgeId: event.badgeId,
        invalidated: false,
        uiNotified: false,
        changeCount: 0,
        timestamp: Date.now(),
        error: errorMessage
      };
    }
  }

  async processBatchMetadataUpdates(events: BadgeMetadataUpdateEvent[]): Promise<MetadataUpdateResult[]> {
    this.logger.info(`Processing batch of ${events.length} metadata updates`);

    const results: MetadataUpdateResult[] = [];

    for (const event of events) {
      const result = await this.processMetadataUpdate(event);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.info(`Batch processing complete: ${successCount}/${events.length} successful`);

    return results;
  }

  getStatistics(): any {
    return {
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      successRate: this.processedCount > 0 
        ? ((this.processedCount - this.errorCount) / this.processedCount * 100).toFixed(2) + '%'
        : '0%',
      cacheInvalidatorMetrics: this.cacheInvalidator.getMetrics(),
      uiRefreshMetrics: this.uiRefreshService.getMetrics()
    };
  }

  resetStatistics(): void {
    this.processedCount = 0;
    this.errorCount = 0;
    this.cacheInvalidator.resetMetrics();
    this.uiRefreshService.resetMetrics();
    this.logger.info('Service statistics reset');
  }

  async flushPendingUpdates(): Promise<void> {
    this.logger.info('Flushing pending metadata updates');
    await this.uiRefreshService.flush();
    this.logger.info('All pending updates flushed');
  }

  destroy(): void {
    this.uiRefreshService.destroy();
    this.cacheInvalidator.destroy();
    this.logger.info('BadgeMetadataUpdateService destroyed');
  }
}

export default BadgeMetadataUpdateService;
