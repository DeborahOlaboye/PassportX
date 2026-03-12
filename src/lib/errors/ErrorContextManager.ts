import { AsyncLocalStorage } from 'async_hooks';

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  component?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
  stackTrace?: string[];
}

export class ErrorContextManager {
  private static instance: ErrorContextManager;
  private asyncLocalStorage: AsyncLocalStorage<ErrorContext>;
  private globalContext: Partial<ErrorContext> = {};

  private constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage<ErrorContext>();
  }

  static getInstance(): ErrorContextManager {
    if (!ErrorContextManager.instance) {
      ErrorContextManager.instance = new ErrorContextManager();
    }
    return ErrorContextManager.instance;
  }

  setGlobalContext(context: Partial<ErrorContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  getGlobalContext(): Partial<ErrorContext> {
    return { ...this.globalContext };
  }

  getCurrentContext(): ErrorContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  runWithContext<T>(context: ErrorContext, callback: () => T): T {
    const mergedContext = {
      ...this.globalContext,
      ...context,
      timestamp: Date.now()
    };
    return this.asyncLocalStorage.run(mergedContext, callback);
  }

  async runWithContextAsync<T>(
    context: ErrorContext,
    callback: () => Promise<T>
  ): Promise<T> {
    const mergedContext = {
      ...this.globalContext,
      ...context,
      timestamp: Date.now()
    };
    return this.asyncLocalStorage.run(mergedContext, callback);
  }

  addToCurrentContext(additionalContext: Partial<ErrorContext>): void {
    const current = this.getCurrentContext();
    if (current) {
      Object.assign(current, additionalContext);
    }
  }

  createRequestContext(requestId: string, userId?: string): ErrorContext {
    return {
      requestId,
      userId,
      timestamp: Date.now(),
      metadata: {}
    };
  }

  createOperationContext(operation: string, component?: string): ErrorContext {
    const current = this.getCurrentContext();
    return {
      ...current,
      operation,
      component,
      timestamp: Date.now()
    };
  }

  captureStackTrace(): string[] {
    const stack = new Error().stack;
    if (!stack) return [];
    
    return stack
      .split('\n')
      .slice(2) // Remove Error and captureStackTrace lines
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  enrichErrorWithContext(error: Error): Error & { context?: ErrorContext } {
    const context = this.getCurrentContext();
    const enrichedError = error as Error & { context?: ErrorContext };
    
    if (context) {
      enrichedError.context = {
        ...context,
        stackTrace: this.captureStackTrace()
      };
    }
    
    return enrichedError;
  }

  formatContextForLogging(context?: ErrorContext): Record<string, unknown> {
    if (!context) return {};
    
    return {
      requestId: context.requestId,
      userId: context.userId,
      operation: context.operation,
      component: context.component,
      timestamp: context.timestamp,
      metadata: context.metadata
    };
  }

  clearContext(): void {
    // Context is automatically cleared when async operation completes
    // This method is for manual cleanup if needed
  }
}

export const errorContextManager = ErrorContextManager.getInstance();

// Utility decorators for automatic context management
export function withErrorContext(operation: string, component?: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    descriptor.value = function (this: any, ...args: any[]) {
      const context = errorContextManager.createOperationContext(operation, component);
      return errorContextManager.runWithContext(context, () => {
        return originalMethod.apply(this, args);
      });
    } as T;

    return descriptor;
  };
}

export function withAsyncErrorContext(operation: string, component?: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    descriptor.value = async function (this: any, ...args: any[]) {
      const context = errorContextManager.createOperationContext(operation, component);
      return errorContextManager.runWithContextAsync(context, () => {
        return originalMethod.apply(this, args);
      });
    } as T;

    return descriptor;
  };
}