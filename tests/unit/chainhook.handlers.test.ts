// Unit tests for Chainhook event handlers
import { describe, it, expect, beforeEach } from '@jest/globals';
import { EventHandlerRegistry, EventHandlerBuilder } from '../src/utils/eventHandlerRegistry';
import { MockChainhookEventFactory } from '../src/utils/mockChainhookEvents';
import { ChainhookEvent } from '../src/types/chainhook';

describe('Event Handler Registry', () => {
  let registry: EventHandlerRegistry;

  beforeEach(() => {
    registry = new EventHandlerRegistry();
  });

  describe('EventHandlerRegistry.registerHandler', () => {
    it('should register an event handler', () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      registry.registerHandler('test-event', handler);

      const handlers = registry.getHandlers('test-event');
      expect(handlers.length).toBe(1);
      expect(handlers[0]).toBe(handler);
    });

    it('should register multiple handlers for same event', () => {
      const handler1 = jest.fn().mockResolvedValue(undefined);
      const handler2 = jest.fn().mockResolvedValue(undefined);

      registry.registerHandler('test-event', handler1);
      registry.registerHandler('test-event', handler2);

      const handlers = registry.getHandlers('test-event');
      expect(handlers.length).toBe(2);
    });

    it('should register handlers for different event types', () => {
      const handler1 = jest.fn().mockResolvedValue(undefined);
      const handler2 = jest.fn().mockResolvedValue(undefined);

      registry.registerHandler('badge-mint', handler1);
      registry.registerHandler('community-creation', handler2);

      expect(registry.getEventTypes()).toContain('badge-mint');
      expect(registry.getEventTypes()).toContain('community-creation');
    });
  });

  describe('EventHandlerRegistry.dispatch', () => {
    it('should dispatch event to registered handler', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      registry.registerHandler('test-event', handler);

      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const response = await registry.dispatch('test-event', event);

      expect(handler).toHaveBeenCalledWith(event, undefined);
      expect(response.success).toBe(true);
      expect(response.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle handler errors gracefully', async () => {
      const error = new Error('Handler failed');
      const handler = jest.fn().mockRejectedValue(error);
      registry.registerHandler('test-event', handler);

      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const response = await registry.dispatch('test-event', event);

      expect(response.success).toBe(true);
      expect(response.actions[0].status).toBe('failed');
      expect(response.actions[0].error).toBe('Handler failed');
    });

    it('should dispatch event to multiple handlers', async () => {
      const handler1 = jest.fn().mockResolvedValue(undefined);
      const handler2 = jest.fn().mockResolvedValue(undefined);

      registry.registerHandler('test-event', handler1);
      registry.registerHandler('test-event', handler2);

      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const response = await registry.dispatch('test-event', event);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(response.actions.length).toBe(2);
    });

    it('should call error handlers on handler failure', async () => {
      const error = new Error('Handler failed');
      const handler = jest.fn().mockRejectedValue(error);
      const errorHandler = jest.fn().mockResolvedValue(undefined);

      registry.registerHandler('test-event', handler);
      registry.registerErrorHandler(errorHandler);

      const event = MockChainhookEventFactory.createSTXTransferEvent();
      await registry.dispatch('test-event', event);

      expect(errorHandler).toHaveBeenCalledWith(error, event);
    });

    it('should pass context to handlers', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      registry.registerHandler('test-event', handler);

      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const context = { userId: 'user123' };
      await registry.dispatch('test-event', event, context);

      expect(handler).toHaveBeenCalledWith(event, context);
    });

    it('should handle non-existent event type gracefully', async () => {
      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const response = await registry.dispatch('non-existent', event);

      expect(response.success).toBe(false);
      expect(response.actions.length).toBe(0);
    });
  });

  describe('EventHandlerRegistry.registerActionHandler', () => {
    it('should register an action handler', () => {
      const action = jest.fn().mockResolvedValue({ result: 'success' });
      registry.registerActionHandler('notify', action);

      expect(registry).toBeDefined();
    });
  });

  describe('EventHandlerRegistry.executeActions', () => {
    it('should execute registered actions', async () => {
      const action = jest.fn().mockResolvedValue({ status: 'done' });
      registry.registerActionHandler('notify', action);

      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const predicateResult = {
        predicateId: 'pred-1',
        matched: true,
        event,
        matchedAt: Date.now(),
        actions: ['notify']
      };

      const results = await registry.executeActions(predicateResult);

      expect(results.length).toBe(1);
      expect(results[0].action).toBe('notify');
      expect(results[0].status).toBe('success');
    });

    it('should handle action failures gracefully', async () => {
      const error = new Error('Action failed');
      const action = jest.fn().mockRejectedValue(error);
      registry.registerActionHandler('notify', action);

      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const predicateResult = {
        predicateId: 'pred-1',
        matched: true,
        event,
        matchedAt: Date.now(),
        actions: ['notify']
      };

      const results = await registry.executeActions(predicateResult);

      expect(results[0].status).toBe('failed');
      expect(results[0].error).toBe('Action failed');
    });

    it('should skip non-registered actions', async () => {
      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const predicateResult = {
        predicateId: 'pred-1',
        matched: true,
        event,
        matchedAt: Date.now(),
        actions: ['non-existent-action']
      };

      const results = await registry.executeActions(predicateResult);

      expect(results.length).toBe(0);
    });
  });

  describe('EventHandlerRegistry.clear', () => {
    it('should clear all registered handlers', () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      registry.registerHandler('test-event', handler);

      expect(registry.getHandlers('test-event').length).toBe(1);

      registry.clear();

      expect(registry.getHandlers('test-event').length).toBe(0);
      expect(registry.getEventTypes().length).toBe(0);
    });
  });

  describe('EventHandlerBuilder', () => {
    it('should build handler registry fluently', async () => {
      const handler1 = jest.fn().mockResolvedValue(undefined);
      const handler2 = jest.fn().mockResolvedValue(undefined);
      const action = jest.fn().mockResolvedValue(undefined);

      const builder = new EventHandlerBuilder(registry);
      builder
        .onBadgeMint(handler1)
        .onCommunityCreation(handler2)
        .action('notify', action);

      expect(registry.getEventTypes()).toContain('badge-mint');
      expect(registry.getEventTypes()).toContain('community-creation');
    });

    it('should register error handler via builder', async () => {
      const errorHandler = jest.fn().mockResolvedValue(undefined);
      const handler = jest.fn().mockRejectedValue(new Error('Test error'));

      const builder = new EventHandlerBuilder(registry);
      builder
        .onBadgeMint(handler)
        .onError(errorHandler);

      const event = MockChainhookEventFactory.createBadgeMintEvent();
      await registry.dispatch('badge-mint', event);

      expect(errorHandler).toHaveBeenCalled();
    });
  });
});
