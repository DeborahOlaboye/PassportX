// Unit tests for Chainhook predicates
import { describe, it, expect, beforeEach } from '@jest/globals';
import { PredicateEvaluator, PredicateBuilder } from '../src/utils/predicateEvaluator';
import { MockChainhookEventFactory } from '../src/utils/mockChainhookEvents';
import { EventType, PredicateConfig } from '../src/types/chainhook';

describe('Predicate Logic', () => {
  let evaluator: PredicateEvaluator;

  beforeEach(() => {
    evaluator = new PredicateEvaluator();
  });

  describe('PredicateEvaluator.evaluateEvent', () => {
    it('should match event to predicate with matching event type', () => {
      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const predicate = new PredicateBuilder()
        .withId('test-1')
        .withEventType(EventType.TX)
        .build();

      const result = evaluator.evaluateEvent(event, predicate);

      expect(result.matched).toBe(true);
      expect(result.predicateId).toBe('test-1');
    });

    it('should not match event with different event type', () => {
      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const predicate = new PredicateBuilder()
        .withId('test-2')
        .withEventType(EventType.BLOCK)
        .build();

      const result = evaluator.evaluateEvent(event, predicate);

      expect(result.matched).toBe(false);
    });

    it('should match event with matching function name', () => {
      const event = MockChainhookEventFactory.createContractCallEvent({
        function: 'mint-badge'
      });
      const predicate = new PredicateBuilder()
        .withId('test-3')
        .withEventType(EventType.TX)
        .withFunctionName('mint-badge')
        .build();

      const result = evaluator.evaluateEvent(event, predicate);

      expect(result.matched).toBe(true);
    });

    it('should not match event with different function name', () => {
      const event = MockChainhookEventFactory.createContractCallEvent({
        function: 'mint-badge'
      });
      const predicate = new PredicateBuilder()
        .withId('test-4')
        .withEventType(EventType.TX)
        .withFunctionName('transfer')
        .build();

      const result = evaluator.evaluateEvent(event, predicate);

      expect(result.matched).toBe(false);
    });

    it('should match event with matching sender address', () => {
      const senderAddress = 'ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG';
      const event = MockChainhookEventFactory.createSTXTransferEvent({
        sender: senderAddress
      });
      const predicate = new PredicateBuilder()
        .withId('test-5')
        .withEventType(EventType.TX)
        .withSender(senderAddress)
        .build();

      const result = evaluator.evaluateEvent(event, predicate);

      expect(result.matched).toBe(true);
    });

    it('should not match event with different sender address', () => {
      const event = MockChainhookEventFactory.createSTXTransferEvent({
        sender: 'ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG'
      });
      const predicate = new PredicateBuilder()
        .withId('test-6')
        .withEventType(EventType.TX)
        .withSender('ST2CY5V39NAYQ07NNC5V4FQ7QG7V5K2KKG3TZYJCT')
        .build();

      const result = evaluator.evaluateEvent(event, predicate);

      expect(result.matched).toBe(false);
    });

    it('should match event with minimum amount threshold', () => {
      const event = MockChainhookEventFactory.createSTXTransferEvent({
        amount: BigInt(1000000)
      });
      const predicate = new PredicateBuilder()
        .withId('test-7')
        .withEventType(EventType.TX)
        .withMinAmount(BigInt(500000))
        .build();

      const result = evaluator.evaluateEvent(event, predicate);

      expect(result.matched).toBe(true);
    });

    it('should not match event below minimum amount threshold', () => {
      const event = MockChainhookEventFactory.createSTXTransferEvent({
        amount: BigInt(100000)
      });
      const predicate = new PredicateBuilder()
        .withId('test-8')
        .withEventType(EventType.TX)
        .withMinAmount(BigInt(500000))
        .build();

      const result = evaluator.evaluateEvent(event, predicate);

      expect(result.matched).toBe(false);
    });
  });

  describe('PredicateEvaluator.evaluateEvents', () => {
    it('should evaluate multiple events against multiple predicates', () => {
      const events = MockChainhookEventFactory.createEventBatch(5);
      const predicates = [
        new PredicateBuilder()
          .withId('predicate-1')
          .withEventType(EventType.TX)
          .build(),
        new PredicateBuilder()
          .withId('predicate-2')
          .withEventType(EventType.TX)
          .build()
      ];

      const results = evaluator.evaluateEvents(events, predicates);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.matched)).toBe(true);
    });

    it('should skip disabled predicates', () => {
      const events = MockChainhookEventFactory.createEventBatch(3);
      const predicates = [
        new PredicateBuilder()
          .withId('predicate-1')
          .withEventType(EventType.TX)
          .enabled(true)
          .build(),
        new PredicateBuilder()
          .withId('predicate-2')
          .withEventType(EventType.TX)
          .enabled(false)
          .build()
      ];

      const results = evaluator.evaluateEvents(events, predicates);

      expect(results.every(r => r.predicateId !== 'predicate-2')).toBe(true);
    });

    it('should return empty array when no predicates match', () => {
      const event = MockChainhookEventFactory.createSTXTransferEvent();
      const predicates = [
        new PredicateBuilder()
          .withId('predicate-1')
          .withEventType(EventType.BLOCK)
          .build()
      ];

      const results = evaluator.evaluateEvents([event], predicates);

      expect(results.length).toBe(0);
    });
  });

  describe('PredicateEvaluator.validatePredicate', () => {
    it('should validate correct predicate', () => {
      const predicate = new PredicateBuilder()
        .withId('valid')
        .withName('Valid Predicate')
        .withEventType(EventType.TX)
        .build();

      const validation = PredicateEvaluator.validatePredicate(predicate);

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should reject predicate without ID', () => {
      const predicate: PredicateConfig = {
        id: '',
        name: 'No ID Predicate',
        network: 'testnet',
        eventType: EventType.TX,
        filters: {},
        enabled: true,
        createdAt: Date.now()
      };

      const validation = PredicateEvaluator.validatePredicate(predicate);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('ID'))).toBe(true);
    });

    it('should reject predicate without name', () => {
      const predicate: PredicateConfig = {
        id: 'test',
        name: '',
        network: 'testnet',
        eventType: EventType.TX,
        filters: {},
        enabled: true,
        createdAt: Date.now()
      };

      const validation = PredicateEvaluator.validatePredicate(predicate);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should reject predicate with invalid event type', () => {
      const predicate: any = {
        id: 'test',
        name: 'Invalid Event Type',
        network: 'testnet',
        eventType: 'invalid-type',
        filters: {},
        enabled: true,
        createdAt: Date.now()
      };

      const validation = PredicateEvaluator.validatePredicate(predicate);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('event type'))).toBe(true);
    });
  });

  describe('PredicateBuilder', () => {
    it('should build predicate with all filters', () => {
      const predicate = new PredicateBuilder()
        .withId('complex')
        .withName('Complex Predicate')
        .withNetwork('mainnet')
        .withEventType(EventType.TX)
        .withFunctionName('mint-badge')
        .withSender('ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG')
        .withMinAmount(BigInt(1000000))
        .enabled(true)
        .build();

      expect(predicate.id).toBe('complex');
      expect(predicate.name).toBe('Complex Predicate');
      expect(predicate.network).toBe('mainnet');
      expect(predicate.filters.functionName).toBe('mint-badge');
      expect(predicate.filters.minAmount).toBe(BigInt(1000000));
    });

    it('should throw error on invalid predicate build', () => {
      expect(() => {
        new PredicateBuilder()
          .withId('')
          .build();
      }).toThrow();
    });
  });
});
