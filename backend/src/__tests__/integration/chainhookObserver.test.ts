import ChainhookManager from '../../services/chainhookManager'
import { ChainhookEventObserverService } from '../../services/chainhookEventObserver'
import ChainhookSubscriptionManager from '../../services/chainhookSubscriptionManager'
import ChainhookPredicateManager from '../../services/chainhookPredicateManager'
import ChainhookLogger, { LogLevel } from '../../services/chainhookLogger'

describe('ChainhookEventObserver', () => {
  let manager: ChainhookManager
  let logger: ChainhookLogger

  beforeEach(() => {
    logger = new ChainhookLogger(LogLevel.DEBUG, false)
    manager = new ChainhookManager({
      serverHost: 'localhost',
      serverPort: 9000,
      nodeUrl: 'http://localhost:20456',
      network: 'devnet',
      logLevel: LogLevel.DEBUG,
      enableHealthChecks: false
    })
  })

  describe('Manager Initialization', () => {
    it('should initialize manager with configuration', async () => {
      await manager.initialize()

      expect(manager.getObserver()).toBeDefined()
      expect(manager.getSubscriptionManager()).toBeDefined()
      expect(manager.getPredicateManager()).toBeDefined()
      expect(manager.getLogger()).toBeDefined()
      expect(manager.getHealthCheck()).toBeDefined()
    })

    it('should have correct config values', async () => {
      await manager.initialize()

      const observer = manager.getObserver()
      expect(observer).toBeDefined()
    })
  })

  describe('Subscription Management', () => {
    beforeEach(async () => {
      await manager.initialize()
    })

    it('should create subscription', () => {
      const subscriptionManager = manager.getSubscriptionManager()
      const subscription = subscriptionManager.createSubscription(
        'Test Badge Mint',
        'badge-mint',
        { test: true }
      )

      expect(subscription).toBeDefined()
      expect(subscription.name).toBe('Test Badge Mint')
      expect(subscription.eventType).toBe('badge-mint')
      expect(subscription.active).toBe(true)
    })

    it('should get all subscriptions', () => {
      const subscriptionManager = manager.getSubscriptionManager()

      subscriptionManager.createSubscription('Sub 1', 'event-1', {})
      subscriptionManager.createSubscription('Sub 2', 'event-2', {})
      subscriptionManager.createSubscription('Sub 3', 'event-1', {})

      const subscriptions = subscriptionManager.getAllSubscriptions()

      expect(subscriptions).toHaveLength(3)
    })

    it('should filter subscriptions by event type', () => {
      const subscriptionManager = manager.getSubscriptionManager()

      subscriptionManager.createSubscription('Sub 1', 'badge-mint', {})
      subscriptionManager.createSubscription('Sub 2', 'badge-verify', {})
      subscriptionManager.createSubscription('Sub 3', 'badge-mint', {})

      const badgeMintSubs = subscriptionManager.getSubscriptionsByEventType('badge-mint')

      expect(badgeMintSubs).toHaveLength(2)
      expect(badgeMintSubs.every(s => s.eventType === 'badge-mint')).toBe(true)
    })

    it('should activate and deactivate subscriptions', () => {
      const subscriptionManager = manager.getSubscriptionManager()
      const subscription = subscriptionManager.createSubscription('Test', 'event-type', {})

      expect(subscription.active).toBe(true)

      subscriptionManager.deactivateSubscription(subscription.id)
      const deactivated = subscriptionManager.getSubscription(subscription.id)

      expect(deactivated?.active).toBe(false)

      subscriptionManager.activateSubscription(subscription.id)
      const reactivated = subscriptionManager.getSubscription(subscription.id)

      expect(reactivated?.active).toBe(true)
    })

    it('should delete subscription', () => {
      const subscriptionManager = manager.getSubscriptionManager()
      const subscription = subscriptionManager.createSubscription('Test', 'event-type', {})

      expect(subscriptionManager.getAllSubscriptions()).toHaveLength(1)

      subscriptionManager.deleteSubscription(subscription.id)

      expect(subscriptionManager.getAllSubscriptions()).toHaveLength(0)
    })
  })

  describe('Predicate Management', () => {
    beforeEach(async () => {
      await manager.initialize()
    })

    it('should create predicate', () => {
      const predicateManager = manager.getPredicateManager()

      const predicate = predicateManager.createPredicate(
        'Test Predicate',
        'stacks-contract-call',
        'devnet',
        { scope: 'contract_call' },
        { http_post: { url: 'http://localhost:9000/events' } }
      )

      expect(predicate).toBeDefined()
      expect(predicate.name).toBe('Test Predicate')
      expect(predicate.type).toBe('stacks-contract-call')
      expect(predicate.network).toBe('devnet')
    })

    it('should get all predicates', () => {
      const predicateManager = manager.getPredicateManager()

      predicateManager.createPredicate('P1', 'stacks-contract-call', 'devnet', {}, {})
      predicateManager.createPredicate('P2', 'stacks-block', 'devnet', {}, {})

      const predicates = predicateManager.getAllPredicates()

      expect(predicates).toHaveLength(2)
    })

    it('should filter predicates by network', () => {
      const predicateManager = manager.getPredicateManager()

      predicateManager.createPredicate('P1', 'stacks-contract-call', 'mainnet', {}, {})
      predicateManager.createPredicate('P2', 'stacks-block', 'testnet', {}, {})
      predicateManager.createPredicate('P3', 'stacks-contract-call', 'mainnet', {}, {})

      const mainnetPredicates = predicateManager.getPredicatesByNetwork('mainnet')

      expect(mainnetPredicates).toHaveLength(2)
      expect(mainnetPredicates.every(p => p.network === 'mainnet')).toBe(true)
    })

    it('should delete predicate', () => {
      const predicateManager = manager.getPredicateManager()

      const predicate = predicateManager.createPredicate(
        'Test',
        'stacks-contract-call',
        'devnet',
        {},
        {}
      )

      expect(predicateManager.getAllPredicates()).toHaveLength(1)

      predicateManager.deletePredicate(predicate.uuid)

      expect(predicateManager.getAllPredicates()).toHaveLength(0)
    })
  })

  describe('Health Checks', () => {
    beforeEach(async () => {
      await manager.initialize()
    })

    it('should track health status', () => {
      const healthCheck = manager.getHealthCheck()

      healthCheck.setObserverHealth(true)
      healthCheck.setServerHealth(true)

      const status = healthCheck.getStatus()

      expect(status.status).toBe('healthy')
      expect(status.checks.observer).toBe(true)
      expect(status.checks.server).toBe(true)
    })

    it('should calculate uptime', () => {
      const healthCheck = manager.getHealthCheck()

      const uptime = healthCheck.getUptime()

      expect(uptime).toBeGreaterThanOrEqual(0)
    })

    it('should track events processed', () => {
      const healthCheck = manager.getHealthCheck()

      healthCheck.recordEventProcessed()
      healthCheck.recordEventProcessed()

      expect(healthCheck.getTotalEventsProcessed()).toBe(2)
    })

    it('should track errors', () => {
      const healthCheck = manager.getHealthCheck()

      const error = new Error('Test error')
      healthCheck.recordError(error)

      expect(healthCheck.getTotalErrorsEncountered()).toBe(1)
      expect(healthCheck.getLastError()?.message).toBe('Test error')
    })
  })

  describe('Logging', () => {
    it('should log messages at different levels', () => {
      const logger = new ChainhookLogger(LogLevel.DEBUG, false)

      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message', new Error('Test error'))

      const logs = logger.getLogs()

      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some(log => log.message === 'Debug message')).toBe(true)
    })

    it('should maintain log statistics', () => {
      const logger = new ChainhookLogger(LogLevel.DEBUG, false)

      logger.debug('Debug 1')
      logger.info('Info 1')
      logger.warn('Warn 1')
      logger.error('Error 1', new Error('Test'))

      const stats = logger.getLogStatistics()

      expect(stats['DEBUG']).toBe(1)
      expect(stats['INFO']).toBe(1)
      expect(stats['WARN']).toBe(1)
      expect(stats['ERROR']).toBe(1)
    })
  })

  describe('Manager Status', () => {
    beforeEach(async () => {
      await manager.initialize()
    })

    it('should return comprehensive status', () => {
      const status = manager.getStatus()

      expect(status.running).toBeDefined()
      expect(status.health).toBeDefined()
      expect(status.subscriptions).toBeDefined()
      expect(status.predicates).toBeDefined()
    })

    it('should provide statistics', () => {
      const subscriptionManager = manager.getSubscriptionManager()

      subscriptionManager.createSubscription('Sub 1', 'event-1', {})
      subscriptionManager.createSubscription('Sub 2', 'event-2', {})

      const stats = subscriptionManager.getStatistics()

      expect(stats.totalSubscriptions).toBe(2)
      expect(stats.activeSubscriptions).toBe(2)
    })
  })
})
