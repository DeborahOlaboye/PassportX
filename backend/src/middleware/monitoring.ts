import { Request, Response, NextFunction } from 'express'

interface RequestMetrics {
  method: string
  path: string
  statusCode: number
  responseTime: number
  timestamp: Date
}

class MonitoringService {
  private metrics: RequestMetrics[] = []
  private readonly maxMetrics = 1000

  logRequest(req: Request, res: Response, responseTime: number) {
    const metric: RequestMetrics = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date()
    }

    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${responseTime}ms`)
    }
  }

  getMetrics() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
    
    const totalRequests = recentMetrics.length
    const averageResponseTime = totalRequests > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests 
      : 0

    const statusCodes = recentMetrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const endpoints = recentMetrics.reduce((acc, m) => {
      const key = `${m.method} ${m.path}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      statusCodes,
      topEndpoints: Object.entries(endpoints)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }))
    }
  }

  getHealthStatus() {
    const metrics = this.getMetrics()
    const errorRate = metrics.totalRequests > 0 
      ? ((metrics.statusCodes[500] || 0) / metrics.totalRequests) * 100 
      : 0

    return {
      status: errorRate > 5 ? 'unhealthy' : 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: metrics.averageResponseTime
    }
  }
}

export const monitoringService = new MonitoringService()

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()

  res.on('finish', () => {
    const responseTime = Date.now() - startTime
    monitoringService.logRequest(req, res, responseTime)
  })

  next()
}