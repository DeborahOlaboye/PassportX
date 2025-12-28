export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: {
    message: string
    stack?: string
  }
}

export class ChainhookLogger {
  private logs: LogEntry[] = []
  private maxLogs = 10000
  private minLevel: LogLevel = LogLevel.DEBUG
  private enableConsole = true
  private enableFileLog = false
  private fileLogPath?: string

  constructor(
    minLevel: LogLevel = LogLevel.DEBUG,
    enableConsole: boolean = true,
    fileLogPath?: string
  ) {
    this.minLevel = minLevel
    this.enableConsole = enableConsole
    this.fileLogPath = fileLogPath
    this.enableFileLog = !!fileLogPath
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.logError(LogLevel.ERROR, message, error, context)
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    }

    this.addLogEntry(entry)
    this.outputLog(entry)
  }

  private logError(level: LogLevel, message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error
        ? {
            message: error.message,
            stack: error.stack
          }
        : undefined
    }

    this.addLogEntry(entry)
    this.outputLog(entry)
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const minIndex = levels.indexOf(this.minLevel)
    const currentIndex = levels.indexOf(level)

    return currentIndex >= minIndex
  }

  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry)

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  private outputLog(entry: LogEntry): void {
    const formattedMessage = this.formatLogMessage(entry)

    if (this.enableConsole) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage)
          break
        case LogLevel.INFO:
          console.info(formattedMessage)
          break
        case LogLevel.WARN:
          console.warn(formattedMessage)
          break
        case LogLevel.ERROR:
          console.error(formattedMessage)
          break
      }
    }

    if (this.enableFileLog && this.fileLogPath) {
      // File logging would be implemented here
      // For now, we'll keep it in memory
    }
  }

  private formatLogMessage(entry: LogEntry): string {
    let message = `[${entry.timestamp}] [${entry.level}] ${entry.message}`

    if (entry.context && Object.keys(entry.context).length > 0) {
      message += ` ${JSON.stringify(entry.context)}`
    }

    if (entry.error) {
      message += `\nError: ${entry.error.message}`
      if (entry.error.stack) {
        message += `\nStack: ${entry.error.stack}`
      }
    }

    return message
  }

  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = this.logs

    if (level) {
      filtered = filtered.filter(log => log.level === level)
    }

    return filtered.slice(-limit)
  }

  getLogsByTimeRange(startTime: Date, endTime: Date, level?: LogLevel): LogEntry[] {
    const startTimestamp = startTime.toISOString()
    const endTimestamp = endTime.toISOString()

    let filtered = this.logs.filter(
      log => log.timestamp >= startTimestamp && log.timestamp <= endTimestamp
    )

    if (level) {
      filtered = filtered.filter(log => log.level === level)
    }

    return filtered
  }

  getErrorLogs(limit: number = 100): LogEntry[] {
    return this.getLogs(LogLevel.ERROR, limit)
  }

  getWarningLogs(limit: number = 100): LogEntry[] {
    return this.getLogs(LogLevel.WARN, limit)
  }

  getLogStatistics(): Record<string, number> {
    const stats: Record<string, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      total: this.logs.length
    }

    for (const log of this.logs) {
      stats[log.level]++
    }

    return stats
  }

  searchLogs(query: string, limit: number = 100): LogEntry[] {
    const lowerQuery = query.toLowerCase()

    return this.logs
      .filter(log => log.message.toLowerCase().includes(lowerQuery))
      .slice(-limit)
  }

  clearLogs(): void {
    this.logs = []
  }

  setMinimumLevel(level: LogLevel): void {
    this.minLevel = level
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  getLogCount(): number {
    return this.logs.length
  }

  getRecentLogs(minutes: number = 5): LogEntry[] {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString()

    return this.logs.filter(log => log.timestamp >= cutoffTime)
  }

  hasErrors(): boolean {
    return this.logs.some(log => log.level === LogLevel.ERROR)
  }

  hasWarnings(): boolean {
    return this.logs.some(log => log.level === LogLevel.WARN || log.level === LogLevel.ERROR)
  }
}

export default ChainhookLogger
