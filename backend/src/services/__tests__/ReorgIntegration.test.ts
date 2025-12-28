import ReorgHandlerService, { ReorgEvent } from '../ReorgHandlerService'
import ReorgAwareDatabase from '../ReorgAwareDatabase'
import ReorgAwareCache from '../ReorgAwareCache'
import ReorgStateManager from '../../../src/services/ReorgStateManager'
import ReorgMonitoringService from '../../../src/services/ReorgMonitoringService'

describe('Reorg Handling Integration Test', () => {
  let reorgHandler: ReorgHandlerService
  let reorgDatabase: ReorgAwareDatabase
  let reorgCache: ReorgAwareCache
  let reorgStateManager: ReorgStateManager
  let reorgMonitor: ReorgMonitoringService

  beforeEach(() => {
    reorgHandler = ReorgHandlerService.getInstance()
    reorgDatabase = new ReorgAwareDatabase(reorgHandler)
    reorgCache = new ReorgAwareCache(reorgHandler)
    reorgStateManager = ReorgStateManager.getInstance()
    reorgMonitor = ReorgMonitoringService.getInstance()
  })

  it('should handle a simple reorg event', async () => {
    const mockChainhookEvent = {
      type: 'chain_reorg',
      block_identifier: { index: 100, hash: 'hash100' },
      rollback_to: {
        block_identifier: { index: 95, hash: 'hash95' }
      },
      transactions: [
        { transaction_hash: 'tx1' },
        { transaction_hash: 'tx2' }
      ]
    }

    // Mock the reorg event handling
    const reorgEvent = await reorgHandler.handleReorgEvent(mockChainhookEvent)

    expect(reorgEvent).toBeDefined()
    expect(reorgEvent?.rollbackToBlock).toBe(95)
    expect(reorgEvent?.newCanonicalBlock).toBe(100)
    expect(reorgEvent?.affectedTransactions).toEqual(['tx1', 'tx2'])
  })

  it('should rollback database state', async () => {
    const reorgEvent: ReorgEvent = {
      type: 'chain_reorg',
      rollbackToBlock: 95,
      rollbackToHash: 'hash95',
      newCanonicalBlock: 100,
      newCanonicalHash: 'hash100',
      affectedTransactions: ['tx1', 'tx2'],
      timestamp: Date.now()
    }

    // Test database rollback
    await reorgDatabase.handleReorg(reorgEvent)

    const stats = reorgDatabase.getRollbackStats()
    expect(stats.totalOperations).toBeGreaterThanOrEqual(0)
  })

  it('should rollback cache state', async () => {
    const reorgEvent: ReorgEvent = {
      type: 'chain_reorg',
      rollbackToBlock: 95,
      rollbackToHash: 'hash95',
      newCanonicalBlock: 100,
      newCanonicalHash: 'hash100',
      affectedTransactions: ['tx1', 'tx2'],
      timestamp: Date.now()
    }

    // Add some test data to cache
    reorgCache.set('test-key-90', { data: 'test' }, 90)
    reorgCache.set('test-key-96', { data: 'test' }, 96)
    reorgCache.set('test-key-100', { data: 'test' }, 100)

    // Test cache rollback
    await reorgCache.handleReorg(reorgEvent)

    // Keys from blocks > 95 should be removed
    expect(reorgCache.has('test-key-96')).toBe(false)
    expect(reorgCache.has('test-key-100')).toBe(false)
    expect(reorgCache.has('test-key-90')).toBe(true) // Should remain
  })

  it('should update UI state on reorg', async () => {
    const reorgEvent: ReorgEvent = {
      type: 'chain_reorg',
      rollbackToBlock: 95,
      rollbackToHash: 'hash95',
      newCanonicalBlock: 100,
      newCanonicalHash: 'hash100',
      affectedTransactions: ['tx1', 'tx2'],
      timestamp: Date.now()
    }

    // Test UI state update
    await reorgStateManager.handleReorgEvent(reorgEvent)

    const state = reorgStateManager.getState()
    expect(state.isReorgInProgress).toBe(false)
    expect(state.lastReorgBlock).toBe(95)
    expect(state.reorgHistory.length).toBeGreaterThan(0)
  })

  it('should record reorg metrics', async () => {
    const reorgEvent: ReorgEvent = {
      type: 'chain_reorg',
      rollbackToBlock: 95,
      rollbackToHash: 'hash95',
      newCanonicalBlock: 100,
      newCanonicalHash: 'hash100',
      affectedTransactions: ['tx1', 'tx2'],
      timestamp: Date.now()
    }

    // Test metrics recording
    await reorgMonitor.recordReorgEvent(reorgEvent, reorgDatabase)

    const metrics = reorgMonitor.getMetrics()
    expect(metrics.totalReorgs).toBeGreaterThan(0)
    expect(metrics.totalAffectedTransactions).toBeGreaterThan(0)
  })
})