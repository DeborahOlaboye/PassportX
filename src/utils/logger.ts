export const logInfo = (...args: any[]) => {
  try {
    console.info('[passportx]', ...args);
  } catch {}
};

export const logError = (...args: any[]) => {
  try {
    console.error('[passportx][error]', ...args);
  } catch {}
};

export default { logInfo, logError };
