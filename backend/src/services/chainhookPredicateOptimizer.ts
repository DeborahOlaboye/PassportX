export interface PredicateFilter {
  contractAddress?: string
  method?: string
  topic?: string
  minBlockHeight?: number
  maxBlockHeight?: number
  eventType?: string
}

export interface OptimizationMetrics {
  eventsReceived: number
  eventsFiltered: number
  filteringRate: number
  averageFilterTime: number
}

export class ChainhookPredicateOptimizer {
  private compiledFilters: Map<string, (event: any) => boolean> = new Map()
  private metrics: OptimizationMetrics = {
    eventsReceived: 0,
    eventsFiltered: 0,
    filteringRate: 0,
    averageFilterTime: 0
  }
  private filterTimings: number[] = []
  private readonly MAX_TIMING_SAMPLES = 1000
  private logger: any

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[PredicateOptimizer] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[PredicateOptimizer] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[PredicateOptimizer] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[PredicateOptimizer] ${msg}`, ...args)
    }
  }

  compileFilter(predicateId: string, filter: PredicateFilter): void {
    const compiledFilter = this.createFilterFunction(filter)
    this.compiledFilters.set(predicateId, compiledFilter)
    this.logger.debug(`Compiled filter for predicate: ${predicateId}`)
  }

  private createFilterFunction(filter: PredicateFilter): (event: any) => boolean {
    return (event: any) => {
      if (filter.minBlockHeight !== undefined && event.block_identifier?.index < filter.minBlockHeight) {
        return false
      }

      if (filter.maxBlockHeight !== undefined && event.block_identifier?.index > filter.maxBlockHeight) {
        return false
      }

      if (event.transactions && Array.isArray(event.transactions)) {
        for (const tx of event.transactions) {
          if (!tx.operations) continue

          for (const op of tx.operations) {
            if (filter.contractAddress && op.contract_call?.contract !== filter.contractAddress) {
              continue
            }

            if (filter.method && op.contract_call?.method !== filter.method) {
              continue
            }

            if (filter.topic) {
              if (!op.events?.some((e: any) => e.topic?.includes(filter.topic))) {
                continue
              }
            }

            return true
          }
        }
      }

      return false
    }
  }

  filterEvent(predicateId: string, event: any): boolean {
    const startTime = performance.now()

    try {
      const filter = this.compiledFilters.get(predicateId)
      if (!filter) {
        this.logger.warn(`No compiled filter found for predicate: ${predicateId}`)
        return true
      }

      this.metrics.eventsReceived++
      const result = filter(event)

      if (!result) {
        this.metrics.eventsFiltered++
      }

      const filterTime = performance.now() - startTime
      this.recordFilterTiming(filterTime)

      return result
    } catch (error) {
      this.logger.error(`Error applying filter for predicate ${predicateId}:`, error)
      return true
    }
  }

  filterEventBatch(predicateId: string, events: any[]): any[] {
    const filtered = []

    for (const event of events) {
      if (this.filterEvent(predicateId, event)) {
        filtered.push(event)
      }
    }

    this.logger.debug(`Batch filtering: ${events.length} → ${filtered.length} events`)
    return filtered
  }

  private recordFilterTiming(time: number): void {
    this.filterTimings.push(time)

    if (this.filterTimings.length > this.MAX_TIMING_SAMPLES) {
      this.filterTimings = this.filterTimings.slice(-this.MAX_TIMING_SAMPLES)
    }

    if (this.filterTimings.length > 0) {
      const sum = this.filterTimings.reduce((a, b) => a + b, 0)
      this.metrics.averageFilterTime = sum / this.filterTimings.length
    }

    if (this.metrics.eventsReceived > 0) {
      this.metrics.filteringRate = (this.metrics.eventsFiltered / this.metrics.eventsReceived) * 100
    }
  }

  getMetrics(): OptimizationMetrics {
    return {
      ...this.metrics,
      filteringRate: parseFloat(this.metrics.filteringRate.toFixed(2)),
      averageFilterTime: parseFloat(this.metrics.averageFilterTime.toFixed(4))
    }
  }

  resetMetrics(): void {
    this.metrics = {
      eventsReceived: 0,
      eventsFiltered: 0,
      filteringRate: 0,
      averageFilterTime: 0
    }
    this.filterTimings = []
    this.logger.info('Metrics reset')
  }

  removeFilter(predicateId: string): boolean {
    const removed = this.compiledFilters.delete(predicateId)
    if (removed) {
      this.logger.debug(`Filter removed for predicate: ${predicateId}`)
    }
    return removed
  }

  clearAllFilters(): void {
    this.compiledFilters.clear()
    this.logger.info('All filters cleared')
  }
}

export default ChainhookPredicateOptimizer
