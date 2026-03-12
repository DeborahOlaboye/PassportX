const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const;
type LogLevel = keyof typeof LEVELS;

function resolveMinLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL || '').toLowerCase();
  if (env in LEVELS) return env as LogLevel;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const minLevel: LogLevel = resolveMinLevel();

const isEnabled = (level: LogLevel) => LEVELS[level] <= LEVELS[minLevel];

const isProduction = process.env.NODE_ENV === 'production';

const timestamp = () => new Date().toISOString();

const formatArgs = (message: string, meta?: any): [string, ...any[]] => {
  return meta !== undefined ? [`${message}`, meta] : [message];
};

function emit(level: LogLevel, message: string, meta?: any): void {
  if (!isEnabled(level)) return;

  if (isProduction) {
    const entry: Record<string, unknown> = {
      level,
      time: timestamp(),
      message,
    };
    if (meta !== undefined) entry.meta = meta;
    process.stdout.write(JSON.stringify(entry) + '\n');
    return;
  }

  const prefix = `[${level.toUpperCase()}] ${timestamp()}`;
  switch (level) {
    case 'error':
      console.error(prefix, ...formatArgs(message, meta));
      break;
    case 'warn':
      console.warn(prefix, ...formatArgs(message, meta));
      break;
    case 'debug':
      console.debug(prefix, ...formatArgs(message, meta));
      break;
    default:
      console.log(prefix, ...formatArgs(message, meta));
      break;
  }
}

const logger = {
  info: (message: string, meta?: any) => emit('info', message, meta),
  warn: (message: string, meta?: any) => emit('warn', message, meta),
  error: (message: string, meta?: any) => emit('error', message, meta),
  debug: (message: string, meta?: any) => emit('debug', message, meta),
};

export default logger;
