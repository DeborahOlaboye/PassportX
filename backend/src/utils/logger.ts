const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const;
type LogLevel = keyof typeof LEVELS;

function resolveMinLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL || '').toLowerCase();
  if (env in LEVELS) return env as LogLevel;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const minLevel: LogLevel = resolveMinLevel();

const isEnabled = (level: LogLevel) => LEVELS[level] <= LEVELS[minLevel];

const timestamp = () => new Date().toISOString();

const formatArgs = (message: string, meta?: any): [string, ...any[]] => {
  return meta !== undefined ? [`${message}`, meta] : [message];
};

const logger = {
  info: (message: string, meta?: any) => {
    if (isEnabled('info')) console.log(`[INFO] ${timestamp()}`, ...formatArgs(message, meta));
  },
  warn: (message: string, meta?: any) => {
    if (isEnabled('warn')) console.warn(`[WARN] ${timestamp()}`, ...formatArgs(message, meta));
  },
  error: (message: string, meta?: any) => {
    if (isEnabled('error')) console.error(`[ERROR] ${timestamp()}`, ...formatArgs(message, meta));
  },
  debug: (message: string, meta?: any) => {
    if (isEnabled('debug')) console.debug(`[DEBUG] ${timestamp()}`, ...formatArgs(message, meta));
  },
};

export default logger;
