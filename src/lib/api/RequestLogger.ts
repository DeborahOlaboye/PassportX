import { logger } from '../logger';

export interface RequestLogEntry {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  timestamp: number;
}

export interface ResponseLogEntry {
  id: string;
  status: number;
  headers: Record<string, string>;
  body?: unknown;
  duration: number;
  timestamp: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface RequestLoggerConfig {
  logLevel: LogLevel;
  logHeaders: boolean;
  logBody: boolean;
  logResponse: boolean;
  excludePaths?: string[];
}

const defaultConfig: RequestLoggerConfig = {
  logLevel: 'info',
  logHeaders: false,
  logBody: false,
  logResponse: true,
  excludePaths: ['/health', '/ping'],
};

export class RequestLogger {
  private config: RequestLoggerConfig;
  private requestLogs = new Map<string, RequestLogEntry>();

  constructor(config: Partial<RequestLoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  logRequest(req: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
  }): string {
    const id = Math.random().toString(36).substring(7);
    const entry: RequestLogEntry = {
      id,
      method: req.method,
      url: req.url,
      headers: this.config.logHeaders ? req.headers : {},
      body: this.config.logBody ? req.body : undefined,
      timestamp: Date.now(),
    };

    this.requestLogs.set(id, entry);

    if (this.shouldLog(req.url)) {
      this.log('info', `[REQUEST] ${req.method} ${req.url}`, { id });
    }

    return id;
  }

  logResponse(
    reqId: string,
    res: { status: number; headers: Record<string, string>; body?: unknown }
  ): void {
    const request = this.requestLogs.get(reqId);
    if (!request) return;

    const duration = Date.now() - request.timestamp;
    const entry: ResponseLogEntry = {
      id: reqId,
      status: res.status,
      headers: this.config.logHeaders ? res.headers : {},
      body:
        this.config.logResponse && this.config.logBody ? res.body : undefined,
      duration,
      timestamp: Date.now(),
    };

    if (this.shouldLog(request.url)) {
      const level = res.status >= 400 ? 'warn' : 'info';
      this.log(
        level,
        `[RESPONSE] ${request.method} ${request.url} ${res.status} (${duration}ms)`,
        {
          id: reqId,
          status: res.status,
          duration,
        } as Record<string, unknown>
      );
    }

    this.requestLogs.delete(reqId);
  }

  private shouldLog(url: string): boolean {
    if (!this.config.excludePaths) return true;
    return !this.config.excludePaths.some((path) => url.startsWith(path));
  }

  private log(
    level: LogLevel,
    message: string,
    meta: Record<string, unknown> = {}
  ): void {
    switch (level) {
      case 'debug':
        logger.debug(message, meta);
        break;
      case 'info':
        logger.info(message, meta);
        break;
      case 'warn':
        logger.warn(message, meta);
        break;
      case 'error':
        logger.error(message, meta);
        break;
    }
  }

  getRequestCount(): number {
    return this.requestLogs.size;
  }

  clear(): void {
    this.requestLogs.clear();
  }
}

export const createRequestLogger = (
  config?: Partial<RequestLoggerConfig>
): RequestLogger => {
  return new RequestLogger(config);
};

export const defaultRequestLogger = createRequestLogger();
