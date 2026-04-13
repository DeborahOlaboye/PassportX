export type RetryOptions = {
  retries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
  retryCondition?: (error: Error) => boolean;
};

export const retry = async <T>(
  fn: () => Promise<T>,
  opts?: RetryOptions
): Promise<T> => {
  const retries = opts?.retries ?? 3;
  const baseDelay = opts?.delayMs ?? 500;
  const multiplier = opts?.backoffMultiplier ?? 2;
  const maxDelay = opts?.maxDelayMs ?? 30000;
  const onRetry = opts?.onRetry;
  const retryCondition = opts?.retryCondition;

  let lastErr: Error | unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const error = e instanceof Error ? e : new Error(String(e));

      if (retryCondition && !retryCondition(error)) {
        throw error;
      }

      if (attempt < retries - 1) {
        const delay = Math.min(
          baseDelay * Math.pow(multiplier, attempt),
          maxDelay
        );

        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastErr;
};

export const retryWithFallback = async <T>(
  fn: () => Promise<T>,
  fallback: () => Promise<T>,
  opts?: RetryOptions
): Promise<T> => {
  try {
    return await retry(fn, opts);
  } catch {
    return await fallback();
  }
};

export const retryUntil = async <T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  opts?: RetryOptions
): Promise<T> => {
  const maxAttempts = (opts?.retries ?? 3) + 1;
  let lastResult: T | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await fn();
    lastResult = result;

    if (condition(result)) {
      return result;
    }

    if (attempt < maxAttempts - 1) {
      const delay = opts?.delayMs ?? 500;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error(`Condition not met after ${maxAttempts} attempts`);
};

export default retry;
