import { ChainhookEventObserver as HiroChainhookEventObserver, ServerOptions, ChainhookNodeOptions } from '@hirosystems/chainhook-client'
import express, { Express, Request, Response } from 'express'
import { createServer, Server as HTTPServer } from 'http'
import { EventEmitter } from 'events'
import ChainhookEventBatcher from './chainhookEventBatcher'
import ChainhookPerformanceProfiler from './chainhookPerformanceProfiler'

interface ChainhookObserverConfig {
  serverHost: string
  serverPort: number
  nodeUrl: string
  nodeApiKey?: string
  network: 'mainnet' | 'testnet' | 'devnet'
  startBlock?: number
  maxBatchSize?: number
}

interface ChainhookEvent {
  type: string
  block_identifier: {
    index: number
    hash: string
  }
  parent_block_identifier: {
    index: number
    hash: string
  }
  transactions?: any[]
  timestamp: number
}

export class ChainhookEventObserverService extends EventEmitter {
  private observer: HiroChainhookEventObserver | null = null
  private config: ChainhookObserverConfig
  private app: Express | null = null
  private server: HTTPServer | null = null
  private isRunning = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventQueue: ChainhookEvent[] = []
  private isProcessingQueue = false
  private batcher: ChainhookEventBatcher
  private profiler: ChainhookPerformanceProfiler
  private logger: any

  constructor(config: ChainhookObserverConfig, logger?: any) {
    super()
    this.config = config
    this.logger = logger || this.getDefaultLogger()
    this.batcher = new ChainhookEventBatcher({ batchSize: 50, batchTimeoutMs: 1000 }, this.logger)
    this.profiler = new ChainhookPerformanceProfiler(this.logger)
    this.setupBatchCallback()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    }
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing ChainhookEventObserver...')

      const serverOptions: ServerOptions = {
        host: this.config.serverHost,
        port: this.config.serverPort,
        auth_token: this.generateAuthToken()
      }

      const nodeOptions: ChainhookNodeOptions = {
        network: this.config.network,
        ingestion_port: 20456
      }

      this.observer = new HiroChainhookEventObserver(serverOptions, nodeOptions)

