export type RetryOptions = { retries?: number; delayMs?: number };

export const retry = async <T>(fn: () => Promise<T>, opts?: RetryOptions): Promise<T> => {
  const retries = opts?.retries ?? 3;
  const delayMs = opts?.delayMs ?? 500;
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
};

export default retry;
