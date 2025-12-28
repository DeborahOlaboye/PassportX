import ChainhookEventObserverService, { ChainhookEventObserverService as ObserverService } from './chainhookEventObserver'
import ChainhookSubscriptionManager from './chainhookSubscriptionManager'
import ChainhookPredicateManager from './chainhookPredicateManager'
import ChainhookLogger, { LogLevel } from './chainhookLogger'
import ChainhookHealthCheck from './chainhookHealthCheck'

export interface ChainhookManagerConfig {
  serverHost: string
  serverPort: number
  nodeUrl: string
  nodeApiKey?: string
  network: 'mainnet' | 'testnet' | 'devnet'
  startBlock?: number
  maxBatchSize?: number
  logLevel?: LogLevel
  enableHealthChecks?: boolean
  healthCheckInterval?: number
}

export class ChainhookManager {
  private observer: ObserverService | null = null
  private subscriptionManager: ChainhookSubscriptionManager
  private predicateManager: ChainhookPredicateManager
  private logger: ChainhookLogger
  private healthCheck: ChainhookHealthCheck
  private config: ChainhookManagerConfig
  private isRunning = false

  constructor(config: ChainhookManagerConfig) {
    this.config = config
    this.logger = new ChainhookLogger(config.logLevel || LogLevel.INFO, true)
    this.subscriptionManager = new ChainhookSubscriptionManager(this.logger)
    this.predicateManager = new ChainhookPredicateManager(this.logger)
    this.healthCheck = new ChainhookHealthCheck(this.logger)
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing ChainhookManager...')

      this.observer = new ChainhookEventObserverService(
        {
          serverHost: this.config.serverHost,
          serverPort: this.config.serverPort,
          nodeUrl: this.config.nodeUrl,
          nodeApiKey: this.config.nodeApiKey,
          network: this.config.network,
          startBlock: this.config.startBlock,
          maxBatchSize: this.config.maxBatchSize
        },
        this.logger
      )

      this.setupObserverListeners()
      this.healthCheck.setObserverHealth(false)

      if (this.config.enableHealthChecks !== false) {
        this.healthCheck.startHealthChecks(this.config.healthCheckInterval || 30000)
      }

      this.logger.info('ChainhookManager initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize ChainhookManager', error as Error)
      throw error
    }
  }

  private setupObserverListeners(): void {
    if (!this.observer) return

    this.observer.on('started', () => {
      this.logger.info('ChainhookEventObserver started')
      this.healthCheck.setObserverHealth(true)
      this.isRunning = true
    })

    this.observer.on('stopped', () => {
      this.logger.info('ChainhookEventObserver stopped')
      this.healthCheck.setObserverHealth(false)
      this.isRunning = false
    })

    this.observer.on('event:received', (event: any) => {
      this.logger.debug('Event received', {
        blockIndex: event.block_identifier?.index,
        transactionCount: event.transactions?.length
      })
      this.healthCheck.recordEventProcessed()
      this.handleIncomingEvent(event)
    })

    this.observer.on('event:process', (event: any) => {
      this.logger.debug('Processing event', { blockIndex: event.block_identifier?.index })
    })

    this.observer.on('reconnect:attempt', (data: any) => {
      this.logger.warn('Attempting to reconnect', data)
    })

    this.observer.on('reconnect:failed', (data: any) => {
      this.logger.error('Reconnection failed after max attempts', data)
    })

    this.observer.on('predicate:registered', (data: any) => {
      this.logger.info('Predicate registered', { name: data.name })
    })

    this.observer.on('predicate:unregistered', (data: any) => {
      this.logger.info('Predicate unregistered', { name: data.name })
    })
  }

  private handleIncomingEvent(event: any): void {
    try {
      const eventType = this.extractEventType(event)

      if (eventType) {
        this.subscriptionManager.dispatchEventToAll(event, eventType).catch((error) => {
          this.logger.error('Error dispatching event to subscriptions', error as Error)
          this.healthCheck.recordError(error)
        })
      }
    } catch (error) {
      this.logger.error('Error handling incoming event', error as Error)
      this.healthCheck.recordError(error as Error)
    }
  }

  private extractEventType(event: any): string | null {
    if (event.transactions && event.transactions.length > 0) {
      const firstTx = event.transactions[0]

      if (firstTx.operations && firstTx.operations.length > 0) {
        const firstOp = firstTx.operations[0]

        if (firstOp.type === 'contract_call') {
          return 'stacks-contract-call'
        }
      }
    }

    return null
  }

  async start(): Promise<void> {
    try {
      this.logger.info('Starting ChainhookManager...')

      if (!this.observer) {
        await this.initialize()
      }

      await this.observer!.start()

      this.logger.info('ChainhookManager started successfully')
    } catch (error) {
      this.logger.error('Failed to start ChainhookManager', error as Error)
      throw error
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping ChainhookManager...')

      this.healthCheck.stopHealthChecks()

      if (this.observer) {
        await this.observer.stop()
      }

      this.logger.info('ChainhookManager stopped successfully')
    } catch (error) {
      this.logger.error('Failed to stop ChainhookManager', error as Error)
      throw error
    }
  }

  getObserver(): ObserverService | null {
    return this.observer
  }

  getSubscriptionManager(): ChainhookSubscriptionManager {
    return this.subscriptionManager
  }

  getPredicateManager(): ChainhookPredicateManager {
    return this.predicateManager
  }

  getLogger(): ChainhookLogger {
    return this.logger
  }

  getHealthCheck(): ChainhookHealthCheck {
    return this.healthCheck
  }

  getStatus(): any {
    return {
      running: this.isRunning,
      health: this.healthCheck.getStatus(),
      subscriptions: this.subscriptionManager.getStatistics(),
      predicates: this.predicateManager.getStatistics(),
      observer: this.observer ? this.observer.getStatus() : null
    }
  }

  isRunning(): boolean {
    return this.isRunning
  }
}

export default ChainhookManager
