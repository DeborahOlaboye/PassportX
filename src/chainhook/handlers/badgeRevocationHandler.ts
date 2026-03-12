import {
  ChainhookEventPayload,
  ChainhookEventHandler,
  NotificationPayload,
  BadgeRevocationEvent,
  ChainhookLogger,
} from '../types/handlers';

interface ContractCall {
  contract?: string;
  method?: string;
  args?: unknown[];
}

interface ContractEvent {
  topic?: string;
  contract_address?: string;
  value?: unknown;
}

export class BadgeRevocationHandler implements ChainhookEventHandler {
  private logger: ChainhookLogger;
  private readonly REVOCATION_METHODS = [
    'revoke-badge',
    'burn-badge',
    'deactivate-badge',
  ];
  private readonly REVOCATION_TOPICS = ['revoke', 'burn', 'deactivate'];
  private readonly SOFT_REVOKE_PATTERN = /active.*false/i;
  private readonly HARD_REVOKE_PATTERN = /burn|destroy/i;
  private compiledMethodFilter: Set<string>;
  private compiledTopicFilter: Set<string>;
  private lastHitTime = 0;
  private hitCache: Map<string, boolean> = new Map();
  private readonly CACHE_TTL_MS = 5000;
  private resultCache: Map<string, NotificationPayload[]> = new Map();

  constructor(logger?: ChainhookLogger) {
    this.logger = logger || this.getDefaultLogger();
    this.compiledMethodFilter = new Set(this.REVOCATION_METHODS);
    this.compiledTopicFilter = new Set(this.REVOCATION_TOPICS);
  }

  private getDefaultLogger(): ChainhookLogger {
    return {
      debug: (msg: string, ...args: unknown[]) =>
        console.debug(`[BadgeRevocationHandler] ${msg}`, ...args),
      info: (msg: string, ...args: unknown[]) =>
        console.info(`[BadgeRevocationHandler] ${msg}`, ...args),
      warn: (msg: string, ...args: unknown[]) =>
        console.warn(`[BadgeRevocationHandler] ${msg}`, ...args),
      error: (msg: string, ...args: unknown[]) =>
        console.error(`[BadgeRevocationHandler] ${msg}`, ...args),
    };
  }

