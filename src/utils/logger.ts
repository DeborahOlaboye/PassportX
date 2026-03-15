const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const;
type LogLevel = keyof typeof LEVELS;

function resolveMinLevel(): LogLevel {
  if (typeof process !== 'undefined' && process.env?.LOG_LEVEL) {
    const env = process.env.LOG_LEVEL.toLowerCase();
    if (env in LEVELS) return env as LogLevel;
  }
  const isDev =
    typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
  return isDev ? 'debug' : 'info';
}

const minLevel: LogLevel = resolveMinLevel();

const isEnabled = (level: LogLevel): boolean =>
  LEVELS[level] <= LEVELS[minLevel];

const timestamp = (): string => new Date().toISOString();

function emit(level: LogLevel, message: string, meta?: unknown): void {
  if (!isEnabled(level)) return;

  const prefix = `[passportx][${level.toUpperCase()}] ${timestamp()}`;
  const args: unknown[] = meta !== undefined ? [prefix, message, meta] : [prefix, message];

  switch (level) {
    case 'error':
      console.error(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'debug':
      console.debug(...args);
      break;
    default:
      console.info(...args);
      break;
  }
}

const logger = {
  info: (message: string, meta?: unknown): void => emit('info', message, meta),
  warn: (message: string, meta?: unknown): void => emit('warn', message, meta),
  error: (message: string, meta?: unknown): void =>
    emit('error', message, meta),
  debug: (message: string, meta?: unknown): void =>
    emit('debug', message, meta),
  /** @deprecated Use logger.info instead */
  logInfo: (...args: unknown[]): void => emit('info', String(args[0]), args.slice(1)),
  /** @deprecated Use logger.error instead */
  logError: (...args: unknown[]): void =>
    emit('error', String(args[0]), args.slice(1)),
};

export const { logInfo, logError } = logger;
export default logger;
