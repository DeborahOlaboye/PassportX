import {
  ChainhookEventPayload,
  ChainhookEventHandler,
  NotificationPayload,
  BadgeMintEvent
} from '../types/handlers';
import { EventMapper } from '../utils/eventMapper';

export class BadgeMintHandler implements ChainhookEventHandler {
  private logger: any;
  private readonly SUPPORTED_METHODS = ['mint', 'mint-badge', 'nft-mint'];
  private readonly SUPPORTED_TOPICS = ['mint', 'nft', 'badge-mint'];
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
      debug: (msg: string, ...args: any[]) => console.debug(`[BadgeMintHandler] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[BadgeMintHandler] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[BadgeMintHandler] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[BadgeMintHandler] ${msg}`, ...args)
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
        this.logger.debug('Cache hit for event canHandle check');
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
              this.logger.debug('Detected badge mint contract call');
              result = true;
              break;
            }
          }

          if (!result && op.events && Array.isArray(op.events)) {
            for (const evt of op.events) {
              if (evt && evt.topic) {
                for (const topic of this.compiledTopicFilter) {
                  if (evt.topic.includes(topic)) {
                    this.logger.debug('Detected badge mint event');
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

              if (this.SUPPORTED_METHODS.includes(method)) {
                const args = op.contract_call.args || [];
                const recipientAddress = this.extractRecipientAddress(args, op.contract_call, tx);

                if (!recipientAddress) {
                  this.logger.warn('Failed to extract recipient address from contract call');
                  continue;
                }

                const badgeEvent: BadgeMintEvent = {
                  userId: recipientAddress,
                  badgeId: this.extractBadgeId(args),
                  badgeName: this.extractBadgeName(args),
                  criteria: this.extractCriteria(args),
                  contractAddress: op.contract_call.contract,
                  transactionHash: tx.transaction_hash,
                  blockHeight: event.block_identifier?.index || 0,
                  timestamp: event.metadata?.pox_cycle_position || Date.now()
                };

                this.logger.debug('Extracted badge mint event', {
                  userId: badgeEvent.userId,
                  badgeId: badgeEvent.badgeId,
                  contractAddress: badgeEvent.contractAddress
                });

                const notification = this.createNotification(badgeEvent);
                notifications.push(notification);
              }
            }

            if (op.events && Array.isArray(op.events)) {
              for (const evt of op.events) {
                if (!evt) continue;

                if (evt.topic && (evt.topic.includes('mint') || evt.topic.includes('nft'))) {
                  try {
                    const badgeEvent = EventMapper.mapBadgeMintEvent({
                      ...evt.value,
                      contractAddress: evt.contract_address,
                      transactionHash: tx.transaction_hash,
                      blockHeight: event.block_identifier?.index || 0,
                      timestamp: event.metadata?.pox_cycle_position || Date.now()
                    });

                    if (badgeEvent && badgeEvent.userId) {
                      this.logger.debug('Mapped badge mint event from contract event', {
                        userId: badgeEvent.userId,
                        badgeId: badgeEvent.badgeId
                      });

                      const notification = this.createNotification(badgeEvent);
                      notifications.push(notification);
                    }
                  } catch (eventMapError) {
                    this.logger.warn('Failed to map badge mint event:', eventMapError);
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

      this.logger.info(`Processed badge mint event with ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      this.logger.error('Error in BadgeMintHandler.handle:', error);
      return [];
    }
  }

  getEventType(): string {
    return 'badge-mint';
  }

  private extractRecipientAddress(args: any[], contractCall: any, tx: any): string {
    if (!args || args.length === 0) {
      this.logger.debug('No args available, checking transaction sender');
      return tx?.sender || '';
    }

    const firstArg = args[0];
    const recipient = firstArg?.value || firstArg;

    if (recipient && typeof recipient === 'string') {
      return recipient;
    }

    this.logger.debug('Could not extract recipient from args, checking transaction sender');
    return tx?.sender || '';
  }

  private extractBadgeId(args: any[]): string {
    if (!args || args.length < 2) return '';
    const badgeId = args[1]?.value || args[1];
    return badgeId ? String(badgeId) : '';
  }

  private extractBadgeName(args: any[]): string {
    if (!args || args.length < 3) return 'Achievement Badge';
    const badgeName = args[2]?.value || args[2];
    return badgeName ? String(badgeName) : 'Achievement Badge';
  }

  private extractCriteria(args: any[]): string {
    if (!args || args.length < 4) return 'completing a task';
    const criteria = args[3]?.value || args[3];
    return criteria ? String(criteria) : 'completing a task';
  }

  private createNotification(badgeEvent: BadgeMintEvent): NotificationPayload {
    return {
      userId: badgeEvent.userId,
      type: 'badge_received',
      title: `🏆 ${badgeEvent.badgeName}`,
      message: `Congratulations! You've received the ${badgeEvent.badgeName} badge for ${badgeEvent.criteria}`,
      data: {
        eventType: 'badge-mint',
        badgeId: badgeEvent.badgeId,
        badgeName: badgeEvent.badgeName,
        criteria: badgeEvent.criteria,
        contractAddress: badgeEvent.contractAddress,
        transactionHash: badgeEvent.transactionHash,
        blockHeight: badgeEvent.blockHeight,
        timestamp: badgeEvent.timestamp
      }
    };
  }
}
