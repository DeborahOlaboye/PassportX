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

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await fn();

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

export const retryWithTimeout = async <T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  opts?: RetryOptions
): Promise<T> => {
  return Promise.race([
    retry(fn, opts),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Retry timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
};

export const retryParallel = async <T>(
  fns: (() => Promise<T>)[],
  opts?: RetryOptions
): Promise<T> => {
  const errors: Error[] = [];

  for (const fn of fns) {
    try {
      return await retry(fn, opts);
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)));
    }
  }

  throw new Error(
    `All ${fns.length} attempts failed: ${errors
      .map((e) => e.message)
      .join(', ')}`
  );
};

export const RetryState = {
  IDLE: 'idle',
  RETRYING: 'retrying',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export type RetryStateType = (typeof RetryState)[keyof typeof RetryState];

export class RetryContext {
  private attempts: number = 0;
  private state: RetryStateType = RetryState.IDLE;
  private errors: Error[] = [];
  private startTime?: number;
  private endTime?: number;

  get attemptCount(): number {
    return this.attempts;
  }

  get currentState(): RetryStateType {
    return this.state;
  }

  get errorHistory(): readonly Error[] {
    return [...this.errors];
  }

  get elapsedMs(): number | undefined {
    if (!this.startTime) return undefined;
    const end = this.endTime ?? Date.now();
    return end - this.startTime;
  }

  get isActive(): boolean {
    return this.state === RetryState.RETRYING;
  }

  recordAttempt(error?: Error): void {
    this.attempts++;
    this.state = RetryState.RETRYING;
    if (!this.startTime) {
      this.startTime = Date.now();
    }
    if (error) {
      this.errors.push(error);
    }
  }

  markSuccess(): void {
    this.state = RetryState.SUCCESS;
    this.endTime = Date.now();
  }

  markFailed(): void {
    this.state = RetryState.FAILED;
    this.endTime = Date.now();
  }

  reset(): void {
    this.attempts = 0;
    this.state = RetryState.IDLE;
    this.errors = [];
    this.startTime = undefined;
    this.endTime = undefined;
  }

  getSummary(): {
    attempts: number;
    state: RetryStateType;
    errors: number;
    elapsedMs: number | undefined;
  } {
    return {
      attempts: this.attempts,
      state: this.state,
      errors: this.errors.length,
      elapsedMs: this.elapsedMs,
    };
  }
}

export default retry;
