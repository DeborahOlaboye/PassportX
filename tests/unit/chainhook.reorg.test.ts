// Unit tests for reorg handling
import { describe, it, expect, beforeEach } from '@jest/globals';
import { ReorgHandler, ReorgAwareEventProcessor } from '../src/utils/reorgHandler';
import { MockChainhookEventFactory } from '../src/utils/mockChainhookEvents';

describe('Reorg Handling', () => {
  let reorgHandler: ReorgHandler;

  beforeEach(() => {
    reorgHandler = new ReorgHandler();
  });

  describe('ReorgHandler.handleReorg', () => {
    it('should track reorg event', async () => {
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        reorgDepth: 3,
        commonAncestorHeight: 99997
      });

      const state = await reorgHandler.handleReorg(reorgEvent);

      expect(state.reorgHeight).toBe(reorgEvent.blockHeight);
      expect(state.commonAncestorHeight).toBe(99997);
      expect(state.affectedTransactions.size).toBeGreaterThan(0);
    });

    it('should maintain reorg history', async () => {
      const reorg1 = MockChainhookEventFactory.createReorgEvent();
      const reorg2 = MockChainhookEventFactory.createReorgEvent();

      await reorgHandler.handleReorg(reorg1);
      await reorgHandler.handleReorg(reorg2);

      const history = reorgHandler.getHistory();
      expect(history.length).toBe(2);
    });

    it('should limit reorg history to recent entries', async () => {
      // Create 15 reorgs (history limit is 10)
      for (let i = 0; i < 15; i++) {
        const reorgEvent = MockChainhookEventFactory.createReorgEvent();
        await reorgHandler.handleReorg(reorgEvent);
      }

      const history = reorgHandler.getHistory();
      expect(history.length).toBeLessThanOrEqual(10);
    });
  });

  describe('ReorgHandler.isTransactionAffected', () => {
    it('should identify affected transactions', async () => {
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        affectedTransactions: ['tx-1', 'tx-2', 'tx-3']
      });

      await reorgHandler.handleReorg(reorgEvent);

      expect(reorgHandler.isTransactionAffected('tx-1')).toBe(true);
      expect(reorgHandler.isTransactionAffected('tx-2')).toBe(true);
      expect(reorgHandler.isTransactionAffected('tx-unaffected')).toBe(false);
    });
  });

  describe('ReorgHandler.isBlockRemoved', () => {
    it('should identify removed blocks', async () => {
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        removedBlockHashes: ['block-1', 'block-2']
      });

      await reorgHandler.handleReorg(reorgEvent);

      expect(reorgHandler.isBlockRemoved('block-1')).toBe(true);
      expect(reorgHandler.isBlockRemoved('block-2')).toBe(true);
      expect(reorgHandler.isBlockRemoved('block-safe')).toBe(false);
    });
  });

  describe('ReorgHandler.getCurrentReorgDepth', () => {
    it('should return 0 when no reorg occurred', () => {
      expect(reorgHandler.getCurrentReorgDepth()).toBe(0);
    });

    it('should calculate reorg depth correctly', async () => {
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        blockHeight: 100000,
        commonAncestorHeight: 99995
      });

      await reorgHandler.handleReorg(reorgEvent);

      expect(reorgHandler.getCurrentReorgDepth()).toBe(5);
    });

    it('should return latest reorg depth', async () => {
      const reorg1 = MockChainhookEventFactory.createReorgEvent({
        blockHeight: 100000,
        commonAncestorHeight: 99998
      });
      const reorg2 = MockChainhookEventFactory.createReorgEvent({
        blockHeight: 100010,
        commonAncestorHeight: 100005
      });

      await reorgHandler.handleReorg(reorg1);
      await reorgHandler.handleReorg(reorg2);

      expect(reorgHandler.getCurrentReorgDepth()).toBe(5);
    });
  });

  describe('ReorgHandler.isReorgWithinDepth', () => {
    it('should check if reorg is within acceptable depth', async () => {
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        blockHeight: 100000,
        commonAncestorHeight: 99990
      });

      await reorgHandler.handleReorg(reorgEvent);

      expect(reorgHandler.isReorgWithinDepth(100)).toBe(true);
      expect(reorgHandler.isReorgWithinDepth(5)).toBe(false);
    });
  });

  describe('ReorgHandler.onAffectedTransactions', () => {
    it('should call callback for affected transactions', async () => {
      const callback = jest.fn().mockResolvedValue(undefined);
      reorgHandler.onAffectedTransactions(callback);

      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        affectedTransactions: ['tx-1', 'tx-2']
      });

      await reorgHandler.handleReorg(reorgEvent);

      expect(callback).toHaveBeenCalledWith(expect.arrayContaining(['tx-1', 'tx-2']));
    });

    it('should handle multiple callbacks', async () => {
      const callback1 = jest.fn().mockResolvedValue(undefined);
      const callback2 = jest.fn().mockResolvedValue(undefined);

      reorgHandler.onAffectedTransactions(callback1);
      reorgHandler.onAffectedTransactions(callback2);

      const reorgEvent = MockChainhookEventFactory.createReorgEvent();
      await reorgHandler.handleReorg(reorgEvent);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('ReorgHandler.getAffectedTransactionsSince', () => {
    it('should get affected transactions since height', async () => {
      const reorg1 = MockChainhookEventFactory.createReorgEvent({
        blockHeight: 100000,
        affectedTransactions: ['tx-1', 'tx-2']
      });
      const reorg2 = MockChainhookEventFactory.createReorgEvent({
        blockHeight: 100010,
        affectedTransactions: ['tx-3', 'tx-4']
      });

      await reorgHandler.handleReorg(reorg1);
      await reorgHandler.handleReorg(reorg2);

      const affected = reorgHandler.getAffectedTransactionsSince(100005);

      expect(affected).toContain('tx-3');
      expect(affected).toContain('tx-4');
    });
  });

  describe('ReorgHandler.getRecoveryActions', () => {
    it('should list recovery actions', async () => {
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        blockHeight: 100000,
        removedBlockHashes: ['block-1', 'block-2'],
        affectedTransactions: ['tx-1', 'tx-2', 'tx-3']
      });

      await reorgHandler.handleReorg(reorgEvent);

      const actions = reorgHandler.getRecoveryActions();

      expect(actions.reprocessBlocks).toContain('block-1');
      expect(actions.reprocessBlocks).toContain('block-2');
      expect(actions.reprocessTransactions.length).toBeGreaterThanOrEqual(3);
      expect(actions.verifyDataIntegrity).toBe(true);
    });

    it('should indicate no recovery needed when no reorg', () => {
      const actions = reorgHandler.getRecoveryActions();

      expect(actions.reprocessBlocks.length).toBe(0);
      expect(actions.reprocessTransactions.length).toBe(0);
      expect(actions.verifyDataIntegrity).toBe(false);
    });
  });

  describe('ReorgHandler.eventsOccurredBeforeReorg', () => {
    it('should verify events occurred before reorg', async () => {
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        blockHeight: 100000
      });

      await reorgHandler.handleReorg(reorgEvent);

      const events = MockChainhookEventFactory.createEventBatch(3);
      const result = reorgHandler.eventsOccurredBeforeReorg(events);

      // Events should be before reorg by height comparison
      expect(typeof result).toBe('boolean');
    });
  });

  describe('ReorgHandler.reset', () => {
    it('should clear reorg history', async () => {
      const reorgEvent = MockChainhookEventFactory.createReorgEvent();
      await reorgHandler.handleReorg(reorgEvent);

      expect(reorgHandler.getHistory().length).toBe(1);

      reorgHandler.reset();

      expect(reorgHandler.getHistory().length).toBe(0);
      expect(reorgHandler.getCurrentReorgDepth()).toBe(0);
    });
  });
});

