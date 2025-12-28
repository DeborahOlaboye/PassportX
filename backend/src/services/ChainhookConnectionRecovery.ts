import { ExponentialBackoffService } from './ExponentialBackoffService';
import { CircuitBreaker } from './CircuitBreakerService';
import ErrorMonitoringService from './ErrorMonitoringService';

/**
 * ChainhookConnectionRecovery
 *
 * Handles connection failures, automatic reconnection with exponential backoff,
 * and health monitoring for Chainhook node connections.
 */

export interface ConnectionState {
  isConnected: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
  lastError?: string;
  nextReconnectAt?: Date;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  maxReconnectAttempts: number;
  healthCheckInterval: number; // ms
  connectionTimeout: number; // ms
}

export class ChainhookConnectionRecovery {
  private state: ConnectionState = {
    isConnected: false,
    reconnectAttempts: 0
  };

  private backoffService: ExponentialBackoffService;
  private circuitBreaker: CircuitBreaker;
  private errorMonitoring: typeof ErrorMonitoringService;
  private healthCheckInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private logger: any;
  private config: ConnectionConfig;
  private connectionCallback?: () => Promise<void>;
  private disconnectionCallback?: (error?: Error) => Promise<void>;

  constructor(config: ConnectionConfig, logger?: any) {
    this.config = config;
    this.logger = logger || this.getDefaultLogger();
    this.backoffService = new ExponentialBackoffService({
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      multiplier: 2,
      jitterFactor: 0.1,
      maxAttempts: config.maxReconnectAttempts
    });
    this.circuitBreaker = new CircuitBreaker('chainhook-connection', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      volumeThreshold: 3,
      errorThresholdPercentage: 60,
      monitoringPeriod: 60000
    });
    this.errorMonitoring = ErrorMonitoringService;
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    };
  }

  /**
   * Set connection callback
   */
  onConnection(callback: () => Promise<void>): void {
    this.connectionCallback = callback;
  }

  /**
   * Set disconnection callback
   */
  onDisconnection(callback: (error?: Error) => Promise<void>): void {
    this.disconnectionCallback = callback;
  }

  /**
   * Attempt to establish connection
   */
  async connect(): Promise<void> {
    try {
      await this.circuitBreaker.execute(async () => {
        await this.attemptConnection();
      });

      this.onConnectionSuccess();
    } catch (error) {
      this.onConnectionFailure(error as Error);
      throw error;
    }
  }

  /**
   * Actual connection attempt logic
   */
  private async attemptConnection(): Promise<void> {
    this.logger.info(`Attempting to connect to Chainhook node at ${this.config.host}:${this.config.port}`);

    // Simulate connection attempt with timeout
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      // Call the connection callback if provided
      if (this.connectionCallback) {
        this.connectionCallback()
          .then(() => {
            clearTimeout(timeout);
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeout);
            reject(error);
          });
      } else {
        // Default connection logic (simulated)
        setTimeout(() => {
          clearTimeout(timeout);
          resolve();
        }, 100);
      }
    });
  }

  /**
   * Handle successful connection
   */
  private onConnectionSuccess(): void {
    this.state = {
      isConnected: true,
      lastConnected: new Date(),
      reconnectAttempts: 0,
      lastError: undefined,
      nextReconnectAt: undefined
    };

    this.logger.info('Successfully connected to Chainhook node');

    // Start health checks
    this.startHealthChecks();
  }

  /**
   * Handle connection failure
   */
  private onConnectionFailure(error: Error): void {
    this.state.isConnected = false;
    this.state.lastDisconnected = new Date();
    this.state.lastError = error.message;
    this.state.reconnectAttempts++;

    this.logger.error(`Failed to connect to Chainhook node: ${error.message}`);

    // Record error in monitoring service
    this.errorMonitoring.recordError(
      'chainhook_connection_failure',
      error.message,
      'ChainhookConnectionRecovery',
      {
        attempts: this.state.reconnectAttempts,
        host: this.config.host,
        port: this.config.port
      }
    );

    // Call disconnection callback if provided
    if (this.disconnectionCallback) {
      this.disconnectionCallback(error).catch(err => {
        this.logger.error('Error in disconnection callback', err);
      });
    }

    // Schedule reconnection
    this.scheduleReconnection();
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnection(): void {
    // Clear existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const backoff = this.backoffService.calculateBackoff(this.state.reconnectAttempts);

    if (!backoff.shouldRetry) {
      this.logger.error('Max reconnection attempts reached. Connection recovery stopped.');
      this.errorMonitoring.recordError(
        'chainhook_connection_exhausted',
        'Maximum reconnection attempts exceeded',
        'ChainhookConnectionRecovery',
        {
          attempts: this.state.reconnectAttempts,
          maxAttempts: this.config.maxReconnectAttempts
        }
      );
      return;
    }

    this.state.nextReconnectAt = backoff.nextRetryAt;

    this.logger.info(`Scheduling reconnection attempt in ${backoff.delayMs}ms (attempt ${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnect();
    }, backoff.delayMs);
  }

  /**
   * Attempt to reconnect
   */
  private async reconnect(): Promise<void> {
    this.logger.info('Attempting to reconnect to Chainhook node');

    try {
      await this.connect();
    } catch (error) {
      this.logger.error('Reconnection attempt failed', error);
      // scheduleReconnection is called in onConnectionFailure
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);

    this.logger.info('Health checks started');
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    if (!this.state.isConnected) {
      return;
    }

    try {
      await this.circuitBreaker.execute(async () => {
        // Simulate health check (could be replaced with actual ping to Chainhook node)
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Health check timeout'));
          }, 5000);

          // Simulated health check
          setTimeout(() => {
            clearTimeout(timeout);
            resolve();
          }, 100);
        });
      });

      this.logger.debug('Health check passed');
    } catch (error) {
      this.logger.error('Health check failed', error);
      this.handleDisconnection(error as Error);
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(error: Error): void {
    if (!this.state.isConnected) {
      return; // Already handling disconnection
    }

    this.state.isConnected = false;
    this.state.lastDisconnected = new Date();
    this.state.lastError = error.message;

    this.logger.warn('Connection lost to Chainhook node');

    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    // Call disconnection callback
    if (this.disconnectionCallback) {
      this.disconnectionCallback(error).catch(err => {
        this.logger.error('Error in disconnection callback', err);
      });
    }

    // Record error
    this.errorMonitoring.recordError(
      'chainhook_connection_lost',
      error.message,
      'ChainhookConnectionRecovery'
    );

    // Schedule reconnection
    this.scheduleReconnection();
  }

  /**
   * Manually disconnect
   */
  async disconnect(): Promise<void> {
    this.logger.info('Manually disconnecting from Chainhook node');

    this.state.isConnected = false;
    this.state.lastDisconnected = new Date();

    // Clear intervals and timeouts
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    // Call disconnection callback
    if (this.disconnectionCallback) {
      await this.disconnectionCallback();
    }
  }

  /**
   * Force reconnection now
   */
  async reconnectNow(): Promise<void> {
    this.logger.info('Forcing immediate reconnection');

    // Clear scheduled reconnection
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    // Reset reconnect attempts
    this.state.reconnectAttempts = 0;

    await this.connect();
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState() {
    return this.circuitBreaker.getStats();
  }

  /**
   * Reset reconnection attempts
   */
  resetReconnectionAttempts(): void {
    this.state.reconnectAttempts = 0;
    this.logger.info('Reconnection attempts reset');
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.logger.info('Destroying connection recovery service');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.state.isConnected = false;
  }
}
