export interface PerformanceMetric {
  name: string
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  p99: number
  count: number
  totalTime: number
}

export interface ProfilerSnapshot {
  timestamp: Date
  metrics: Record<string, PerformanceMetric>
  systemMetrics: {
    uptime: number
    memoryUsage: NodeJS.MemoryUsage
    eventThroughput: number
  }
}

export class ChainhookPerformanceProfiler {
  private measurements: Map<string, number[]> = new Map()
  private eventCounts: Map<string, number> = new Map()
  private startTimes: Map<string, number> = new Map()
  private lastThroughputCheck = Date.now()
  private lastEventCount = 0
  private logger: any

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[Profiler] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[Profiler] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[Profiler] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[Profiler] ${msg}`, ...args)
    }
  }

  startMeasurement(metricName: string): void {
    this.startTimes.set(metricName, performance.now())
  }

  endMeasurement(metricName: string): number | null {
    const startTime = this.startTimes.get(metricName)
    if (startTime === undefined) {
      this.logger.warn(`No start time found for metric: ${metricName}`)
      return null
    }

    const duration = performance.now() - startTime
    this.startTimes.delete(metricName)

    if (!this.measurements.has(metricName)) {
      this.measurements.set(metricName, [])
    }

    this.measurements.get(metricName)!.push(duration)

    const count = this.eventCounts.get(metricName) || 0
    this.eventCounts.set(metricName, count + 1)

    return duration
  }

  recordMetric(metricName: string, duration: number): void {
    if (!this.measurements.has(metricName)) {
      this.measurements.set(metricName, [])
    }

    this.measurements.get(metricName)!.push(duration)

    const count = this.eventCounts.get(metricName) || 0
    this.eventCounts.set(metricName, count + 1)
  }

  recordEventProcessed(eventType: string): void {
    const key = `event:${eventType}`
    const count = this.eventCounts.get(key) || 0
    this.eventCounts.set(key, count + 1)
  }

  private calculatePercentile(sorted: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)] || 0
  }

  getMetric(metricName: string): PerformanceMetric | null {
    const measurements = this.measurements.get(metricName)
    if (!measurements || measurements.length === 0) {
      return null
    }

    const sorted = [...measurements].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)

    return {
      name: metricName,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: this.calculatePercentile(sorted, 50),
      p95: this.calculatePercentile(sorted, 95),
      p99: this.calculatePercentile(sorted, 99),
      count: sorted.length,
      totalTime: sum
    }
  }

  getAllMetrics(): Record<string, PerformanceMetric> {
    const result: Record<string, PerformanceMetric> = {}

    for (const metricName of this.measurements.keys()) {
      const metric = this.getMetric(metricName)
      if (metric) {
        result[metricName] = metric
      }
    }

    return result
  }

  getSnapshot(): ProfilerSnapshot {
    const allMetrics = this.getAllMetrics()
    const now = Date.now()
    const timeSinceCheck = (now - this.lastThroughputCheck) / 1000

    let totalEventCount = 0
    for (const count of this.eventCounts.values()) {
      totalEventCount += count
    }

    const eventThroughput = timeSinceCheck > 0 ? (totalEventCount - this.lastEventCount) / timeSinceCheck : 0

    this.lastThroughputCheck = now
    this.lastEventCount = totalEventCount

    return {
      timestamp: new Date(),
      metrics: allMetrics,
      systemMetrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        eventThroughput
      }
    }
  }

  printReport(limit: number = 10): void {
    const metrics = this.getAllMetrics()
    const sorted = Object.entries(metrics).sort((a, b) => b[1].totalTime - a[1].totalTime)

    this.logger.info('=== Performance Report ===')
    this.logger.info(`Total metrics tracked: ${Object.keys(metrics).length}`)

    for (const [name, metric] of sorted.slice(0, limit)) {
      this.logger.info(`Metric: ${name}`)
      this.logger.info(`  Count: ${metric.count}, Avg: ${metric.avg.toFixed(2)}ms, Min: ${metric.min.toFixed(2)}ms, Max: ${metric.max.toFixed(2)}ms`)
      this.logger.info(`  P50: ${metric.p50.toFixed(2)}ms, P95: ${metric.p95.toFixed(2)}ms, P99: ${metric.p99.toFixed(2)}ms`)
    }

    const snapshot = this.getSnapshot()
    this.logger.info(`Event Throughput: ${snapshot.systemMetrics.eventThroughput.toFixed(2)} events/sec`)
    this.logger.info(`Memory Usage: ${(snapshot.systemMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`)
  }

  reset(): void {
    this.measurements.clear()
    this.eventCounts.clear()
    this.startTimes.clear()
    this.logger.info('Profiler reset')
  }

  clearMetric(metricName: string): void {
    this.measurements.delete(metricName)
    this.eventCounts.delete(metricName)
    this.logger.debug(`Metric cleared: ${metricName}`)
  }
}

export default ChainhookPerformanceProfiler