  private getCacheKey(event: ChainhookEventPayload): string {
    return `${event.block_identifier?.index}:${
      event.transactions?.[0]?.transaction_hash || ''
    }`;
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
        this.logger.debug('Cache hit for badge revocation canHandle check');
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
              this.logger.debug('Detected badge revocation contract call', {
                method,
              });
              result = true;
              break;
            }
          }

          if (!result && op.events && Array.isArray(op.events)) {
            for (const evt of op.events) {
              if (evt && evt.topic) {
                for (const topic of this.compiledTopicFilter) {
                  if (evt.topic.includes(topic)) {
                    this.logger.debug('Detected badge revocation event', {
                      topic: evt.topic,
                    });
                    result = true;
                    break;
                  }
                }
                if (result) break;
              }
            }
          }

          if (result) break;
        }

        if (result) break;
      }

      this.lastHitTime = Date.now();
      this.hitCache.set(cacheKey, result);

      return result;
    } catch (error) {
      this.logger.error('Error in canHandle', { error });
      return false;
    }
  }

  async handle(event: ChainhookEventPayload): Promise<NotificationPayload[]> {
    try {
      const cacheKey = this.getCacheKey(event);
      const cached = this.resultCache.get(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit for badge revocation handle result');
        return cached;
      }

      const notifications: NotificationPayload[] = [];

      if (!event.transactions) {
        return notifications;
      }

      for (const tx of event.transactions) {
        if (!tx || !tx.operations) continue;

        for (const op of tx.operations) {
          if (!op) continue;

          if (op.type === 'contract_call' && op.contract_call) {
            const revocationEvents = this.extractRevocationFromContractCall(
              op.contract_call as ContractCall,
              tx.transaction_hash,
              event.block_identifier?.index || 0,
              event.timestamp || Date.now()
            );

            for (const revEvent of revocationEvents) {
              const notification = this.mapToNotification(revEvent);
              if (notification) {
                notifications.push(notification);
              }
            }
          }

          if (op.events && Array.isArray(op.events)) {
            for (const evt of op.events) {
              if (evt && this.isRevocationEvent(evt as ContractEvent)) {
                const revocationEvent = this.extractRevocationFromEvent(
                  evt as ContractEvent,
                  tx.transaction_hash,
                  event.block_identifier?.index || 0,
                  event.timestamp || Date.now()
                );

                if (revocationEvent) {
                  const notification = this.mapToNotification(revocationEvent);
                  if (notification) {
                    notifications.push(notification);
                  }
                }
              }
            }
          }
        }
      }

      this.resultCache.set(cacheKey, notifications);
      return notifications;
    } catch (error) {
      this.logger.error('Error handling badge revocation event', { error });
      return [];
    }
  }

  private extractRevocationFromContractCall(
    contractCall: ContractCall,
    transactionHash: string,
    blockHeight: number,
    timestamp: number
  ): BadgeRevocationEvent[] {
    const events: BadgeRevocationEvent[] = [];

    try {
      if (!contractCall.method) return events;

      const isHardRevoke = this.HARD_REVOKE_PATTERN.test(contractCall.method);

      const args = contractCall.args || [];
      if (args.length > 0) {
        const badgeId = String(args[0]);

        const revocationEvent: BadgeRevocationEvent = {
          userId: '',
          badgeId,
          badgeName: '',
          revocationType: isHardRevoke ? 'hard' : 'soft',
          issuerId: contractCall.contract || '',
          contractAddress: contractCall.contract || '',
          transactionHash,
          blockHeight,
          timestamp,
          previousActive: true,
          reason: args[2] ? String(args[2]) : undefined,
        };

        events.push(revocationEvent);
      }
    } catch (error) {
      this.logger.warn('Failed to extract revocation from contract call', {
        error,
      });
    }

    return events;
  }

  private isRevocationEvent(evt: ContractEvent): boolean {
    if (!evt || !evt.topic) return false;

    for (const topic of this.compiledTopicFilter) {
      if (evt.topic.includes(topic)) {
        return true;
      }
    }

    if (evt.value && typeof evt.value === 'string') {
      return (
        this.SOFT_REVOKE_PATTERN.test(evt.value) ||
        this.HARD_REVOKE_PATTERN.test(evt.value)
      );
    }

    return false;
  }

  private extractRevocationFromEvent(
    evt: ContractEvent,
    transactionHash: string,
    blockHeight: number,
    timestamp: number
  ): BadgeRevocationEvent | null {
    try {
      const topic = evt.topic || '';
      const isHardRevoke = this.HARD_REVOKE_PATTERN.test(topic);

      let badgeId = '';
      let userId = '';
      const contractAddress = evt.contract_address || '';

      if (evt.value) {
        const valueStr = String(evt.value);
        const badgeMatch = valueStr.match(
          /badge[_-]?id[:\s'"]*([a-zA-Z0-9_-]+)/i
        );
        const userMatch = valueStr.match(
          /user[_-]?id[:\s'"]*([a-zA-Z0-9_-]+)/i
        );

        if (badgeMatch) badgeId = badgeMatch[1];
        if (userMatch) userId = userMatch[1];
      }

      if (!badgeId) return null;

      const revocationEvent: BadgeRevocationEvent = {
        userId,
        badgeId,
        badgeName: '',
        revocationType: isHardRevoke ? 'hard' : 'soft',
        issuerId: contractAddress,
        contractAddress,
        transactionHash,
        blockHeight,
        timestamp,
        previousActive: true,
      };

      return revocationEvent;
    } catch (error) {
      this.logger.warn('Failed to extract revocation from event', { error });
      return null;
    }
  }

  private mapToNotification(
    revocationEvent: BadgeRevocationEvent
  ): NotificationPayload | null {
    if (!revocationEvent.userId) {
      this.logger.warn('Cannot map revocation event without userId', {
        badgeId: revocationEvent.badgeId,
      });
      return null;
    }

    const revocationType =
      revocationEvent.revocationType === 'hard' ? 'burned' : 'revoked';
    const badgeName =
      revocationEvent.badgeName || `Badge #${revocationEvent.badgeId}`;

    return {
      userId: revocationEvent.userId,
      type: 'badge_revoked',
      title: `Badge ${
        revocationType.charAt(0).toUpperCase() + revocationType.slice(1)
      }`,
      message: `Your badge "${badgeName}" has been ${revocationType}. ${
        revocationEvent.reason ? `Reason: ${revocationEvent.reason}` : ''
      }`,
      data: {
        eventType: 'badge_revocation',
        badgeId: revocationEvent.badgeId,
        badgeName: badgeName,
        revocationType: revocationEvent.revocationType,
        reason: revocationEvent.reason,
        transactionHash: revocationEvent.transactionHash,
        blockHeight: revocationEvent.blockHeight,
        timestamp: revocationEvent.timestamp,
      },
    };
  }

  getEventType(): string {
    return 'badge_revocation';
  }
}

export default BadgeRevocationHandler;