      this.logger.info('ChainhookEventObserver created successfully')
    } catch (error) {
      this.logger.error('Failed to initialize ChainhookEventObserver:', error)
      throw error
    }
  }

  async start(): Promise<void> {
    try {
      this.logger.info('Starting ChainhookEventObserver service...')

      if (!this.observer) {
        await this.initialize()
      }

      this.setupLocalServer()
      await this.startLocalServer()
      this.startProcessingQueue()

      this.isRunning = true
      this.reconnectAttempts = 0

      this.logger.info('ChainhookEventObserver service started successfully')
      this.emit('started')
    } catch (error) {
      this.logger.error('Failed to start ChainhookEventObserver:', error)
      await this.handleConnectionError(error)
    }
  }

  private setupLocalServer(): void {
    this.app = express()

    this.app.use(express.json())

    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: this.isRunning ? 'healthy' : 'unhealthy',
        running: this.isRunning,
        timestamp: new Date().toISOString()
      })
    })

    this.app.post('/events', (req: Request, res: Response) => {
      try {
        const event = req.body
        this.logger.debug('Received Chainhook event:', event.block_identifier)

        this.validateEvent(event)
        this.batcher.addEvent(event)

        res.status(200).json({ success: true, message: 'Event queued' })
        this.emit('event:received', event)
      } catch (error) {
        this.logger.error('Error processing event:', error)
        res.status(400).json({ error: 'Invalid event' })
      }
    })

    this.app.get('/status', (req: Request, res: Response) => {
      res.json({
        running: this.isRunning,
        queueSize: this.eventQueue.length,
        reconnectAttempts: this.reconnectAttempts,
        config: {
          serverHost: this.config.serverHost,
          serverPort: this.config.serverPort,
          network: this.config.network
        }
      })
    })

    this.logger.info('Local server configured')
  }

  private async startLocalServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.app) {
        reject(new Error('Express app not initialized'))
        return
      }

      this.server = createServer(this.app)

      this.server.listen(this.config.serverPort, this.config.serverHost, () => {
        this.logger.info(`Chainhook event server listening on ${this.config.serverHost}:${this.config.serverPort}`)
        resolve()
      })

      this.server.on('error', (error) => {
        this.logger.error('Server error:', error)
        reject(error)
      })
    })
  }

  private setupBatchCallback(): void {
    this.batcher.registerBatchCallback(async (batch: any[]) => {
      this.profiler.startMeasurement('processBatch')

      try {
        for (const event of batch) {
          this.emit('event:process', event)
          this.profiler.recordEventProcessed('batched-event')
        }

        this.logger.debug(`Processed batch of ${batch.length} events`)
      } catch (error) {
        this.logger.error('Error processing batch:', error)
      } finally {
        this.profiler.endMeasurement('processBatch')
      }
    })
  }

  private startProcessingQueue(): void {
    setInterval(() => {
      if (!this.isProcessingQueue && this.eventQueue.length > 0) {
        this.processEventQueue()
      }
    }, 100)
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessingQueue || this.eventQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()
        if (event) {
          this.logger.debug('Processing queued event:', event.block_identifier)
          this.emit('event:process', event)
        }
      }
    } catch (error) {
      this.logger.error('Error processing event queue:', error)
    } finally {
      this.isProcessingQueue = false
    }
  }

  private validateEvent(event: any): void {
    if (!event.block_identifier || !event.block_identifier.index) {
      throw new Error('Invalid event structure: missing block_identifier')
    }

    if (!event.block_identifier.hash) {
      throw new Error('Invalid event structure: missing block hash')
    }

    if (typeof event.block_identifier.index !== 'number') {
      throw new Error('Invalid event structure: block_identifier.index must be a number')
    }
  }

  private async handleConnectionError(error: any): Promise<void> {
    this.isRunning = false

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

      this.logger.warn(
        `Connection error. Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
      )

      this.emit('reconnect:attempt', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        delay
      })

      setTimeout(() => {
        this.start().catch((err) => {
          this.logger.error('Reconnection failed:', err)
        })
      }, delay)
    } else {
      this.logger.error('Max reconnection attempts reached. Service will not auto-reconnect.')
      this.emit('reconnect:failed', {
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      })
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping ChainhookEventObserver service...')

      this.isRunning = false

      await this.batcher.flush()
      this.batcher.destroy()

      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server!.close(() => {
            this.logger.info('Local server closed')
            resolve()
          })
        })
      }

      this.logger.info('ChainhookEventObserver service stopped')
      this.emit('stopped')
    } catch (error) {
      this.logger.error('Error stopping ChainhookEventObserver:', error)
      throw error
    }
  }

  registerPredicate(predicateName: string, predicateConfig: any): void {
    try {
      this.logger.info(`Registering predicate: ${predicateName}`)
      this.emit('predicate:registered', {
        name: predicateName,
        config: predicateConfig,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      this.logger.error(`Error registering predicate ${predicateName}:`, error)
      throw error
    }
  }

  unregisterPredicate(predicateName: string): void {
    try {
      this.logger.info(`Unregistering predicate: ${predicateName}`)
      this.emit('predicate:unregistered', {
        name: predicateName,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      this.logger.error(`Error unregistering predicate ${predicateName}:`, error)
      throw error
    }
  }

  getStatus(): {
    running: boolean
    queueSize: number
    reconnectAttempts: number
    config: Partial<ChainhookObserverConfig>
  } {
    return {
      running: this.isRunning,
      queueSize: this.eventQueue.length,
      reconnectAttempts: this.reconnectAttempts,
      config: {
        serverHost: this.config.serverHost,
        serverPort: this.config.serverPort,
        network: this.config.network
      }
    }
  }

  isHealthy(): boolean {
    return this.isRunning && this.server?.listening === true
  }

  getEventQueueSize(): number {
    return this.eventQueue.length
  }

  clearEventQueue(): void {
    this.logger.warn('Clearing event queue')
    this.eventQueue = []
  }

  getBatcherMetrics(): any {
    return this.batcher.getMetrics()
  }

  getProfilerMetrics(): any {
    return this.profiler.getAllMetrics()
  }

  getPerformanceSnapshot(): any {
    return this.profiler.getSnapshot()
  }

  printPerformanceReport(): void {
    this.profiler.printReport()
  }

  private generateAuthToken(): string {
    return process.env.CHAINHOOK_AUTH_TOKEN || 'default-auth-token'
  }
}

export default ChainhookEventObserverService
