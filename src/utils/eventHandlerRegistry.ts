// Chainhook event handler registry and dispatcher
import {
  ChainhookEvent,
  EventHandlerResponse,
  PredicateResult
} from '../types/chainhook';

/**
 * Event handler function type
 */
export type EventHandler = (
  event: ChainhookEvent,
  context?: any
) => Promise<void>;

/**
 * Action handler function type
 */
export type ActionHandler = (data: any) => Promise<any>;

/**
 * Event Handler Registry
 * Manages event handlers and dispatches events
 */
export class EventHandlerRegistry {
  private handlers: Map<string, EventHandler[]> = new Map();
  private actionHandlers: Map<string, ActionHandler> = new Map();
  private errorHandlers: ((error: Error, event: ChainhookEvent) => Promise<void>)[] = [];

  /**
   * Register an event handler
   */
  registerHandler(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Register an action handler
   */
  registerActionHandler(actionName: string, handler: ActionHandler): void {
    this.actionHandlers.set(actionName, handler);
  }

  /**
   * Register an error handler
   */
  registerErrorHandler(
    handler: (error: Error, event: ChainhookEvent) => Promise<void>
  ): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Dispatch an event to all registered handlers
   */
  async dispatch(
    eventType: string,
    event: ChainhookEvent,
    context?: any
  ): Promise<EventHandlerResponse> {
    const startTime = Date.now();
    const actions = [];

    try {
      const handlers = this.handlers.get(eventType) || [];

      for (const handler of handlers) {
        try {
          await handler(event, context);
          actions.push({
            name: handler.name || 'anonymous',
            status: 'success' as const
          });
        } catch (error) {
          actions.push({
            name: handler.name || 'anonymous',
            status: 'failed' as const,
            error: (error as Error).message
          });

          // Call error handlers
          for (const errorHandler of this.errorHandlers) {
            try {
              await errorHandler(error as Error, event);
            } catch (handlerError) {
              console.error('Error handler failed:', handlerError);
            }
          }
        }
      }

      return {
        success: actions.length > 0,
        eventHash: this.hashEvent(event),
        handledAt: Date.now(),
        processingTimeMs: Date.now() - startTime,
        actions
      };
    } catch (error) {
      return {
        success: false,
        eventHash: this.hashEvent(event),
        handledAt: Date.now(),
        processingTimeMs: Date.now() - startTime,
        actions: [
          {
            name: 'dispatch',
            status: 'failed' as const,
            error: (error as Error).message
          }
        ]
      };
    }
  }

  /**
   * Execute actions from predicate match
   */
  async executeActions(
    predicateResult: PredicateResult,
    context?: any
  ): Promise<any[]> {
    const results = [];

    if (!predicateResult.actions) {
      return results;
    }

    for (const actionName of predicateResult.actions) {
      const handler = this.actionHandlers.get(actionName);
      if (handler) {
        try {
          const result = await handler({
            event: predicateResult.event,
            predicateId: predicateResult.predicateId,
            ...context
          });
          results.push({ action: actionName, status: 'success', result });
        } catch (error) {
          results.push({
            action: actionName,
            status: 'failed',
            error: (error as Error).message
          });
        }
      }
    }

    return results;
  }

  /**
   * Remove all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.actionHandlers.clear();
    this.errorHandlers = [];
  }

  /**
   * Get registered handlers for an event type
   */
  getHandlers(eventType: string): EventHandler[] {
    return this.handlers.get(eventType) || [];
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Hash an event for tracking
   */
  private hashEvent(event: ChainhookEvent): string {
    const eventStr = JSON.stringify(event);
    let hash = 0;

    for (let i = 0; i < eventStr.length; i++) {
      const char = eventStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }
}

/**
 * Event Handler Builder
 * Fluent API for registering handlers
 */
export class EventHandlerBuilder {
  private registry: EventHandlerRegistry;

  constructor(registry: EventHandlerRegistry) {
    this.registry = registry;
  }

  /**
   * Register handler for badge mint events
   */
  onBadgeMint(handler: EventHandler): this {
    this.registry.registerHandler('badge-mint', handler);
    return this;
  }

  /**
   * Register handler for community creation events
   */
  onCommunityCreation(handler: EventHandler): this {
    this.registry.registerHandler('community-creation', handler);
    return this;
  }

  /**
   * Register handler for revocation events
   */
  onRevocation(handler: EventHandler): this {
    this.registry.registerHandler('revocation', handler);
    return this;
  }

  /**
   * Register handler for metadata update events
   */
  onMetadataUpdate(handler: EventHandler): this {
    this.registry.registerHandler('metadata-update', handler);
    return this;
  }

  /**
   * Register handler for reorg events
   */
  onReorg(handler: EventHandler): this {
    this.registry.registerHandler('reorg', handler);
    return this;
  }

  /**
   * Register handler for any event
   */
  onAnyEvent(handler: EventHandler): this {
    this.registry.registerHandler('*', handler);
    return this;
  }

  /**
   * Register action handler
   */
  action(name: string, handler: ActionHandler): this {
    this.registry.registerActionHandler(name, handler);
    return this;
  }

  /**
   * Register error handler
   */
  onError(handler: (error: Error, event: ChainhookEvent) => Promise<void>): this {
    this.registry.registerErrorHandler(handler);
    return this;
  }
}
