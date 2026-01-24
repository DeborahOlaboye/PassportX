type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatLog(level: LogLevel, message: string, context?: LogContext) {
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

  info(message: string, context?: LogContext) {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('warn', message, context));
  }

  error(message: string, context?: LogContext | Error) {
    let logContext: LogContext = {};
    
    if (context instanceof Error) {
      logContext = {
        error: {
          message: context.message,
          stack: context.stack,
          name: context.name,
        }
      };
    } else if (context) {
      logContext = context;
    }

    console.error(this.formatLog('error', message, logContext));
  }

  debug(message: string, context?: LogContext) {
    if (!this.isProduction) {
      console.debug(this.formatLog('debug', message, context));
    }
  }
}

export const logger = new Logger();
