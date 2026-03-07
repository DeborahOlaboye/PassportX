const timestamp = () => new Date().toISOString();

const formatArgs = (message: string, meta?: any): [string, ...any[]] => {
  return meta !== undefined ? [`${message}`, meta] : [message];
};

const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${timestamp()}`, ...formatArgs(message, meta));
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${timestamp()}`, ...formatArgs(message, meta));
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${timestamp()}`, ...formatArgs(message, meta));
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${timestamp()}`, ...formatArgs(message, meta));
    }
  },
};

export default logger;
