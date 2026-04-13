import { retry, retryWithFallback, retryUntil, RetryOptions } from '../retry';

describe('retry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retry(fn, { retries: 3, delayMs: 100 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const result = await retry(fn, { retries: 3, delayMs: 100 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after exhausting retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));

    await expect(retry(fn, { retries: 3, delayMs: 100 })).rejects.toThrow(
      'fail'
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use exponential backoff', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const start = Date.now();
    await retry(fn, { retries: 3, delayMs: 100, backoffMultiplier: 2 });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(100 + 200);
  });

  it('should cap delay at maxDelayMs', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const start = Date.now();
    await retry(fn, {
      retries: 4,
      delayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 150,
    });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(100 + 150 + 150);
  });

  it('should call onRetry callback', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const onRetry = jest.fn();
    await retry(fn, { retries: 2, delayMs: 100, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('should respect retryCondition', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('retryable'));
    const retryCondition = jest.fn().mockReturnValue(false);

    await expect(
      retry(fn, { retries: 3, delayMs: 100, retryCondition })
    ).rejects.toThrow();
    expect(retryCondition).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('retryWithFallback', () => {
  it('should return fallback result on failure', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const fallback = jest.fn().mockResolvedValue('fallback');

    const result = await retryWithFallback(fn, fallback, { retries: 1 });
    expect(result).toBe('fallback');
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('should return fn result on success', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const fallback = jest.fn().mockResolvedValue('fallback');

    const result = await retryWithFallback(fn, fallback);
    expect(result).toBe('success');
    expect(fallback).not.toHaveBeenCalled();
  });
});

describe('retryUntil', () => {
  it('should return result when condition is met', async () => {
    const fn = jest.fn().mockResolvedValue({ status: 'ready' });
    const condition = (result: { status: string }) => result.status === 'ready';

    const result = await retryUntil(fn, condition, {
      retries: 3,
      delayMs: 100,
    });
    expect(result).toEqual({ status: 'ready' });
  });

  it('should retry until condition is met', async () => {
    const fn = jest
      .fn()
      .mockResolvedValueOnce({ status: 'loading' })
      .mockResolvedValueOnce({ status: 'loading' })
      .mockResolvedValue({ status: 'ready' });

    const condition = (result: { status: string }) => result.status === 'ready';

    const result = await retryUntil(fn, condition, {
      retries: 3,
      delayMs: 100,
    });
    expect(result).toEqual({ status: 'ready' });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw if condition never met', async () => {
    const fn = jest.fn().mockResolvedValue({ status: 'loading' });
    const condition = (result: { status: string }) => result.status === 'ready';

    await expect(
      retryUntil(fn, condition, { retries: 2, delayMs: 100 })
    ).rejects.toThrow();
  });
});
