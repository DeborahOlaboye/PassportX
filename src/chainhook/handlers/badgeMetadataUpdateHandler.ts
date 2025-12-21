import {
  ChainhookEventPayload,
  ChainhookEventHandler,
  NotificationPayload,
  BadgeMetadataUpdateEvent
} from '../types/handlers';
import { EventMapper } from '../utils/eventMapper';

export class BadgeMetadataUpdateHandler implements ChainhookEventHandler {
  private logger: any;
  private readonly SUPPORTED_METHODS = ['update-metadata', 'set-metadata', 'metadata-update'];
  private readonly SUPPORTED_TOPICS = ['metadata-updated', 'badge-metadata-updated'];
  private compiledMethodFilter: Set<string>;
  private compiledTopicFilter: Set<string>;
  private lastHitTime = 0;
  private hitCache: Map<string, boolean> = new Map();
  private readonly CACHE_TTL_MS = 5000;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
    this.compiledMethodFilter = new Set(this.SUPPORTED_METHODS);
    this.compiledTopicFilter = new Set(this.SUPPORTED_TOPICS);
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[BadgeMetadataUpdateHandler] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[BadgeMetadataUpdateHandler] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[BadgeMetadataUpdateHandler] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[BadgeMetadataUpdateHandler] ${msg}`, ...args)
    };
  }

  private getCacheKey(event: ChainhookEventPayload): string {
    return `${event.block_identifier?.index}:${event.transactions?.[0]?.transaction_hash || ''}`;
  }

  private isCacheValid(cachedTime: number): boolean {
    return Date.now() - cachedTime < this.CACHE_TTL_MS;
  }

  canHandle(event: ChainhookEventPayload): boolean {
    try {
      if (!event || !event.transactions || event.transactions.length === 0) {
        return false;
      }

      const cacheKey = this.getCacheKey(event);
      const cachedResult = this.hitCache.get(cacheKey);

      if (cachedResult !== undefined && this.isCacheValid(this.lastHitTime)) {
        this.logger.debug('Cache hit for metadata update event');
        return cachedResult;
      }

      let result = false;

      for (const tx of event.transactions) {
        if (!tx || !tx.operations) continue;

        for (const op of tx.operations) {
          if (!op) continue;

          if (op.type === 'contract_call' && op.contract_call) {
            const method = op.contract_call.method;
            if (this.compiledMethodFilter.has(method)) {
              this.logger.debug('Detected metadata update contract call');
              result = true;
              break;
            }
          }

          if (!result && op.events && Array.isArray(op.events)) {
            for (const evt of op.events) {
              if (evt && evt.topic) {
                for (const topic of this.compiledTopicFilter) {
                  if (evt.topic.includes(topic)) {
                    this.logger.debug('Detected metadata update event');
                    result = true;
                    break;
                  }
                }
              }
              if (result) break;
            }
          }

          if (result) break;
        }

        if (result) break;
      }

      this.lastHitTime = Date.now();
      this.hitCache.set(cacheKey, result);

      if (this.hitCache.size > 1000) {
        const oldestKey = this.hitCache.keys().next().value;
        this.hitCache.delete(oldestKey);
      }

      return result;
    } catch (error) {
      this.logger.error('Error in canHandle method:', error);
      return false;
    }
  }

  async handle(event: ChainhookEventPayload): Promise<NotificationPayload[]> {
    try {
      if (!event) {
        this.logger.warn('Received null or undefined event');
        return [];
      }

      const notifications: NotificationPayload[] = [];

      if (!event.transactions || event.transactions.length === 0) {
        this.logger.debug('No transactions in event');
        return notifications;
      }

      for (const tx of event.transactions) {
        if (!tx || !tx.operations) continue;

        for (const op of tx.operations) {
          if (!op) continue;

          try {
            if (op.type === 'contract_call' && op.contract_call) {
              const method = op.contract_call.method;

              if (this.compiledMethodFilter.has(method)) {
                const args = op.contract_call.args || [];
                const badgeId = this.extractBadgeId(args);

                if (!badgeId) {
                  this.logger.warn('Failed to extract badge ID from metadata update');
                  continue;
                }

                const metadataEvent: BadgeMetadataUpdateEvent = {
                  badgeId,
                  badgeName: this.extractBadgeName(args),
                  level: this.extractLevel(args),
                  category: this.extractCategory(args),
                  description: this.extractDescription(args),
                  previousLevel: this.extractPreviousLevel(args),
                  previousCategory: this.extractPreviousCategory(args),
                  previousDescription: this.extractPreviousDescription(args),
                  contractAddress: op.contract_call.contract,
                  transactionHash: tx.transaction_hash,
                  blockHeight: event.block_identifier?.index || 0,
                  timestamp: event.metadata?.pox_cycle_position || Date.now()
                };

                this.logger.debug('Extracted badge metadata update event', {
                  badgeId: metadataEvent.badgeId,
                  level: metadataEvent.level,
                  category: metadataEvent.category
                });

                const notification = this.createNotification(metadataEvent);
                notifications.push(notification);
              }
            }

            if (op.events && Array.isArray(op.events)) {
              for (const evt of op.events) {
                if (!evt) continue;

                for (const topic of this.compiledTopicFilter) {
                  if (evt.topic && evt.topic.includes(topic)) {
                    try {
                      const metadataEvent = EventMapper.mapBadgeMetadataUpdateEvent({
                        ...evt.value,
                        contractAddress: evt.contract_address,
                        transactionHash: tx.transaction_hash,
                        blockHeight: event.block_identifier?.index || 0,
                        timestamp: event.metadata?.pox_cycle_position || Date.now()
                      });

                      if (metadataEvent && metadataEvent.badgeId) {
                        this.logger.debug('Mapped badge metadata update event from contract event', {
                          badgeId: metadataEvent.badgeId
                        });

                        const notification = this.createNotification(metadataEvent);
                        notifications.push(notification);
                      }
                    } catch (eventMapError) {
                      this.logger.warn('Failed to map badge metadata update event:', eventMapError);
                    }
                  }
                }
              }
            }
          } catch (opError) {
            this.logger.warn('Error processing operation:', opError);
            continue;
          }
        }
      }

      this.logger.info(`Processed badge metadata update event with ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      this.logger.error('Error in BadgeMetadataUpdateHandler.handle:', error);
      return [];
    }
  }

  getEventType(): string {
    return 'badge-metadata-update';
  }

  private extractBadgeId(args: any[]): string {
    if (!args || args.length === 0) return '';
    const badgeId = args[0]?.value || args[0];
    return badgeId ? String(badgeId) : '';
  }

  private extractBadgeName(args: any[]): string {
    if (!args || args.length < 2) return '';
    const badgeName = args[1]?.value || args[1];
    return badgeName ? String(badgeName) : '';
  }

  private extractLevel(args: any[]): number | undefined {
    if (!args || args.length < 3) return undefined;
    const level = args[2]?.value || args[2];
    return level !== undefined ? Number(level) : undefined;
  }

  private extractCategory(args: any[]): string | undefined {
    if (!args || args.length < 4) return undefined;
    const category = args[3]?.value || args[3];
    return category ? String(category) : undefined;
  }

  private extractDescription(args: any[]): string | undefined {
    if (!args || args.length < 5) return undefined;
    const description = args[4]?.value || args[4];
    return description ? String(description) : undefined;
  }

  private extractPreviousLevel(args: any[]): number | undefined {
    if (!args || args.length < 6) return undefined;
    const prevLevel = args[5]?.value || args[5];
    return prevLevel !== undefined ? Number(prevLevel) : undefined;
  }

  private extractPreviousCategory(args: any[]): string | undefined {
    if (!args || args.length < 7) return undefined;
    const prevCategory = args[6]?.value || args[6];
    return prevCategory ? String(prevCategory) : undefined;
  }

  private extractPreviousDescription(args: any[]): string | undefined {
    if (!args || args.length < 8) return undefined;
    const prevDescription = args[7]?.value || args[7];
    return prevDescription ? String(prevDescription) : undefined;
  }

  private createNotification(metadataEvent: BadgeMetadataUpdateEvent): NotificationPayload {
    const changedFields = this.getChangedFields(metadataEvent);
    const changesSummary = changedFields.join(', ');

    return {
      userId: '',
      type: 'badge_metadata_updated',
      title: `Badge Updated: ${metadataEvent.badgeName}`,
      message: `The badge metadata has been updated. Changed fields: ${changesSummary}`,
      data: {
        eventType: 'badge-metadata-update',
        badgeId: metadataEvent.badgeId,
        badgeName: metadataEvent.badgeName,
        level: metadataEvent.level,
        category: metadataEvent.category,
        description: metadataEvent.description,
        previousLevel: metadataEvent.previousLevel,
        previousCategory: metadataEvent.previousCategory,
        previousDescription: metadataEvent.previousDescription,
        contractAddress: metadataEvent.contractAddress,
        transactionHash: metadataEvent.transactionHash,
        blockHeight: metadataEvent.blockHeight,
        timestamp: metadataEvent.timestamp,
        changedFields
      }
    };
  }

  private getChangedFields(event: BadgeMetadataUpdateEvent): string[] {
    const changes: string[] = [];

    if (event.level !== event.previousLevel) {
      changes.push(`Level: ${event.previousLevel} → ${event.level}`);
    }

    if (event.category !== event.previousCategory) {
      changes.push(`Category: ${event.previousCategory} → ${event.category}`);
    }

    if (event.description !== event.previousDescription) {
      changes.push(`Description`);
    }

    return changes;
  }
}