describe('ReorgAwareEventProcessor', () => {
  let reorgHandler: ReorgHandler;
  let processor: ReorgAwareEventProcessor;

  beforeEach(() => {
    reorgHandler = new ReorgHandler();
    processor = new ReorgAwareEventProcessor(reorgHandler);
  });

  describe('ReorgAwareEventProcessor.processEvent', () => {
    it('should process event when not affected by reorg', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const event = MockChainhookEventFactory.createSTXTransferEvent();

      const result = await processor.processEvent(event, handler);

      expect(result.processed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should skip event affected by reorg', async () => {
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        affectedTransactions: ['tx-affected']
      });
      await reorgHandler.handleReorg(reorgEvent);

      const handler = jest.fn().mockResolvedValue(undefined);
      const event = MockChainhookEventFactory.createSTXTransferEvent({
        txHash: 'tx-affected'
      });

      const result = await processor.processEvent(event, handler);

      expect(result.processed).toBe(false);
      expect(result.reason).toContain('reorganization');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle processor errors', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Process failed'));
      const event = MockChainhookEventFactory.createSTXTransferEvent();

      const result = await processor.processEvent(event, handler);

      expect(result.processed).toBe(false);
      expect(result.reason).toBe('Process failed');
    });
  });

  describe('ReorgAwareEventProcessor.processEvents', () => {
    it('should process multiple events', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const events = MockChainhookEventFactory.createEventBatch(3);

      const results = await processor.processEvents(events, handler);

      expect(results.size).toBe(3);
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should skip affected events in batch', async () => {
      const reorgEvent = MockChainhookEventFactory.createReorgEvent({
        affectedTransactions: ['tx-affected']
      });
      await reorgHandler.handleReorg(reorgEvent);

      const handler = jest.fn().mockResolvedValue(undefined);
      const events = [
        MockChainhookEventFactory.createSTXTransferEvent({ txHash: 'tx-affected' }),
        MockChainhookEventFactory.createSTXTransferEvent({ txHash: 'tx-safe' })
      ];

      const results = await processor.processEvents(events, handler);

      expect(Array.from(results.values()).some(r => r.processed)).toBe(true);
      expect(Array.from(results.values()).some(r => !r.processed)).toBe(true);
    });
  });
});
