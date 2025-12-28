// End-to-end Chainhook integration test scenarios
import { describe, it, expect, beforeEach } from '@jest/globals';
import { PredicateEvaluator, PredicateBuilder } from '../src/utils/predicateEvaluator';
import { EventHandlerRegistry, EventHandlerBuilder } from '../src/utils/eventHandlerRegistry';
import { ReorgHandler, ReorgAwareEventProcessor } from '../src/utils/reorgHandler';
import { MockChainhookEventFactory } from '../src/utils/mockChainhookEvents';
import { EventType } from '../src/types/chainhook';

describe('Chainhook E2E Scenarios', () => {
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

  describe('Complete Badge Lifecycle', () => {
    it('should handle full badge lifecycle from creation to revocation', async () => {
      const badgeCreated = jest.fn().mockResolvedValue(undefined);
      const badgeIssued = jest.fn().mockResolvedValue(undefined);
      const badgeRevoked = jest.fn().mockResolvedValue(undefined);

      const builder = new EventHandlerBuilder(eventRegistry);
      builder
        .onMetadataUpdate(badgeCreated)
        .onBadgeMint(badgeIssued)
        .onRevocation(badgeRevoked);

      // Create badge template
      const createEvent = MockChainhookEventFactory.createMetadataUpdateEvent({
        entityType: 'badge',
        changes: { created: true }
      });
      await eventRegistry.dispatch('metadata-update', createEvent);

      // Issue badge to multiple recipients
      const issueEvent1 = MockChainhookEventFactory.createBadgeMintEvent({
        badgeId: 'badge-1',
        recipientAddress: 'ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG'
      });
      const issueEvent2 = MockChainhookEventFactory.createBadgeMintEvent({
        badgeId: 'badge-1',
        recipientAddress: 'ST2CY5V39NAYQ07NNC5V4FQ7QG7V5K2KKG3TZYJCT'
      });

      await eventRegistry.dispatch('badge-mint', issueEvent1);
      await eventRegistry.dispatch('badge-mint', issueEvent2);

      // Revoke badge
      const revokeEvent = MockChainhookEventFactory.createRevocationEvent({
        revokedEntityId: 'badge-1',
        revokedEntityType: 'badge'
      });
      await eventRegistry.dispatch('revocation', revokeEvent);

      expect(badgeCreated).toHaveBeenCalledTimes(1);
      expect(badgeIssued).toHaveBeenCalledTimes(2);
      expect(badgeRevoked).toHaveBeenCalledTimes(1);
    });
  });

  describe('Community Formation and Management', () => {
    it('should handle community creation and badge issuance', async () => {
      const communityCreated = jest.fn().mockResolvedValue(undefined);
      const badgeIssued = jest.fn().mockResolvedValue(undefined);

      new EventHandlerBuilder(eventRegistry)
        .onCommunityCreation(communityCreated)
        .onBadgeMint(badgeIssued);

      // Create community
      const communityEvent = MockChainhookEventFactory.createCommunityCreationEvent({
        communityId: 'community-1',
        name: 'Developers Community'
      });
      await eventRegistry.dispatch('community-creation', communityEvent);

      // Issue badges within community
      const badges = Array.from({ length: 5 }, (_, i) =>
        MockChainhookEventFactory.createBadgeMintEvent({
          badgeId: `badge-${i}`,
          communityId: 'community-1',
          recipientAddress: `ST${i}PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG`
        })
      );

      for (const badgeEvent of badges) {
        await eventRegistry.dispatch('badge-mint', badgeEvent);
      }

      expect(communityCreated).toHaveBeenCalledTimes(1);
      expect(badgeIssued).toHaveBeenCalledTimes(5);
    });

    it('should handle community revocation and cleanup', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      new EventHandlerBuilder(eventRegistry).onRevocation(handler);

      // Create community
      const communityEvent = MockChainhookEventFactory.createCommunityCreationEvent({
        communityId: 'community-1'
      });
      await eventRegistry.dispatch('community-creation', communityEvent);

      // Revoke community
      const revokeEvent = MockChainhookEventFactory.createRevocationEvent({
        revokedEntityId: 'community-1',
        revokedEntityType: 'community',
        reason: 'Compliance violation'
      });
      await eventRegistry.dispatch('revocation', revokeEvent);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Reorg Recovery Scenario', () => {
    it('should recover from reorganization without data loss', async () => {
      const processedEvents: any[] = [];

      const handler = jest.fn().mockImplementation(async (event) => {
        processedEvents.push(event);
      });

      new EventHandlerBuilder(eventRegistry).onBadgeMint(handler);

      // Process initial events
      const batch1 = Array.from({ length: 5 }, (_, i) =>
        MockChainhookEventFactory.createBadgeMintEvent({ badgeId: `badge-${i}` })
      );

      for (const event of batch1) {
        await eventRegistry.dispatch('badge-mint', event);
      }

      // Detect reorg affecting some transactions
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        affectedTransactions: [batch1[2].txHash || 'tx-2'],
        blockHeight: 100010
      });
      await reorgHandler.handleReorg(reorgEvent);

      // Process replacement events
      const batch2 = [
        MockChainhookEventFactory.createBadgeMintEvent({ badgeId: 'badge-2-replacement' })
      ];

      for (const event of batch2) {
        const result = await eventProcessor.processEvent(event, async () => {
          await eventRegistry.dispatch('badge-mint', event);
        });
        expect(result.processed).toBe(true);
      }

      // Verify recovery actions
      const recoveryActions = reorgHandler.getRecoveryActions();
      expect(recoveryActions.verifyDataIntegrity).toBe(true);
      expect(processedEvents.length).toBeGreaterThan(0);
    });
  });

  describe('High Frequency Event Handling', () => {
    it('should handle rapid badge minting events', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onBadgeMint(handler);

      const batchCount = 10;
      const eventsPerBatch = 20;

      for (let batch = 0; batch < batchCount; batch++) {
        const events = Array.from({ length: eventsPerBatch }, (_, i) =>
          MockChainhookEventFactory.createBadgeMintEvent({
            badgeId: `badge-${batch}-${i}`
          })
        );

        for (const event of events) {
          await eventRegistry.dispatch('badge-mint', event);
        }
      }

      expect(handler).toHaveBeenCalledTimes(batchCount * eventsPerBatch);
    });
  });

  describe('Multi-Predicate Matching', () => {
    it('should evaluate events against multiple predicates correctly', () => {
      const highValuePredicate = new PredicateBuilder()
        .withId('high-value')
        .withEventType(EventType.TX)
        .withMinAmount(BigInt(1000000))
        .build();

      const specificSenderPredicate = new PredicateBuilder()
        .withId('from-issuer')
        .withEventType(EventType.TX)
        .withSender('ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG')
        .build();

      const lowValueEvent = MockChainhookEventFactory.createSTXTransferEvent({
        amount: BigInt(100000)
      });

      const highValueEvent = MockChainhookEventFactory.createSTXTransferEvent({
        amount: BigInt(5000000),
        sender: 'ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG'
      });

      const predicates = [highValuePredicate, specificSenderPredicate];

      const lowValueResults = predicateEvaluator.evaluateEvents([lowValueEvent], predicates);
      const highValueResults = predicateEvaluator.evaluateEvents([highValueEvent], predicates);

      expect(lowValueResults.length).toBe(1); // Only sender match
      expect(highValueResults.length).toBe(2); // Both match
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should continue processing after handler failures', async () => {
      const failingHandler = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(undefined);

      const successHandler = jest.fn().mockResolvedValue(undefined);

      new EventHandlerBuilder(eventRegistry)
        .onBadgeMint(failingHandler)
        .onBadgeMint(successHandler);

      const event1 = MockChainhookEventFactory.createBadgeMintEvent();
      const event2 = MockChainhookEventFactory.createBadgeMintEvent();

      const response1 = await eventRegistry.dispatch('badge-mint', event1);
      const response2 = await eventRegistry.dispatch('badge-mint', event2);

      // Both dispatches should complete
      expect(response1.success).toBe(true);
      expect(response2.success).toBe(true);

      // One handler fails, other succeeds
      expect(response1.actions.some(a => a.status === 'failed')).toBe(true);
      expect(response1.actions.some(a => a.status === 'success')).toBe(true);
    });

    it('should handle and recover from reorg during active event processing', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      new EventHandlerBuilder(eventRegistry).onBadgeMint(handler);

      // Start processing events
      const event1 = MockChainhookEventFactory.createBadgeMintEvent({ txHash: 'tx-1' });
      await eventRegistry.dispatch('badge-mint', event1);

      // Reorg occurs affecting this transaction
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        affectedTransactions: ['tx-1'],
        blockHeight: 100005
      });
      await reorgHandler.handleReorg(reorgEvent);

      // Try to process the affected event again
      const result = await eventProcessor.processEvent(event1, async () => {
        await eventRegistry.dispatch('badge-mint', event1);
      });

      expect(result.processed).toBe(false);
      expect(result.reason).toContain('reorganization');
    });
  });

  describe('Data Integrity Verification', () => {
    it('should verify data integrity after reorg recovery', async () => {
      // Create reorg scenario
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        blockHeight: 100010,
        affectedTransactions: ['tx-1', 'tx-2', 'tx-3']
      });
      await reorgHandler.handleReorg(reorgEvent);

      // Get recovery actions
      const recoveryActions = reorgHandler.getRecoveryActions();

      // Verify integrity flags
      expect(recoveryActions.verifyDataIntegrity).toBe(true);
      expect(recoveryActions.reprocessTransactions.length).toBeGreaterThan(0);

      // Simulate reprocessing
      const reprocessedEvents = Array.from(
        { length: recoveryActions.reprocessTransactions.length },
        (_, i) => MockChainhookEventFactory.createBadgeMintEvent({
          txHash: recoveryActions.reprocessTransactions[i]
        })
      );

      expect(reprocessedEvents.length).toBeGreaterThan(0);
    });
  });
});
