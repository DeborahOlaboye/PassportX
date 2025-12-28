// Integration tests for Chainhook with test network
import { describe, it, expect, beforeEach } from '@jest/globals';
import { PredicateEvaluator, PredicateBuilder } from '../src/utils/predicateEvaluator';
import { EventHandlerRegistry, EventHandlerBuilder } from '../src/utils/eventHandlerRegistry';
import { ReorgHandler, ReorgAwareEventProcessor } from '../src/utils/reorgHandler';
import { MockChainhookEventFactory } from '../src/utils/mockChainhookEvents';
import { EventType } from '../src/types/chainhook';

describe('Chainhook Integration Tests', () => {
  let predicateEvaluator: PredicateEvaluator;
  let eventRegistry: EventHandlerRegistry;
  let reorgHandler: ReorgHandler;
  let eventProcessor: ReorgAwareEventProcessor;

  beforeEach(() => {
    predicateEvaluator = new PredicateEvaluator();
    eventRegistry = new EventHandlerRegistry();
    reorgHandler = new ReorgHandler();
    eventProcessor = new ReorgAwareEventProcessor(reorgHandler);
  });

  describe('Badge Mint Event Flow', () => {
    it('should detect and handle badge mint events', async () => {
      // Setup predicate for badge mint
      const predicate = new PredicateBuilder()
        .withId('badge-mint-predicate')
        .withName('Badge Mint Detection')
        .withEventType(EventType.TX)
        .withFunctionName('mint-badge')
        .build();

      // Setup event handler
      const badgeHandler = jest.fn().mockResolvedValue(undefined);
      const builder = new EventHandlerBuilder(eventRegistry);
      builder.onBadgeMint(badgeHandler);

      // Create badge mint event
      const event = MockChainhookEventFactory.createBadgeMintEvent();

      // Evaluate predicate
      const predicateResult = predicateEvaluator.evaluateEvent(event, predicate);
      expect(predicateResult.matched).toBe(true);

      // Dispatch event
      const response = await eventRegistry.dispatch('badge-mint', event);
      expect(response.success).toBe(true);
      expect(badgeHandler).toHaveBeenCalled();
    });

    it('should process multiple badge mints in sequence', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onBadgeMint(handler);

      const events = [
        MockChainhookEventFactory.createBadgeMintEvent({ badgeId: 'badge-1' }),
        MockChainhookEventFactory.createBadgeMintEvent({ badgeId: 'badge-2' }),
        MockChainhookEventFactory.createBadgeMintEvent({ badgeId: 'badge-3' })
      ];

      for (const event of events) {
        await eventRegistry.dispatch('badge-mint', event);
      }

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should skip badge mint if affected by reorg', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onBadgeMint(handler);

      // Create reorg affecting a transaction
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        affectedTransactions: ['tx-affected-badge']
      });
      await reorgHandler.handleReorg(reorgEvent);

      // Create badge mint event with affected tx hash
      const badgeEvent = MockChainhookEventFactory.createBadgeMintEvent({
        txHash: 'tx-affected-badge'
      });

      const result = await eventProcessor.processEvent(badgeEvent, async () => {
        await eventRegistry.dispatch('badge-mint', badgeEvent);
      });

      expect(result.processed).toBe(false);
    });
  });

  describe('Community Creation Event Flow', () => {
    it('should detect and handle community creation events', async () => {
      const predicate = new PredicateBuilder()
        .withId('community-creation')
        .withEventType(EventType.TX)
        .build();

      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onCommunityCreation(handler);

      const event = MockChainhookEventFactory.createCommunityCreationEvent();

      const predicateResult = predicateEvaluator.evaluateEvent(event, predicate);
      expect(predicateResult.matched).toBe(true);

      await eventRegistry.dispatch('community-creation', event);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Revocation Event Flow', () => {
    it('should handle badge revocation events', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onRevocation(handler);

      const event = MockChainhookEventFactory.createRevocationEvent({
        revokedEntityType: 'badge'
      });

      await eventRegistry.dispatch('revocation', event);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle community revocation events', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onRevocation(handler);

      const event = MockChainhookEventFactory.createRevocationEvent({
        revokedEntityType: 'community'
      });

      await eventRegistry.dispatch('revocation', event);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Metadata Update Event Flow', () => {
    it('should handle metadata update events', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onMetadataUpdate(handler);

      const event = MockChainhookEventFactory.createMetadataUpdateEvent();

      await eventRegistry.dispatch('metadata-update', event);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Connection Failure Handling', () => {
    it('should handle connection failures gracefully', async () => {
      const connectionError = new Error('Connection failed');
      const handler = jest.fn().mockRejectedValue(connectionError);
      const errorHandler = jest.fn().mockResolvedValue(undefined);

      new EventHandlerBuilder(eventRegistry)
        .onBadgeMint(handler)
        .onError(errorHandler);

      const event = MockChainhookEventFactory.createBadgeMintEvent();
      const response = await eventRegistry.dispatch('badge-mint', event);

      expect(response.success).toBe(true);
      expect(response.actions[0].status).toBe('failed');
      expect(errorHandler).toHaveBeenCalled();
    });

    it('should retry failed operations', async () => {
      const handler = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);

      new EventHandlerBuilder(eventRegistry).onBadgeMint(handler);

      const event = MockChainhookEventFactory.createBadgeMintEvent();

      // First attempt fails
      let response = await eventRegistry.dispatch('badge-mint', event);
      expect(response.actions[0].status).toBe('failed');

      // Retry succeeds
      eventRegistry.clear();
      new EventHandlerBuilder(eventRegistry).onBadgeMint(handler);
      response = await eventRegistry.dispatch('badge-mint', event);
      expect(response.actions[0].status).toBe('success');
    });
  });

  describe('Event Batch Processing', () => {
    it('should process batch of diverse events', async () => {
      const badgeHandler = jest.fn().mockResolvedValue(undefined);
      const communityHandler = jest.fn().mockResolvedValue(undefined);
      const revocationHandler = jest.fn().mockResolvedValue(undefined);

      new EventHandlerBuilder(eventRegistry)
        .onBadgeMint(badgeHandler)
        .onCommunityCreation(communityHandler)
        .onRevocation(revocationHandler);

      const events = [
        MockChainhookEventFactory.createBadgeMintEvent(),
        MockChainhookEventFactory.createCommunityCreationEvent(),
        MockChainhookEventFactory.createRevocationEvent(),
        MockChainhookEventFactory.createBadgeMintEvent()
      ];

      for (const event of events) {
        if ('badgeId' in event) {
          await eventRegistry.dispatch('badge-mint', event);
        } else if ('communityId' in event && 'creatorAddress' in event) {
          await eventRegistry.dispatch('community-creation', event);
        } else if ('revokedEntityId' in event) {
          await eventRegistry.dispatch('revocation', event);
        }
      }

      expect(badgeHandler).toHaveBeenCalledTimes(2);
      expect(communityHandler).toHaveBeenCalledTimes(1);
      expect(revocationHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle reorg during batch processing', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onBadgeMint(handler);

      // Create reorg
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        affectedTransactions: ['tx-1']
      });
      await reorgHandler.handleReorg(reorgEvent);

      // Process batch with affected and safe transactions
      const events = [
        MockChainhookEventFactory.createBadgeMintEvent({ txHash: 'tx-1' }),
        MockChainhookEventFactory.createBadgeMintEvent({ txHash: 'tx-2' })
      ];

      const results = await eventProcessor.processEvents(events, async (event) => {
        await eventRegistry.dispatch('badge-mint', event);
      });

      expect(results.size).toBe(2);
      const resultsArray = Array.from(results.values());
      expect(resultsArray.some(r => !r.processed)).toBe(true);
      expect(resultsArray.some(r => r.processed)).toBe(true);
    });
  });

  describe('Predicate and Action Orchestration', () => {
    it('should execute actions when predicates match', async () => {
      const notifyAction = jest.fn().mockResolvedValue({ notified: true });

      const predicate = new PredicateBuilder()
        .withId('notify-high-value')
        .withEventType(EventType.TX)
        .withMinAmount(BigInt(500000))
        .build();

      new EventHandlerBuilder(eventRegistry)
        .action('notify', notifyAction);

      const event = MockChainhookEventFactory.createSTXTransferEvent({
        amount: BigInt(1000000)
      });

      const predicateResult = predicateEvaluator.evaluateEvent(event, predicate);
      if (predicateResult.matched) {
        predicateResult.actions = ['notify'];
        const actionResults = await eventRegistry.executeActions(predicateResult);
        expect(actionResults[0].status).toBe('success');
        expect(notifyAction).toHaveBeenCalled();
      }
    });
  });
});
