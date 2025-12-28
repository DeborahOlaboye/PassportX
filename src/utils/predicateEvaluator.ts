// Predicate evaluation logic for Chainhook events
import {
  ChainhookEvent,
  PredicateConfig,
  PredicateResult,
  STXTransferEvent,
  ContractCallEvent,
  EventType
} from '../types/chainhook';

/**
 * Predicate Evaluator
 * Evaluates whether events match predicate conditions
 */
export class PredicateEvaluator {
  /**
   * Evaluate if an event matches a predicate
   */
  static evaluateEvent(
    event: ChainhookEvent,
    predicate: PredicateConfig
  ): PredicateResult {
    const matched = this.matchesPredicate(event, predicate);

    return {
      predicateId: predicate.id,
      matched,
      event,
      matchedAt: Date.now(),
      actions: matched ? predicate.filters ? ['trigger'] : [] : []
    };
  }

  /**
   * Check if event matches predicate filters
   */
  private static matchesPredicate(
    event: ChainhookEvent,
    predicate: PredicateConfig
  ): boolean {
    // Check event type
    if (event.type !== predicate.eventType) {
      return false;
    }

    // Apply function name filter
    if (
      predicate.filters.functionName &&
      (event as ContractCallEvent).function !== predicate.filters.functionName
    ) {
      return false;
    }

    // Apply sender filter
    if (
      predicate.filters.sender &&
      (event as STXTransferEvent).sender !== predicate.filters.sender
    ) {
      return false;
    }

    // Apply recipient filter
    if (
      predicate.filters.recipient &&
      (event as STXTransferEvent).recipient !== predicate.filters.recipient
    ) {
      return false;
    }

    // Apply minimum amount filter
    if (
      predicate.filters.minAmount &&
      (event as STXTransferEvent).amount < predicate.filters.minAmount
    ) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate multiple events against predicates
   */
  static evaluateEvents(
    events: ChainhookEvent[],
    predicates: PredicateConfig[]
  ): PredicateResult[] {
    const results: PredicateResult[] = [];

    for (const predicate of predicates) {
      if (!predicate.enabled) continue;

      for (const event of events) {
        const result = this.evaluateEvent(event, predicate);
        if (result.matched) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Validate predicate configuration
   */
  static validatePredicate(predicate: PredicateConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!predicate.id || predicate.id.trim().length === 0) {
      errors.push('Predicate ID is required');
    }

    if (!predicate.name || predicate.name.trim().length === 0) {
      errors.push('Predicate name is required');
    }

    if (!predicate.network) {
      errors.push('Network is required');
    }

    if (!Object.values(EventType).includes(predicate.eventType)) {
      errors.push('Invalid event type');
    }

    if (!predicate.filters) {
      errors.push('Filters object is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a predicate from partial configuration
   */
  static createPredicate(
    config: Partial<PredicateConfig>
  ): PredicateConfig {
    return {
      id: config.id || `predicate-${Date.now()}`,
      name: config.name || 'Unnamed Predicate',
      network: config.network || 'testnet',
      contractAddress: config.contractAddress,
      eventType: config.eventType || EventType.TX,
      filters: config.filters || {},
      enabled: config.enabled !== undefined ? config.enabled : true,
      createdAt: config.createdAt || Date.now()
    };
  }
}

/**
 * Predicate Filter Builder
 * Fluent API for building predicates
 */
export class PredicateBuilder {
  private predicate: Partial<PredicateConfig> = {};

  withId(id: string): this {
    this.predicate.id = id;
    return this;
  }

  withName(name: string): this {
    this.predicate.name = name;
    return this;
  }

  withNetwork(network: 'mainnet' | 'testnet'): this {
    this.predicate.network = network;
    return this;
  }

  withEventType(type: EventType): this {
    this.predicate.eventType = type;
    return this;
  }

  withFunctionName(functionName: string): this {
    this.predicate.filters = this.predicate.filters || {};
    this.predicate.filters.functionName = functionName;
    return this;
  }

  withSender(sender: string): this {
    this.predicate.filters = this.predicate.filters || {};
    this.predicate.filters.sender = sender;
    return this;
  }

  withRecipient(recipient: string): this {
    this.predicate.filters = this.predicate.filters || {};
    this.predicate.filters.recipient = recipient;
    return this;
  }

  withMinAmount(amount: bigint): this {
    this.predicate.filters = this.predicate.filters || {};
    this.predicate.filters.minAmount = amount;
    return this;
  }

  enabled(enabled: boolean = true): this {
    this.predicate.enabled = enabled;
    return this;
  }

  build(): PredicateConfig {
    const predicate = PredicateEvaluator.createPredicate(this.predicate);
    const validation = PredicateEvaluator.validatePredicate(predicate);

    if (!validation.valid) {
      throw new Error(`Invalid predicate: ${validation.errors.join(', ')}`);
    }

    return predicate;
  }
}
