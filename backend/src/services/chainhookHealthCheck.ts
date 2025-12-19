export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    observer: boolean
    server: boolean
    eventQueue: boolean
    subscriptions: boolean
  }
  metrics: {
    uptime: number
    eventQueueSize: number
    totalEventsProcessed: number
    totalErrorsEncountered: number
  }
  lastError?: {
    message: string
    timestamp: string
  }
}

export class ChainhookHealthCheck {
  private startTime: Date = new Date()
  private totalEventsProcessed = 0
  private totalErrorsEncountered = 0
  private lastError?: { message: string; timestamp: string }
  private observerHealthy = false
  private serverHealthy = false
  private eventQueueSize = 0
  private logger: any
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    }
  }

  startHealthChecks(interval: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, interval)

    this.logger.info('Health checks started')
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    this.logger.info('Health checks stopped')
  }

  private performHealthCheck(): void {
    const status = this.getStatus()
    const statusString = JSON.stringify(status, null, 2)

    if (status.status === 'healthy') {
      this.logger.debug('Health check: healthy', status)
    } else if (status.status === 'degraded') {
      this.logger.warn('Health check: degraded', status)
    } else {
      this.logger.error('Health check: unhealthy', status)
    }
  }

  getStatus(): HealthStatus {
    const uptime = Date.now() - this.startTime.getTime()
    const statusCheckResults = this.performChecks()

    const status: 'healthy' | 'degraded' | 'unhealthy' = this.determineStatus(statusCheckResults)

    return {
      status,
      timestamp: new Date().toISOString(),
      checks: statusCheckResults,
      metrics: {
        uptime,
        eventQueueSize: this.eventQueueSize,
        totalEventsProcessed: this.totalEventsProcessed,
        totalErrorsEncountered: this.totalErrorsEncountered
      },
      lastError: this.lastError
    }
  }

  private performChecks(): { observer: boolean; server: boolean; eventQueue: boolean; subscriptions: boolean } {
    return {
      observer: this.observerHealthy,
      server: this.serverHealthy,
      eventQueue: this.eventQueueSize < 1000,
      subscriptions: true
    }
  }

  private determineStatus(checks: {
    observer: boolean
    server: boolean
    eventQueue: boolean
    subscriptions: boolean
  }): 'healthy' | 'degraded' | 'unhealthy' {
    const allHealthy = Object.values(checks).every(v => v === true)

    if (allHealthy) {
      return 'healthy'
    }

    const hasServer = checks.server
    const hasObserver = checks.observer

    if (hasServer && hasObserver) {
      return 'degraded'
    }

    return 'unhealthy'
  }

  recordEventProcessed(): void {
    this.totalEventsProcessed++
  }

  recordError(error: Error): void {
    this.totalErrorsEncountered++
    this.lastError = {
      message: error.message,
      timestamp: new Date().toISOString()
    }
  }

  setObserverHealth(healthy: boolean): void {
    this.observerHealthy = healthy
  }

  setServerHealth(healthy: boolean): void {
    this.serverHealthy = healthy
  }

  setEventQueueSize(size: number): void {
    this.eventQueueSize = size
  }

  getUptime(): number {
    return Date.now() - this.startTime.getTime()
  }

  getUptimeFormatted(): string {
    const uptime = this.getUptime()
    const seconds = Math.floor((uptime / 1000) % 60)
    const minutes = Math.floor((uptime / (1000 * 60)) % 60)
    const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24)
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24))

    const parts: string[] = []

    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0) parts.push(`${seconds}s`)

    return parts.join(' ') || '0s'
  }

  getTotalEventsProcessed(): number {
    return this.totalEventsProcessed
  }

  getTotalErrorsEncountered(): number {
    return this.totalErrorsEncountered
  }

  getLastError(): { message: string; timestamp: string } | undefined {
    return this.lastError
  }

  reset(): void {
    this.startTime = new Date()
    this.totalEventsProcessed = 0
    this.totalErrorsEncountered = 0
    this.lastError = undefined
    this.logger.info('Health check metrics reset')
  }

  getErrorRate(): number {
    if (this.totalEventsProcessed === 0) {
      return 0
    }

    return (this.totalErrorsEncountered / this.totalEventsProcessed) * 100
  }

  isHealthy(): boolean {
    return this.getStatus().status === 'healthy'
  }

  isDegraded(): boolean {
    return this.getStatus().status === 'degraded'
  }

  isUnhealthy(): boolean {
    return this.getStatus().status === 'unhealthy'
  }
}

export default ChainhookHealthCheck
