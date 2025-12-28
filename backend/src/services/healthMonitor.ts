import HealthStatus from '../models/HealthStatus'
import { IHealthStatus } from '../types'
import axios from 'axios'

export interface HealthCheckOptions {
  nodeUrl: string
  timeout?: number
  maxRetries?: number
}

export interface HealthCheckResult {
  isConnected: boolean
  responseTime: number
  error?: string
}

export class HealthMonitor {
  private logger: any
  private healthChecks: Map<string, IHealthStatus> = new Map()

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[HealthMonitor] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[HealthMonitor] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[HealthMonitor] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[HealthMonitor] ${msg}`, ...args)
    }
  }

  async checkHealth(options: HealthCheckOptions): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      const response = await axios.get(`${options.nodeUrl}/status`, {
        timeout: options.timeout || 5000
      })

      const responseTime = Date.now() - startTime

      await this.recordHealthCheck(options.nodeUrl, true, responseTime)

      this.logger.debug('Health check passed', {
        nodeUrl: options.nodeUrl,
        responseTime
      })

      return {
        isConnected: true,
        responseTime
      }
    } catch (error) {
      const responseTime = Date.now() - startTime

      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.recordHealthCheck(options.nodeUrl, false, responseTime, errorMessage)

      this.logger.warn('Health check failed', {
        nodeUrl: options.nodeUrl,
        error: errorMessage,
        responseTime
      })

      return {
        isConnected: false,
        responseTime,
        error: errorMessage
      }
    }
  }

  private async recordHealthCheck(
    nodeUrl: string,
    isConnected: boolean,
    responseTime: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const existingHealth = await HealthStatus.findOne({ nodeUrl })

      if (existingHealth) {
        const updates: any = {
          isConnected,
          lastCheckTime: new Date(),
          averageResponseTime: this.calculateAverageResponseTime(
            existingHealth.averageResponseTime,
            responseTime
          )
        }

        if (isConnected) {
          updates.successfulAttempts = (existingHealth.successfulAttempts || 0) + 1
          updates.failedAttempts = Math.max(0, (existingHealth.failedAttempts || 1) - 1)
        } else {
          updates.failedAttempts = (existingHealth.failedAttempts || 0) + 1
        }

        await HealthStatus.findByIdAndUpdate(existingHealth._id, updates)
      } else {
        await HealthStatus.create({
          nodeUrl,
          isConnected,
          lastCheckTime: new Date(),
          successfulAttempts: isConnected ? 1 : 0,
          failedAttempts: isConnected ? 0 : 1,
          averageResponseTime: responseTime,
          uptime: isConnected ? 100 : 0
        })
      }
    } catch (error) {
      this.logger.error('Failed to record health check', {
        nodeUrl,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private calculateAverageResponseTime(
    currentAverage: number,
    newResponseTime: number,
    sampleSize: number = 10
  ): number {
    return (currentAverage * (sampleSize - 1) + newResponseTime) / sampleSize
  }

  async getHealthStatus(nodeUrl: string): Promise<IHealthStatus | null> {
    try {
      return await HealthStatus.findOne({ nodeUrl })
    } catch (error) {
      this.logger.error('Failed to get health status', {
        nodeUrl,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  async getAllHealthStatus(): Promise<IHealthStatus[]> {
    try {
      return await HealthStatus.find().sort({ lastCheckTime: -1 })
    } catch (error) {
      this.logger.error('Failed to get all health status', {
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async getUptime(nodeUrl: string, hours: number = 24): Promise<number> {
    try {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() - hours)

      const checks = await HealthStatus.find({
        nodeUrl,
        lastCheckTime: { $gte: startTime }
      })

      if (checks.length === 0) {
        return 0
      }

      const connectedChecks = checks.filter(c => c.isConnected).length
      return (connectedChecks / checks.length) * 100
    } catch (error) {
      this.logger.error('Failed to calculate uptime', {
        nodeUrl,
        error: error instanceof Error ? error.message : String(error)
      })
      return 0
    }
  }

  async getAverageResponseTime(nodeUrl: string, hours: number = 1): Promise<number> {
    try {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() - hours)

      const result = await HealthStatus.aggregate([
        {
          $match: {
            nodeUrl,
            lastCheckTime: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$averageResponseTime' }
          }
        }
      ])

      return result.length > 0 ? result[0].avgResponseTime : 0
    } catch (error) {
      this.logger.error('Failed to get average response time', {
        nodeUrl,
        error: error instanceof Error ? error.message : String(error)
      })
      return 0
    }
  }

  startPeriodicHealthCheck(
    nodeUrl: string,
    interval: number = 30000
  ): NodeJS.Timeout {
    this.logger.info('Starting periodic health check', { nodeUrl, interval })

    return setInterval(async () => {
      await this.checkHealth({
        nodeUrl,
        timeout: 5000
      })
    }, interval)
  }
}

export default HealthMonitor
