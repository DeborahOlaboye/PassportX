export interface OperationFilter {
  type?: string
  contractAddress?: string
  method?: string
}

export interface RouteMetrics {
  totalOperations: number
  routed: number
  filtered: number
  averageRoutingTime: number
}

export type OperationHandler = (operation: any, context: any) => boolean | Promise<boolean>

export class ChainhookOperationRouter {
  private routes: Map<string, OperationHandler> = new Map()
  private defaultRoute: OperationHandler | null = null
  private operationFilters: Map<string, OperationFilter> = new Map()
  private routingTimings: number[] = []
  private readonly MAX_TIMING_SAMPLES = 1000
  private metrics: RouteMetrics = {
    totalOperations: 0,
    routed: 0,
    filtered: 0,
    averageRoutingTime: 0
  }
  private logger: any

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[OperationRouter] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[OperationRouter] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[OperationRouter] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[OperationRouter] ${msg}`, ...args)
    }
  }

  registerRoute(key: string, handler: OperationHandler, filter?: OperationFilter): void {
    this.routes.set(key, handler)
    if (filter) {
      this.operationFilters.set(key, filter)
    }
    this.logger.debug(`Route registered: ${key}`)
  }

  setDefaultRoute(handler: OperationHandler): void {
    this.defaultRoute = handler
    this.logger.debug('Default route set')
  }

  async routeOperation(operation: any, context: any = {}): Promise<boolean> {
    this.metrics.totalOperations++
    const startTime = performance.now()

    try {
      if (!operation || !operation.type) {
        this.logger.warn('Invalid operation: missing type')
        return false
      }

      for (const [key, handler] of this.routes.entries()) {
        const filter = this.operationFilters.get(key)

        if (this.matchesFilter(operation, filter)) {
          const result = await handler(operation, context)

          if (result) {
            this.metrics.routed++
            this.recordRoutingTiming(performance.now() - startTime)
            this.logger.debug(`Operation routed to: ${key}`)
            return true
          }
        } else {
          this.metrics.filtered++
        }
      }

      if (this.defaultRoute) {
        const result = await this.defaultRoute(operation, context)
        if (result) {
          this.metrics.routed++
        }
        this.recordRoutingTiming(performance.now() - startTime)
        return result
      }

      this.recordRoutingTiming(performance.now() - startTime)
      return false
    } catch (error) {
      this.logger.error('Error routing operation:', error)
      this.recordRoutingTiming(performance.now() - startTime)
      return false
    }
  }

  async routeOperationBatch(operations: any[], context: any = {}): Promise<number> {
    let routedCount = 0

    for (const operation of operations) {
      const routed = await this.routeOperation(operation, context)
      if (routed) {
        routedCount++
      }
    }

    this.logger.debug(`Batch: ${operations.length} operations → ${routedCount} routed`)
    return routedCount
  }

  private matchesFilter(operation: any, filter?: OperationFilter): boolean {
    if (!filter) return true

    if (filter.type && operation.type !== filter.type) {
      return false
    }

    if (filter.contractAddress && operation.contract_call?.contract !== filter.contractAddress) {
      return false
    }

    if (filter.method && operation.contract_call?.method !== filter.method) {
      return false
    }

    return true
  }

  private recordRoutingTiming(time: number): void {
    this.routingTimings.push(time)

    if (this.routingTimings.length > this.MAX_TIMING_SAMPLES) {
      this.routingTimings = this.routingTimings.slice(-this.MAX_TIMING_SAMPLES)
    }

    if (this.routingTimings.length > 0) {
      const sum = this.routingTimings.reduce((a, b) => a + b, 0)
      this.metrics.averageRoutingTime = sum / this.routingTimings.length
    }
  }

  getMetrics(): RouteMetrics {
    return {
      totalOperations: this.metrics.totalOperations,
      routed: this.metrics.routed,
      filtered: this.metrics.filtered,
      averageRoutingTime: parseFloat(this.metrics.averageRoutingTime.toFixed(4))
    }
  }

  getRouteCount(): number {
    return this.routes.size
  }

  removeRoute(key: string): boolean {
    const removed = this.routes.delete(key)
    this.operationFilters.delete(key)
    if (removed) {
      this.logger.debug(`Route removed: ${key}`)
    }
    return removed
  }

  clearRoutes(): void {
    this.routes.clear()
    this.operationFilters.clear()
    this.defaultRoute = null
    this.logger.warn('All routes cleared')
  }

  resetMetrics(): void {
    this.metrics = {
      totalOperations: 0,
      routed: 0,
      filtered: 0,
      averageRoutingTime: 0
    }
    this.routingTimings = []
    this.logger.info('Metrics reset')
  }

  destroy(): void {
    this.clearRoutes()
    this.logger.info('OperationRouter destroyed')
  }
}

export default ChainhookOperationRouter
