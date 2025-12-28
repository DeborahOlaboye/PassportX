/**
 * CircuitBreakerService
 *
 * Implements the circuit breaker pattern to prevent cascading failures.
 * Monitors failure rates and temporarily blocks requests when thresholds are exceeded.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  successThreshold: number; // Number of successes in half-open before closing
  timeout: number; // Time in ms before attempting to close an open circuit
  volumeThreshold: number; // Minimum number of calls before evaluating failure rate
  errorThresholdPercentage: number; // Percentage of errors to trigger opening (0-100)
  monitoringPeriod: number; // Time window in ms for monitoring failures
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  lastStateChange: Date;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
  rejectedCalls: number;
}

interface CallRecord {
  timestamp: number;
  success: boolean;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private lastStateChange: Date = new Date();
  private nextAttempt: number = 0;
  private callHistory: CallRecord[] = [];
  private totalCalls: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private rejectedCalls: number = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      this.rejectedCalls++;
      throw new Error(`Circuit breaker '${this.name}' is OPEN. Request rejected.`);
    }

    this.totalCalls++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if circuit breaker allows execution
   */
  private canExecute(): boolean {
    const now = Date.now();

    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      if (now >= this.nextAttempt) {
        this.setState('HALF_OPEN');
        return true;
      }
      return false;
    }

    if (this.state === 'HALF_OPEN') {
      return true;
    }

    return false;
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successCount++;
    this.totalSuccesses++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.lastSuccessTime = new Date();

    this.recordCall(true);

    if (this.state === 'HALF_OPEN') {
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        this.setState('CLOSED');
        this.reset();
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.totalFailures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = new Date();

    this.recordCall(false);

    if (this.state === 'HALF_OPEN') {
      this.setState('OPEN');
      this.nextAttempt = Date.now() + this.config.timeout;
      return;
    }

    if (this.state === 'CLOSED') {
      if (this.shouldOpen()) {
        this.setState('OPEN');
        this.nextAttempt = Date.now() + this.config.timeout;
      }
    }
  }

  /**
   * Determine if circuit should open based on failure rate
   */
  private shouldOpen(): boolean {
    // Clean old call history
    this.cleanCallHistory();

    const recentCalls = this.callHistory.length;

    // Not enough calls to make a decision
    if (recentCalls < this.config.volumeThreshold) {
      return false;
    }

    // Check consecutive failures threshold
    if (this.consecutiveFailures >= this.config.failureThreshold) {
      return true;
    }

    // Check error percentage threshold
    const recentFailures = this.callHistory.filter(call => !call.success).length;
    const errorPercentage = (recentFailures / recentCalls) * 100;

    return errorPercentage >= this.config.errorThresholdPercentage;
  }

  /**
   * Record a call in history
   */
  private recordCall(success: boolean): void {
    this.callHistory.push({
      timestamp: Date.now(),
      success
    });

    this.cleanCallHistory();
  }

  /**
   * Remove old calls outside monitoring period
   */
  private cleanCallHistory(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.callHistory = this.callHistory.filter(call => call.timestamp > cutoff);
  }

  /**
   * Change circuit state
   */
  private setState(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();

    console.log(
      `Circuit breaker '${this.name}' state changed: ${oldState} -> ${newState}`
    );
  }

  /**
   * Reset circuit breaker statistics
   */
  private reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
  }

  /**
   * Force circuit to open state
   */
  forceOpen(): void {
    this.setState('OPEN');
    this.nextAttempt = Date.now() + this.config.timeout;
  }

  /**
   * Force circuit to close state
   */
  forceClose(): void {
    this.setState('CLOSED');
    this.reset();
  }

  /**
   * Force circuit to half-open state
   */
  forceHalfOpen(): void {
    this.setState('HALF_OPEN');
  }

  /**
   * Get current statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastStateChange: this.lastStateChange,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      rejectedCalls: this.rejectedCalls
    };
  }

  /**
   * Get circuit breaker name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }
}

/**
 * CircuitBreakerRegistry
 *
 * Manages multiple circuit breakers for different services/endpoints
 */
export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    volumeThreshold: 10,
    errorThresholdPercentage: 50,
    monitoringPeriod: 60000 // 1 minute
  };

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const breakerConfig = { ...this.defaultConfig, ...config };
      const breaker = new CircuitBreaker(name, breakerConfig);
      this.breakers.set(name, breaker);
    }

    return this.breakers.get(name)!;
  }

  /**
   * Remove a circuit breaker
   */
  removeBreaker(name: string): boolean {
    return this.breakers.delete(name);
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): CircuitBreaker[] {
    return Array.from(this.breakers.values());
  }

  /**
   * Get statistics for all breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });

    return stats;
  }

  /**
   * Clear all circuit breakers
   */
  clear(): void {
    this.breakers.clear();
  }
}

export default new CircuitBreakerRegistry();
