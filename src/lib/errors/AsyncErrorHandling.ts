/**
 * Async error handling utilities for promises and operations
 */

import { logger } from '../logger';
import { errorHandler } from './ErrorHandler';
import { NetworkError, SystemError, ErrorCategory, ErrorSeverity } from './ErrorTypes';
import { withRetry } from './RetryManager';

export interface AsyncOperationOptions {
  timeout?: number;
  retries?: number;
  retryCondition?: (error: Error) => boolean;
  onError?: (error: Error) => void;
  onSuccess?: (result: unknown) => void;
  context?: Record<string, unknown>;
}

export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  duration: number;
  attempts: number;
}

/**
 * Safe async wrapper that handles errors gracefully
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options: AsyncOperationOptions = {}
): Promise<AsyncResult<T>> {
  const startTime = Date.now();
  let attempts = 0;
  const maxRetries = options.retries || 0;

  const executeOperation = async (): Promise<T> => {
    attempts++;
    
    if (options.timeout) {
      return Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new NetworkError(
              `Operation timed out after ${options.timeout}ms`,
              'OPERATION_TIMEOUT',
              { timeout: options.timeout, attempts }
            ));
          }, options.timeout);
        })
      ]);
    }
    
    return operation();
  };

  try {
    let result: T;
    
    if (maxRetries > 0) {
      result = await withRetry(executeOperation, {
        maxAttempts: maxRetries + 1,
        retryCondition: options.retryCondition
      });
    } else {
      result = await executeOperation();
    }

    const duration = Date.now() - startTime;
    
    if (options.onSuccess) {
      options.onSuccess(result);
    }

    return {
      success: true,
      data: result,
      duration,
      attempts
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInstance = error as Error;

    // Handle the error through our centralized system
    await errorHandler.handleError(errorInstance, {
      component: 'safeAsync',
      action: 'operation',
      additionalData: {
        ...options.context,
        duration,
        attempts,
        timeout: options.timeout
      }
    });

    if (options.onError) {
      options.onError(errorInstance);
    }

    return {
      success: false,
      error: errorInstance,
      duration,
      attempts
    };
  }
}

/**
 * Batch async operations with error isolation
 */
export async function batchAsync<T>(
  operations: Array<() => Promise<T>>,
  options: {
    concurrency?: number;
    failFast?: boolean;
    isolateErrors?: boolean;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<Array<AsyncResult<T>>> {
  const {
    concurrency = 5,
    failFast = false,
    isolateErrors = true,
    onProgress
  } = options;

  const results: Array<AsyncResult<T>> = [];
  const batches: Array<Array<() => Promise<T>>> = [];

  // Split operations into batches
  for (let i = 0; i < operations.length; i += concurrency) {
    batches.push(operations.slice(i, i + concurrency));
  }

  let completed = 0;

  for (const batch of batches) {
    const batchPromises = batch.map(async (operation, index) => {
      try {
        const result = await safeAsync(operation, {
          context: { batchIndex: batches.indexOf(batch), operationIndex: index }
        });
        
        completed++;
        if (onProgress) {
          onProgress(completed, operations.length);
        }

        return result;
      } catch (error) {
        const errorResult: AsyncResult<T> = {
          success: false,
          error: error as Error,
          duration: 0,
          attempts: 1
        };

        completed++;
        if (onProgress) {
          onProgress(completed, operations.length);
        }

        if (failFast && !isolateErrors) {
          throw error;
        }

        return errorResult;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Check for failures in fail-fast mode
    if (failFast && batchResults.some(result => !result.success)) {
      break;
    }
  }

  return results;
}

/**
 * Debounced async operation to prevent rapid successive calls
 */
export function debouncedAsync<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  delay: number = 300
): (...args: T) => Promise<R> {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestResolve: ((value: R) => void) | null = null;
  let latestReject: ((error: Error) => void) | null = null;

  return (...args: T): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      // Cancel previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Reject previous promise if it exists
      if (latestReject) {
        latestReject(new Error('Operation cancelled by newer call'));
      }

      latestResolve = resolve;
      latestReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await operation(...args);
          if (latestResolve === resolve) {
            resolve(result);
          }
        } catch (error) {
          if (latestReject === reject) {
            reject(error as Error);
          }
        } finally {
          if (latestResolve === resolve) {
            latestResolve = null;
            latestReject = null;
          }
        }
      }, delay);
    });
  };
}

/**
 * Throttled async operation to limit execution frequency
 */
export function throttledAsync<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  interval: number = 1000
): (...args: T) => Promise<R> {
  let lastExecution = 0;
  let pendingPromise: Promise<R> | null = null;

  return (...args: T): Promise<R> => {
    const now = Date.now();
    
    if (now - lastExecution >= interval) {
      lastExecution = now;
      pendingPromise = operation(...args);
      return pendingPromise;
    }

    // Return the pending promise if one exists
    if (pendingPromise) {
      return pendingPromise;
    }

    // Schedule execution for later
    return new Promise<R>((resolve, reject) => {
      const timeToWait = interval - (now - lastExecution);
      
      setTimeout(async () => {
        try {
          lastExecution = Date.now();
          const result = await operation(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, timeToWait);
    });
  };
}

/**
 * Memoized async operation with TTL cache
 */
export function memoizedAsync<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  options: {
    ttl?: number;
    maxSize?: number;
    keyGenerator?: (...args: T) => string;
  } = {}
): (...args: T) => Promise<R> {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    maxSize = 100,
    keyGenerator = (...args) => JSON.stringify(args)
  } = options;

  const cache = new Map<string, { value: Promise<R>; timestamp: number }>();

  return (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    const now = Date.now();

    // Check if we have a valid cached result
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.value;
    }

    // Clean up expired entries
    for (const [cacheKey, entry] of cache.entries()) {
      if (now - entry.timestamp >= ttl) {
        cache.delete(cacheKey);
      }
    }

    // Limit cache size
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    // Execute and cache the operation
    const promise = operation(...args).catch(error => {
      // Remove failed operations from cache
      cache.delete(key);
      throw error;
    });

    cache.set(key, { value: promise, timestamp: now });
    return promise;
  };
}

/**
 * Async operation with automatic cleanup
 */
export async function withCleanup<T>(
  operation: () => Promise<T>,
  cleanup: () => void | Promise<void>
): Promise<T> {
  try {
    const result = await operation();
    return result;
  } finally {
    try {
      await cleanup();
    } catch (cleanupError) {
      logger.warn('Cleanup operation failed', { error: cleanupError });
    }
  }
}

/**
 * Race multiple async operations with timeout
 */
export async function raceWithTimeout<T>(
  operations: Array<() => Promise<T>>,
  timeout: number
): Promise<T> {
  const operationPromises = operations.map(op => op());
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new NetworkError(
        `Race operation timed out after ${timeout}ms`,
        'RACE_TIMEOUT',
        { timeout, operationCount: operations.length }
      ));
    }, timeout);
  });

  return Promise.race([...operationPromises, timeoutPromise]);
}

/**
 * Async operation with progress tracking
 */
export async function withProgress<T>(
  operation: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
  onProgress: (progress: number, message?: string) => void
): Promise<T> {
  let lastProgress = 0;
  
  const updateProgress = (progress: number, message?: string) => {
    // Ensure progress only moves forward
    if (progress > lastProgress) {
      lastProgress = progress;
      onProgress(Math.min(progress, 100), message);
    }
  };

  try {
    const result = await operation(updateProgress);
    updateProgress(100, 'Completed');
    return result;
  } catch (error) {
    updateProgress(lastProgress, 'Failed');
    throw error;
  }
}