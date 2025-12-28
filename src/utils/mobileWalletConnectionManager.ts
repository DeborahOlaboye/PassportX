import { MobileWalletResponseHandler } from './mobileWalletResponseHandler';
import { MobileWalletAnalytics } from './mobileWalletAnalytics';
import MobileWalletDeepLinkHandler from './mobileWalletDeepLinkHandler';
import { createStacksWalletConfig, createWalletConnectUri, openMobileWallet } from './stacksWalletConnect';
import { MobileUXOptimizer } from './mobileUXOptimizer';

export type WalletType = 'xverse' | 'hiro' | 'leather';
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed' | 'timeout' | 'cancelled';

export interface ConnectionOptions {
  walletType: WalletType;
  timeout?: number;
  enableAnalytics?: boolean;
  enableHapticFeedback?: boolean;
  onStatusChange?: (status: ConnectionStatus) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface ConnectionResult {
  success: boolean;
  data?: any;
  error?: string;
  sessionId?: string;
  duration: number;
}

class MobileWalletConnectionManager {
  private static instance: MobileWalletConnectionManager;
  private responseHandler: MobileWalletResponseHandler;
  private analytics: MobileWalletAnalytics;
  private deepLinkHandler: MobileWalletDeepLinkHandler;
  private uxOptimizer: MobileUXOptimizer;
  private activeConnections: Map<string, ConnectionOptions> = new Map();

  private constructor() {
    this.responseHandler = MobileWalletResponseHandler.getInstance();
    this.analytics = MobileWalletAnalytics.getInstance();
    this.deepLinkHandler = MobileWalletDeepLinkHandler.getInstance();
    this.uxOptimizer = MobileUXOptimizer.getInstance();
  }

  static getInstance(): MobileWalletConnectionManager {
    if (!MobileWalletConnectionManager.instance) {
      MobileWalletConnectionManager.instance = new MobileWalletConnectionManager();
    }
    return MobileWalletConnectionManager.instance;
  }

  async connect(options: ConnectionOptions): Promise<ConnectionResult> {
    const startTime = Date.now();
    const sessionId = this.generateSessionId();

    this.activeConnections.set(sessionId, options);

    try {
      // Update status
      options.onStatusChange?.('connecting');

      // Track analytics
      if (options.enableAnalytics !== false) {
        this.analytics.trackConnectionStart(options.walletType, sessionId);
      }

      // Create WalletConnect configuration
      const config = createStacksWalletConfig();
      const uri = createWalletConnectUri(config);

      // Set up deep link handler
      const deepLinkPromise = this.setupDeepLinkHandler(sessionId, options);

      // Open mobile wallet
      const walletOpened = await openMobileWallet(options.walletType, uri);

      if (!walletOpened) {
        throw new Error('Failed to open mobile wallet');
      }

      // Provide haptic feedback
      if (options.enableHapticFeedback !== false) {
        this.uxOptimizer.triggerHapticFeedback('light');
      }

      // Wait for response with timeout
      const timeout = options.timeout || 300000; // 5 minutes default
      const response = await this.waitForResponse(sessionId, timeout);

      const duration = Date.now() - startTime;

      if (response.success) {
        options.onStatusChange?.('connected');
        options.onSuccess?.(response.data);

        if (options.enableAnalytics !== false) {
          this.analytics.trackConnectionSuccess(options.walletType, sessionId, duration);
        }

        if (options.enableHapticFeedback !== false) {
          this.uxOptimizer.triggerHapticFeedback('success');
        }

        return {
          success: true,
          data: response.data,
          sessionId,
          duration,
        };
      } else {
        throw new Error(response.error || 'Connection failed');
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      options.onStatusChange?.('failed');
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));

      if (options.enableAnalytics !== false) {
        this.analytics.trackConnectionFailure(options.walletType, sessionId, errorMessage, duration);
      }

      if (options.enableHapticFeedback !== false) {
        this.uxOptimizer.triggerHapticFeedback('error');
      }

      return {
        success: false,
        error: errorMessage,
        sessionId,
        duration,
      };
    } finally {
      this.activeConnections.delete(sessionId);
    }
  }

  private setupDeepLinkHandler(sessionId: string, options: ConnectionOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const handler = {
        onDeepLink: (data: any) => {
          if (data.result === 'success') {
            resolve();
          } else if (data.result === 'error' || data.result === 'cancelled') {
            reject(new Error(data.error || 'Connection cancelled'));
          }
        },
        onError: (error: Error) => {
          reject(error);
        },
      };

      this.deepLinkHandler.registerHandler(sessionId, handler);

      // Clean up handler after timeout
      setTimeout(() => {
        this.deepLinkHandler.unregisterHandler(sessionId);
      }, options.timeout || 300000);
    });
  }

  private async waitForResponse(sessionId: string, timeout: number): Promise<{ success: boolean; data?: any; error?: string }> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.activeConnections.get(sessionId)?.onStatusChange?.('timeout');
        reject(new Error('Connection timeout'));
      }, timeout);

      const responseCallback = (response: any) => {
        clearTimeout(timeoutId);
        resolve(response);
      };

      const errorCallback = (error: Error) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      // Set up response listener
      this.responseHandler.waitForResponse(sessionId, timeout / 1000)
        .then(responseCallback)
        .catch(errorCallback);
    });
  }

  cancelConnection(sessionId: string): void {
    const options = this.activeConnections.get(sessionId);
    if (options) {
      options.onStatusChange?.('cancelled');
      this.activeConnections.delete(sessionId);

      if (options.enableAnalytics !== false) {
        this.analytics.trackConnectionCancelled(options.walletType, sessionId);
      }
    }
  }

  getActiveConnections(): string[] {
    return Array.from(this.activeConnections.keys());
  }

  isConnecting(sessionId: string): boolean {
    return this.activeConnections.has(sessionId);
  }

  private generateSessionId(): string {
    return `wc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility method to check if a wallet is supported on the current device
  async isWalletSupported(walletType: WalletType): Promise<boolean> {
    try {
      return await this.deepLinkHandler.canOpenWallet(walletType);
    } catch (error) {
      console.error(`Error checking wallet support for ${walletType}:`, error);
      return false;
    }
  }

  // Get connection statistics
  getConnectionStats() {
    return this.analytics.getStats();
  }

  // Clear all active connections
  clearAllConnections(): void {
    for (const sessionId of this.activeConnections.keys()) {
      this.cancelConnection(sessionId);
    }
  }
}

export default MobileWalletConnectionManager;