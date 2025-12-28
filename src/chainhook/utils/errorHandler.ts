export enum ChainhookErrorType {
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  HANDLER_ERROR = 'HANDLER_ERROR',
  NOTIFICATION_ERROR = 'NOTIFICATION_ERROR',
  DELIVERY_ERROR = 'DELIVERY_ERROR',
  PREFERENCES_ERROR = 'PREFERENCES_ERROR',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ChainhookError {
  type: ChainhookErrorType
  message: string
  originalError?: Error
  timestamp: string
  context?: Record<string, any>
}

export class ChainhookErrorHandler {
  private static errorLog: ChainhookError[] = []
  private static maxLogSize = 1000

  static createError(
    type: ChainhookErrorType,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ): ChainhookError {
    const error: ChainhookError = {
      type,
      message,
      originalError,
      timestamp: new Date().toISOString(),
      context
    }

    this.logError(error)
    return error
  }

  static handleParseError(message: string, originalError?: Error): ChainhookError {
    return this.createError(
      ChainhookErrorType.PARSE_ERROR,
      message,
      originalError,
      { originalMessage: originalError?.message }
    )
  }

  static handleValidationError(message: string, context?: Record<string, any>): ChainhookError {
    return this.createError(
      ChainhookErrorType.VALIDATION_ERROR,
      message,
      undefined,
      context
    )
  }

  static handleHandlerError(handlerName: string, message: string, originalError?: Error): ChainhookError {
    return this.createError(
      ChainhookErrorType.HANDLER_ERROR,
      `Handler error in ${handlerName}: ${message}`,
      originalError,
      { handler: handlerName }
    )
  }

  static handleNotificationError(userId: string, message: string, originalError?: Error): ChainhookError {
    return this.createError(
      ChainhookErrorType.NOTIFICATION_ERROR,
      `Notification error for user ${userId}: ${message}`,
      originalError,
      { userId }
    )
  }

  static handleDeliveryError(notificationId: string, message: string, originalError?: Error): ChainhookError {
    return this.createError(
      ChainhookErrorType.DELIVERY_ERROR,
      `Delivery error for notification ${notificationId}: ${message}`,
      originalError,
      { notificationId }
    )
  }

  static handlePreferencesError(userId: string, message: string, originalError?: Error): ChainhookError {
    return this.createError(
      ChainhookErrorType.PREFERENCES_ERROR,
      `Preferences error for user ${userId}: ${message}`,
      originalError,
      { userId }
    )
  }

  static handleWebSocketError(message: string, originalError?: Error): ChainhookError {
    return this.createError(
      ChainhookErrorType.WEBSOCKET_ERROR,
      message,
      originalError
    )
  }

  static handleUnknownError(message: string, originalError?: Error, context?: Record<string, any>): ChainhookError {
    return this.createError(
      ChainhookErrorType.UNKNOWN_ERROR,
      message,
      originalError,
      context
    )
  }

  private static logError(error: ChainhookError): void {
    this.errorLog.push(error)

    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    console.error(`[${error.type}] ${error.timestamp}: ${error.message}`, {
      originalError: error.originalError,
      context: error.context
    })
  }

  static getErrorLog(limit?: number): ChainhookError[] {
    if (limit) {
      return this.errorLog.slice(-limit)
    }
    return [...this.errorLog]
  }

  static getErrorsByType(type: ChainhookErrorType): ChainhookError[] {
    return this.errorLog.filter(e => e.type === type)
  }

  static getErrorCount(): number {
    return this.errorLog.length
  }

  static getErrorCountByType(type: ChainhookErrorType): number {
    return this.getErrorsByType(type).length
  }

  static clearErrorLog(): void {
    this.errorLog = []
  }

  static getErrorSummary(): Record<string, number> {
    const summary: Record<string, number> = {}

    for (const error of this.errorLog) {
      summary[error.type] = (summary[error.type] || 0) + 1
    }

    return summary
  }

  static isRecentError(type: ChainhookErrorType, withinMinutes: number = 5): boolean {
    const cutoffTime = Date.now() - withinMinutes * 60 * 1000

    return this.errorLog.some(
      error =>
        error.type === type &&
        new Date(error.timestamp).getTime() > cutoffTime
    )
  }

  static getRecentErrors(withinMinutes: number = 5): ChainhookError[] {
    const cutoffTime = Date.now() - withinMinutes * 60 * 1000

    return this.errorLog.filter(
      error => new Date(error.timestamp).getTime() > cutoffTime
    )
  }
}
