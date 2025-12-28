import { ChainhookEventRouter } from './chainhookEventRouter';
import { CacheInvalidationMapper } from './cacheInvalidationMapper';
import { EventDrivenCacheInvalidator } from './eventDrivenCacheInvalidator';
import { CachePerformanceMonitor } from './cachePerformanceMonitor';
import { ChainhookEventPayload } from '../chainhook/types/handlers';

export interface CacheInvalidationIntegrationConfig {
  enablePerformanceMonitoring: boolean;
  enableDetailedLogging: boolean;
  batchSize: number;
  batchTimeout: number;
}

export class CacheInvalidationIntegration {
  private eventRouter: ChainhookEventRouter;
  private invalidationMapper: CacheInvalidationMapper;
  private invalidator: EventDrivenCacheInvalidator;
  private performanceMonitor: CachePerformanceMonitor | null = null;

  private config: CacheInvalidationIntegrationConfig;
  private logger: any;
  private isInitialized = false;

  constructor(
    eventRouter: ChainhookEventRouter,
    invalidationMapper: CacheInvalidationMapper,
    invalidator: EventDrivenCacheInvalidator,
    performanceMonitor?: CachePerformanceMonitor,
    config: Partial<CacheInvalidationIntegrationConfig> = {},
    logger?: any
  ) {
    this.eventRouter = eventRouter;
    this.invalidationMapper = invalidationMapper;
    this.invalidator = invalidator;
    this.performanceMonitor = performanceMonitor || null;

    this.config = {
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      enableDetailedLogging: config.enableDetailedLogging ?? false,
      batchSize: config.batchSize ?? 10,
      batchTimeout: config.batchTimeout ?? 5000,
      ...config
    };

    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[CacheInvalidationIntegration] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CacheInvalidationIntegration] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CacheInvalidationIntegration] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CacheInvalidationIntegration] ${msg}`, ...args)
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Cache invalidation integration already initialized');
      return;
    }

    try {
      // Create routing rule for cache invalidation events
      const cacheInvalidationRule = this.eventRouter.createRoutingRule(
        'cache-invalidation-events',
        {
          eventType: 'contract_call', // Broad filter to catch all contract calls
        }
      );

      // Add cache invalidation handler
      this.eventRouter.addHandler(
        cacheInvalidationRule.id,
        this.handleCacheInvalidationEvent.bind(this)
      );

      // Create routing rule for specific badge events
      const badgeEventsRule = this.eventRouter.createRoutingRule(
        'badge-cache-events',
        {
          contractAddress: 'badge-contract', // Would be configured with actual contract addresses
        }
      );

      this.eventRouter.addHandler(
        badgeEventsRule.id,
        this.handleBadgeCacheEvent.bind(this)
      );

      // Create routing rule for community events
      const communityEventsRule = this.eventRouter.createRoutingRule(
        'community-cache-events',
        {
          contractAddress: 'community-contract', // Would be configured with actual contract addresses
        }
      );

      this.eventRouter.addHandler(
        communityEventsRule.id,
        this.handleCommunityCacheEvent.bind(this)
      );

      this.isInitialized = true;
      this.logger.info('Cache invalidation integration initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize cache invalidation integration:', error);
      throw error;
    }
  }

  private async handleCacheInvalidationEvent(event: ChainhookEventPayload): Promise<void> {
    const startTime = Date.now();

    try {
      if (this.config.enableDetailedLogging) {
        this.logger.debug('Processing cache invalidation event', {
          blockHeight: event.block_identifier?.index,
          transactionCount: event.transactions?.length
        });
      }

      // Use the mapper to determine if this event requires cache invalidation
      await this.invalidationMapper.mapAndInvalidate(event);

      if (this.config.enablePerformanceMonitoring && this.performanceMonitor) {
        const processingTime = Date.now() - startTime;
        this.logger.debug(`Cache invalidation processing completed in ${processingTime}ms`);
      }

    } catch (error) {
      this.logger.error('Error handling cache invalidation event:', error);

      if (this.performanceMonitor) {
        // Could add error metrics here
      }
    }
  }

  private async handleBadgeCacheEvent(event: ChainhookEventPayload): Promise<void> {
    try {
      // Specific handling for badge-related events
      if (this.isBadgeMintEvent(event)) {
        await this.invalidationMapper.mapAndInvalidate(event);
      } else if (this.isBadgeMetadataEvent(event)) {
        await this.invalidationMapper.mapAndInvalidate(event);
      } else if (this.isBadgeRevocationEvent(event)) {
        await this.invalidationMapper.mapAndInvalidate(event);
      }

    } catch (error) {
      this.logger.error('Error handling badge cache event:', error);
    }
  }

  private async handleCommunityCacheEvent(event: ChainhookEventPayload): Promise<void> {
    try {
      // Specific handling for community-related events
      if (this.isCommunityCreationEvent(event)) {
        await this.invalidationMapper.mapAndInvalidate(event);
      }

    } catch (error) {
      this.logger.error('Error handling community cache event:', error);
    }
  }

  private isBadgeMintEvent(event: ChainhookEventPayload): boolean {
    return event.transactions?.some(tx =>
      tx.operations?.some(op =>
        op.type === 'contract_call' &&
        ['mint', 'mint-badge', 'nft-mint'].includes(op.contract_call?.method || '')
      )
    ) || false;
  }

  private isBadgeMetadataEvent(event: ChainhookEventPayload): boolean {
    return event.transactions?.some(tx =>
      tx.operations?.some(op =>
        op.type === 'contract_call' &&
        ['update-metadata', 'update-badge', 'set-metadata'].includes(op.contract_call?.method || '')
      )
    ) || false;
  }

  private isBadgeRevocationEvent(event: ChainhookEventPayload): boolean {
    return event.transactions?.some(tx =>
      tx.operations?.some(op =>
        op.type === 'contract_call' &&
        ['revoke', 'revoke-badge', 'burn'].includes(op.contract_call?.method || '')
      )
    ) || false;
  }

  private isCommunityCreationEvent(event: ChainhookEventPayload): boolean {
    return event.transactions?.some(tx =>
      tx.operations?.some(op =>
        op.type === 'contract_call' &&
        ['create-community', 'new-community'].includes(op.contract_call?.method || '')
      )
    ) || false;
  }

  async processEvent(event: ChainhookEventPayload): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Cache invalidation integration not initialized');
    }

    // Route the event through the event router, which will trigger our handlers
    await this.eventRouter.routeEvent(event);
  }

  async processBatch(events: ChainhookEventPayload[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Cache invalidation integration not initialized');
    }

    const batches = this.chunkArray(events, this.config.batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(event => this.processEvent(event));

      try {
        await Promise.allSettled(batchPromises);
      } catch (error) {
        this.logger.error('Error processing event batch:', error);
      }

      // Small delay between batches to prevent overwhelming the system
      if (batches.length > 1) {
        await this.delay(100);
      }
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMetrics(): any {
    if (!this.performanceMonitor) {
      return {
        integrationEnabled: this.isInitialized,
        performanceMonitoringEnabled: false
      };
    }

    return {
      integrationEnabled: this.isInitialized,
      performanceMonitoringEnabled: true,
      ...this.performanceMonitor.getPerformanceMetrics()
    };
  }

  getHealthStatus(): any {
    if (!this.performanceMonitor) {
      return {
        status: this.isInitialized ? 'healthy' : 'not_initialized',
        integrationEnabled: this.isInitialized
      };
    }

    return {
      integrationEnabled: this.isInitialized,
      ...this.performanceMonitor.getHealthStatus()
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down cache invalidation integration');

    if (this.performanceMonitor) {
      this.performanceMonitor.destroy();
    }

    this.isInitialized = false;
  }

  // Configuration methods
  updateConfig(newConfig: Partial<CacheInvalidationIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Cache invalidation integration config updated', this.config);
  }

  getConfig(): CacheInvalidationIntegrationConfig {
    return { ...this.config };
  }

  // Manual invalidation methods for testing/admin purposes
  async invalidateCacheForEventType(eventType: string, eventData: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Cache invalidation integration not initialized');
    }

    await this.invalidator.invalidateCacheForEvent(eventType, eventData);
  }

  async invalidateCacheByPattern(pattern: string): Promise<void> {
    // This would require extending the invalidator to support pattern invalidation
    this.logger.warn('Pattern invalidation not yet implemented');
  }
}

export default CacheInvalidationIntegration;
