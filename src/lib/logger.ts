type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (this.isProduction) {
      return JSON.stringify(logEntry);
    }

    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${
      context ? JSON.stringify(context, null, 2) : ''
    }`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context));
  }

  error(message: string, context?: LogContext | Error): void {
    let logContext: LogContext = {};

    if (context instanceof Error) {
      logContext = {
        error: {
          message: context.message,
          stack: context.stack,
          name: context.name,
        },
      };
    } else if (context) {
      logContext = context;
    }

    console.error(this.formatLog('error', message, logContext));
  }

  debug(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.debug(this.formatLog('debug', message, context));
    }
  }
}

export const logger = new Logger();
