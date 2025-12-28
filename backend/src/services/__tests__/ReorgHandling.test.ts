import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import ReorgHandlerService, { ReorgEvent } from '../ReorgHandlerService'
import ReorgAwareDatabase from '../ReorgAwareDatabase'
import ReorgAwareCache from '../ReorgAwareCache'
import ReorgMonitoringService from '../../../src/services/ReorgMonitoringService'
import { ChainhookEventProcessor } from '../chainhookEventProcessor'

describe('Reorg Handling Integration Tests', () => {
  let reorgHandler: ReorgHandlerService
  let reorgDatabase: ReorgAwareDatabase
  let reorgCache: ReorgAwareCache
  let reorgMonitor: ReorgMonitoringService
  let eventProcessor: ChainhookEventProcessor
  let logger: any

  beforeEach(() => {
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    reorgHandler = ReorgHandlerService.getInstance(logger)
    reorgDatabase = new ReorgAwareDatabase(reorgHandler, logger)
    reorgCache = new ReorgAwareCache({ maxSize: 1000, ttlMs: 300000 }, logger)
    reorgMonitor = ReorgMonitoringService.getInstance(logger)
    eventProcessor = new ChainhookEventProcessor(logger)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('ReorgHandlerService', () => {
    it('should detect reorg events correctly', async () => {
      const reorgChainhookEvent = {
        type: 'chain_reorg',
        rollback_to: {
          block_identifier: { index: 100, hash: 'old_hash' }
        },
        new_block: {
          block_identifier: { index: 105, hash: 'new_hash' }
        },
        affected_transactions: ['tx1', 'tx2', 'tx3']
      }

      const reorgEvent = await reorgHandler.handleReorgEvent(reorgChainhookEvent)

      expect(reorgEvent).toBeDefined()
      expect(reorgEvent?.rollbackToBlock).toBe(100)
      expect(reorgEvent?.newCanonicalBlock).toBe(105)
      expect(reorgEvent?.affectedTransactions).toEqual(['tx1', 'tx2', 'tx3'])
    })

    it('should return null for non-reorg events', async () => {
      const normalEvent = {
        type: 'block',
        block_identifier: { index: 101, hash: 'hash' },
        transactions: []
      }

      const result = await reorgHandler.handleReorgEvent(normalEvent)

      expect(result).toBeNull()
    })

    it('should track rollback operations', () => {
      reorgHandler.recordRollbackOperation('tx1', 100, 'create', 'Badge', 'badge123')
      reorgHandler.recordRollbackOperation('tx2', 101, 'update', 'User', 'user456')

      const operations = reorgHandler.getRollbackOperations()
      expect(operations.length).toBe(2)
      expect(operations[0].transactionHash).toBe('tx1')
      expect(operations[1].operation.modelName).toBe('User')
    })
  })

  describe('ReorgAwareDatabase', () => {
    let mockModel: any

    beforeEach(() => {
      mockModel = {
        create: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
        findOne: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn()
      }
    })

    it('should save documents with reorg awareness', async () => {
      const document = { name: 'Test Badge', category: 1 }
      const savedDoc = { _id: 'badge123', ...document, blockHeight: 100, transactionHash: 'tx1' }

      mockModel.create.mockResolvedValue(savedDoc)

      const result = await reorgDatabase.saveWithReorgAwareness(
        mockModel,
        document,
        100,
        'tx1'
      )

      expect(result).toEqual(savedDoc)
      expect(mockModel.create).toHaveBeenCalledWith({
        ...document,
        blockHeight: 100,
        transactionHash: 'tx1',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    })

    it('should handle reorg rollback correctly', async () => {
      // Setup initial operations
      mockModel.create.mockResolvedValue({ _id: 'badge123' })
      mockModel.findOneAndDelete.mockResolvedValue({ _id: 'badge123' })

      // Create a document
      await reorgDatabase.saveWithReorgAwareness(mockModel, { name: 'Test' }, 105, 'tx1')

      // Simulate reorg
      const reorgEvent: ReorgEvent = {
        type: 'chain_reorg',
        rollbackToBlock: 100,
        rollbackToHash: 'old_hash',
        newCanonicalBlock: 104,
        newCanonicalHash: 'new_hash',
        affectedTransactions: ['tx1'],
        timestamp: Date.now()
      }

      await reorgDatabase.handleReorg(reorgEvent)

      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('badge123')
    })

    it('should provide rollback statistics', () => {
      const stats = reorgDatabase.getRollbackStats()
      expect(stats).toHaveProperty('totalOperations')
      expect(stats).toHaveProperty('operationsByBlock')
    })
  })

  describe('ReorgAwareCache', () => {
    it('should invalidate cache entries during reorg', async () => {
      // Set some cache entries
      reorgCache.set('key1', 'value1', 105)
      reorgCache.set('key2', 'value2', 106)
      reorgCache.set('key3', 'value3', 107)

      const reorgEvent: ReorgEvent = {
        type: 'chain_reorg',
        rollbackToBlock: 105,
        rollbackToHash: 'old_hash',
        newCanonicalBlock: 106,
        newCanonicalHash: 'new_hash',
        affectedTransactions: [],
        timestamp: Date.now()
      }

      await reorgCache.handleReorg(reorgEvent)

      // key1 should be invalidated (blockHeight 105 <= rollbackToBlock 105)
      expect(reorgCache.get('key1')).toBeUndefined()
      // key2 and key3 should remain (blockHeight > rollbackToBlock)
      expect(reorgCache.get('key2')).toBe('value2')
      expect(reorgCache.get('key3')).toBe('value3')
    })

    it('should track cache invalidation metrics', () => {
      const metrics = reorgCache.getInvalidationMetrics()
      expect(metrics).toHaveProperty('totalInvalidations')
      expect(metrics).toHaveProperty('invalidationsByBlock')
    })
  })

  describe('ReorgMonitoringService', () => {
    it('should record reorg events and update metrics', async () => {
      const reorgEvent: ReorgEvent = {
        type: 'chain_reorg',
        rollbackToBlock: 100,
        rollbackToHash: 'old_hash',
        newCanonicalBlock: 110,
        newCanonicalHash: 'new_hash',
        affectedTransactions: ['tx1', 'tx2'],
        timestamp: Date.now()
      }

      await reorgMonitor.recordReorgEvent(reorgEvent, reorgDatabase)

      const metrics = reorgMonitor.getMetrics()
      expect(metrics.totalReorgs).toBeGreaterThan(0)
      expect(metrics.maxRollbackDepth).toBe(10)
      expect(metrics.totalAffectedTransactions).toBe(2)
    })

    it('should generate alerts for critical reorgs', async () => {
      const deepReorgEvent: ReorgEvent = {
        type: 'chain_reorg',
        rollbackToBlock: 50,
        rollbackToHash: 'old_hash',
        newCanonicalBlock: 120,
        newCanonicalHash: 'new_hash',
        affectedTransactions: Array.from({ length: 200 }, (_, i) => `tx${i}`),
        timestamp: Date.now()
      }

      await reorgMonitor.recordReorgEvent(deepReorgEvent)

      const alerts = reorgMonitor.getRecentAlerts()
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts.some(alert => alert.type === 'deep_reorg')).toBe(true)
      expect(alerts.some(alert => alert.type === 'large_impact')).toBe(true)
    })

    it('should generate monitoring reports', () => {
      const report = reorgMonitor.generateReport()
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('alerts')
      expect(report).toHaveProperty('trends')
      expect(report).toHaveProperty('recommendations')
    })
  })

  describe('ChainhookEventProcessor Integration', () => {
    it('should handle reorg events in event processing', async () => {
      const reorgChainhookEvent = {
        type: 'chain_reorg',
        rollback_to: {
          block_identifier: { index: 100, hash: 'old_hash' }
        },
        new_block: {
          block_identifier: { index: 105, hash: 'new_hash' }
        },
        affected_transactions: ['tx1', 'tx2']
      }

      const result = await eventProcessor.processEvent(reorgChainhookEvent)

      expect(result).toBeDefined()
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Database rollback and monitoring completed'),
        expect.any(Object)
      )
    })

    it('should process normal events without reorg handling', async () => {
      const normalEvent = {
        block_identifier: { index: 101, hash: 'hash' },
        transactions: []
      }

      const result = await eventProcessor.processEvent(normalEvent)

      expect(result).toBeDefined()
      expect(result.length).toBe(0) // No transactions to process
    })
  })

  describe('End-to-End Reorg Scenario', () => {
    it('should handle complete reorg workflow', async () => {
      // 1. Simulate normal operations
      mockModel.create.mockResolvedValue({ _id: 'badge1', name: 'Badge 1' })
      await reorgDatabase.saveWithReorgAwareness(mockModel, { name: 'Badge 1' }, 105, 'tx1')

      mockModel.create.mockResolvedValue({ _id: 'badge2', name: 'Badge 2' })
      await reorgDatabase.saveWithReorgAwareness(mockModel, { name: 'Badge 2' }, 106, 'tx2')

      // 2. Set cache entries
      reorgCache.set('badge1', { name: 'Badge 1' }, 105)
      reorgCache.set('badge2', { name: 'Badge 2' }, 106)

      // 3. Simulate reorg event
      const reorgEvent: ReorgEvent = {
        type: 'chain_reorg',
        rollbackToBlock: 105,
        rollbackToHash: 'old_hash',
        newCanonicalBlock: 107,
        newCanonicalHash: 'new_hash',
        affectedTransactions: ['tx1'],
        timestamp: Date.now()
      }

      // 4. Process reorg through event processor
      const reorgChainhookEvent = {
        type: 'chain_reorg',
        rollback_to: {
          block_identifier: { index: 105, hash: 'old_hash' }
        },
        new_block: {
          block_identifier: { index: 107, hash: 'new_hash' }
        },
        affected_transactions: ['tx1']
      }

      await eventProcessor.processEvent(reorgChainhookEvent)

      // 5. Verify database rollback occurred
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('badge1')

      // 6. Verify cache invalidation occurred
      expect(reorgCache.get('badge1')).toBeUndefined()
      expect(reorgCache.get('badge2')).toBeDefined() // Should still exist

      // 7. Verify monitoring recorded the event
      const metrics = reorgMonitor.getMetrics()
      expect(metrics.totalReorgs).toBeGreaterThan(0)
    })
  })
})