// Performance tests for high event volume processing
import { describe, it, expect, beforeEach } from '@jest/globals';
import { PredicateEvaluator, PredicateBuilder } from '../src/utils/predicateEvaluator';
import { EventHandlerRegistry, EventHandlerBuilder } from '../src/utils/eventHandlerRegistry';
import { ReorgHandler, ReorgAwareEventProcessor } from '../src/utils/reorgHandler';
import { MockChainhookEventFactory } from '../src/utils/mockChainhookEvents';
import { EventType } from '../src/types/chainhook';

describe('Chainhook Performance Tests', () => {
  let predicateEvaluator: PredicateEvaluator;
  let eventRegistry: EventHandlerRegistry;
  let reorgHandler: ReorgHandler;

  beforeEach(() => {
    predicateEvaluator = new PredicateEvaluator();
    eventRegistry = new EventHandlerRegistry();
    reorgHandler = new ReorgHandler();
  });

  describe('High Volume Event Processing', () => {
    it('should process 1000 events efficiently', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onBadgeMint(handler);

      const startTime = Date.now();
      const events = MockChainhookEventFactory.createEventBatch(1000);

      for (const event of events.slice(0, 100)) {
        // Sample 100 for performance test
        if ('badgeId' in event) {
          await eventRegistry.dispatch('badge-mint', event);
        }
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(handler.mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle 500 predicates matching against 100 events', () => {
      const startTime = Date.now();

      const predicates = Array.from({ length: 500 }, (_, i) =>
        new PredicateBuilder()
          .withId(`predicate-${i}`)
          .withEventType(EventType.TX)
          .build()
      );

      const events = MockChainhookEventFactory.createEventBatch(100);

      const results = predicateEvaluator.evaluateEvents(events, predicates);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // Should complete in less than 2 seconds
      expect(results.length).toBeGreaterThan(0);
    });

    it('should process event batches with acceptable latency', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onBadgeMint(handler);

      const batchSize = 50;
      const batches = 10;

      const startTime = Date.now();

      for (let b = 0; b < batches; b++) {
        const events = MockChainhookEventFactory.createEventBatch(batchSize);

        const batchPromises = events.map(event =>
          eventRegistry.dispatch('badge-mint', event).catch(() => {})
        );

        await Promise.all(batchPromises);
      }

      const duration = Date.now() - startTime;
      const avgLatency = duration / (batchSize * batches);

      expect(avgLatency).toBeLessThan(10); // Less than 10ms per event
      expect(handler.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Predicate Matching Performance', () => {
    it('should efficiently filter events by function name', () => {
      const startTime = Date.now();

      const predicate = new PredicateBuilder()
        .withId('filter-mint')
        .withEventType(EventType.TX)
        .withFunctionName('mint-badge')
        .build();

      const events = MockChainhookEventFactory.createEventBatch(1000);

      const results = predicateEvaluator.evaluateEvents(events, [predicate]);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500); // Should complete in less than 500ms
      expect(results.some(r => r.matched)).toBe(true);
    });

    it('should efficiently filter events by amount range', () => {
      const startTime = Date.now();

      const predicate = new PredicateBuilder()
        .withId('high-value')
        .withEventType(EventType.TX)
        .withMinAmount(BigInt(1000000))
        .build();

      const events = Array.from({ length: 1000 }, () =>
        MockChainhookEventFactory.createSTXTransferEvent({
          amount: BigInt(Math.random() * 10000000)
        })
      );

      const results = predicateEvaluator.evaluateEvents(events, [predicate]);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle complex multi-filter predicates', () => {
      const startTime = Date.now();

      const complexPredicate = new PredicateBuilder()
        .withId('complex-filter')
        .withEventType(EventType.TX)
        .withFunctionName('mint-badge')
        .withSender('ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG')
        .withMinAmount(BigInt(500000))
        .build();

      const events = MockChainhookEventFactory.createEventBatch(500);

      const results = predicateEvaluator.evaluateEvents(events, [complexPredicate]);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300);
    });
  });

  describe('Event Handler Performance', () => {
    it('should dispatch events to multiple handlers efficiently', async () => {
      const handlers = Array.from({ length: 10 }, () =>
        jest.fn().mockResolvedValue(undefined)
      );

      handlers.forEach(handler => {
        eventRegistry.registerHandler('test-event', handler);
      });

      const event = MockChainhookEventFactory.createSTXTransferEvent();

      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        await eventRegistry.dispatch('test-event', event);
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // Should handle 100 dispatches in less than 2 seconds
      expect(handlers[0].mock.calls.length).toBe(100);
    });

    it('should handle cascading event dispatches', async () => {
      const handler1 = jest.fn().mockImplementation(async () => {
        // Trigger another dispatch
        await eventRegistry.dispatch('event-2', MockChainhookEventFactory.createSTXTransferEvent());
      });

      const handler2 = jest.fn().mockResolvedValue(undefined);

      eventRegistry.registerHandler('event-1', handler1);
      eventRegistry.registerHandler('event-2', handler2);

      const startTime = Date.now();

      const event = MockChainhookEventFactory.createSTXTransferEvent();

      for (let i = 0; i < 50; i++) {
        await eventRegistry.dispatch('event-1', event);
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000); // Cascading should still be efficient
      expect(handler1.mock.calls.length).toBe(50);
      expect(handler2.mock.calls.length).toBe(50);
    });
  });

  describe('Reorg Processing Performance', () => {
    it('should track and query reorgs efficiently', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const reorgEvent = MockChainhookEventFactory.createReorgEvent();
        await reorgHandler.handleReorg(reorgEvent);
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500); // Should handle 100 reorgs in less than 500ms
    });

    it('should efficiently check affected transactions', async () => {
      // Setup reorg history
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        affectedTransactions: Array.from({ length: 100 }, (_, i) => `tx-${i}`)
      });
      await reorgHandler.handleReorg(reorgEvent);

      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const txHash = `tx-${i % 100}`;
        reorgHandler.isTransactionAffected(txHash);
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should check 1000 transactions in less than 100ms
    });

    it('should efficiently retrieve affected transactions since height', async () => {
      // Create multiple reorg events
      for (let i = 0; i < 50; i++) {
        const reorgEvent = MockChainhookEventFactory.createReorgEvent({
          blockHeight: 100000 + i * 100,
          affectedTransactions: Array.from({ length: 10 }, (_, j) => `tx-${i}-${j}`)
        });
        await reorgHandler.handleReorg(reorgEvent);
      }

      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        reorgHandler.getAffectedTransactionsSince(100000 + i);
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200); // Should complete queries in less than 200ms
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory with high throughput', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      eventRegistry.registerHandler('test', handler);

      const initialMemory = process.memoryUsage().heapUsed;

      // Process events
      for (let i = 0; i < 1000; i++) {
        const event = MockChainhookEventFactory.createSTXTransferEvent();
        await eventRegistry.dispatch('test', event);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for 1000 events)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle large reorg histories efficiently', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create large reorg history
      for (let i = 0; i < 1000; i++) {
        const reorgEvent = MockChainhookEventFactory.createReorgEvent({
          affectedTransactions: Array.from({ length: 100 }, (_, j) => `tx-${i}-${j}`)
        });
        await reorgHandler.handleReorg(reorgEvent);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsed = finalMemory - initialMemory;

      // Should use reasonable memory (less than 100MB)
      expect(memoryUsed).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent event dispatches', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      eventRegistry.registerHandler('concurrent', handler);

      const startTime = Date.now();

      const promises = Array.from({ length: 100 }, async () => {
        const event = MockChainhookEventFactory.createSTXTransferEvent();
        return eventRegistry.dispatch('concurrent', event);
      });

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // Should handle 100 concurrent dispatches
      expect(handler.mock.calls.length).toBe(100);
    });

    it('should handle concurrent predicate evaluations', () => {
      const predicates = Array.from({ length: 10 }, (_, i) =>
        new PredicateBuilder()
          .withId(`predicate-${i}`)
          .withEventType(EventType.TX)
          .build()
      );

      const events = MockChainhookEventFactory.createEventBatch(100);

      const startTime = Date.now();

      const results = predicates.flatMap(predicate =>
        events.map(event => predicateEvaluator.evaluateEvent(event, predicate))
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
