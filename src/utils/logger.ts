export const logInfo = (...args: unknown[]): void => {
  try {
    console.info('[passportx]', ...args);
  } catch {}
};

export const logError = (...args: unknown[]): void => {
  try {
    console.error('[passportx][error]', ...args);
  } catch {}
};

const logger = { logInfo, logError };
export default logger;
