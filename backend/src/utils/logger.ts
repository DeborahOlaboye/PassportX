const timestamp = () => new Date().toISOString();

const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${timestamp()} ${message}`, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${timestamp()} ${message}`, meta || '');
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${timestamp()} ${message}`, meta || '');
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${timestamp()} ${message}`, meta || '');
    }
  },
};

export default logger;
