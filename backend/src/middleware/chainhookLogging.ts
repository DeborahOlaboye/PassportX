import { Request, Response, NextFunction } from 'express'

export interface RequestLog {
  id: string
  timestamp: string
  method: string
  path: string
  statusCode: number
  duration: number
  requestBody?: any
  responseBody?: any
  headers?: Record<string, string>
  error?: string
}

const requestLogs: RequestLog[] = []
const maxLogs = 1000
let requestIdCounter = 0

function generateRequestId(): string {
  return `req_${Date.now()}_${++requestIdCounter}`
}

export function chainhookRequestLoggingMiddleware(logger?: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    const requestId = generateRequestId()

    const originalSend = res.send.bind(res)

    req.body = req.body || {}
    const requestBody = req.method !== 'GET' ? req.body : undefined

    res.send = function(data: any) {
      const duration = Date.now() - startTime
      const statusCode = res.statusCode

      const log: RequestLog = {
        id: requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        requestBody,
        headers: {
          'content-type': req.headers['content-type'] as string,
          'authorization': req.headers['authorization'] ? '***' : undefined
        }
      }

      if (req.method !== 'GET' && data) {
        try {
          log.responseBody = typeof data === 'string' ? JSON.parse(data) : data
        } catch {
          log.responseBody = data
        }
      }

      requestLogs.push(log)

      if (requestLogs.length > maxLogs) {
        requestLogs.shift()
      }

      const logMessage = `[${log.id}] ${log.method} ${log.path} - ${log.statusCode} (${log.duration}ms)`

      if (logger) {
        if (statusCode >= 400) {
          logger.warn(logMessage, { duration: log.duration, statusCode })
        } else {
          logger.info(logMessage, { duration: log.duration, statusCode })
        }
      } else {
        if (statusCode >= 400) {
          console.warn(logMessage)
        } else {
          console.log(logMessage)
        }
      }

      return originalSend(data)
    }

    next()
  }
}

export function getChainhookRequestLogs(limit: number = 100): RequestLog[] {
  return requestLogs.slice(-limit)
}

export function getChainhookRequestLogsByPath(path: string, limit: number = 50): RequestLog[] {
  return requestLogs.filter(log => log.path === path).slice(-limit)
}

export function getChainhookRequestLogsByStatusCode(statusCode: number, limit: number = 50): RequestLog[] {
  return requestLogs.filter(log => log.statusCode === statusCode).slice(-limit)
}

export function getChainhookSlowRequests(threshold: number = 100, limit: number = 50): RequestLog[] {
  return requestLogs.filter(log => log.duration > threshold).slice(-limit)
}

export function clearChainhookRequestLogs(): void {
  requestLogs.length = 0
}

export function getChainhookRequestLogStatistics() {
  const totalRequests = requestLogs.length
  const successfulRequests = requestLogs.filter(log => log.statusCode < 400).length
  const failedRequests = requestLogs.filter(log => log.statusCode >= 400).length
  const averageDuration = requestLogs.length > 0 ? requestLogs.reduce((sum, log) => sum + log.duration, 0) / requestLogs.length : 0
  const maxDuration = requestLogs.length > 0 ? Math.max(...requestLogs.map(log => log.duration)) : 0
  const minDuration = requestLogs.length > 0 ? Math.min(...requestLogs.map(log => log.duration)) : 0

  const statusCodeDistribution: Record<number, number> = {}
  for (const log of requestLogs) {
    statusCodeDistribution[log.statusCode] = (statusCodeDistribution[log.statusCode] || 0) + 1
  }

  const methodDistribution: Record<string, number> = {}
  for (const log of requestLogs) {
    methodDistribution[log.method] = (methodDistribution[log.method] || 0) + 1
  }

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    averageDuration: Math.round(averageDuration),
    maxDuration,
    minDuration,
    statusCodeDistribution,
    methodDistribution
  }
}

export function exportChainhookRequestLogs(): string {
  return JSON.stringify(requestLogs, null, 2)
}

export function getLatestError(): RequestLog | undefined {
  for (let i = requestLogs.length - 1; i >= 0; i--) {
    if (requestLogs[i].statusCode >= 400) {
      return requestLogs[i]
    }
  }

  return undefined
}
