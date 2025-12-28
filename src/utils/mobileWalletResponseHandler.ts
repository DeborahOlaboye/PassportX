import { ConnectedWallet } from '@/contexts/WalletConnectContext';

export interface MobileWalletResponse {
  type: 'connect' | 'disconnect' | 'sign' | 'transaction';
  success: boolean;
  data?: any;
  error?: string;
  walletType?: 'xverse' | 'hiro' | 'leather';
  timestamp: number;
}

export interface WalletConnectionRequest {
  uri: string;
  sessionTopic: string;
  walletType?: 'xverse' | 'hiro' | 'leather';
  timestamp: number;
  expiresAt: number;
}

export class MobileWalletResponseHandler {
  private static instance: MobileWalletResponseHandler;
  private pendingRequests: Map<string, WalletConnectionRequest> = new Map();
  private responseListeners: Set<(response: MobileWalletResponse) => void> = new Set();

  private constructor() {
    this.setupMessageListener();
    this.setupStorageListener();
  }

  public static getInstance(): MobileWalletResponseHandler {
    if (!MobileWalletResponseHandler.instance) {
      MobileWalletResponseHandler.instance = new MobileWalletResponseHandler();
    }
    return MobileWalletResponseHandler.instance;
  }

  private setupMessageListener(): void {
    if (typeof window === 'undefined') return;

    // Listen for messages from mobile wallets (via postMessage)
    window.addEventListener('message', (event) => {
      // Only accept messages from trusted origins
      const trustedOrigins = [
        'https://xverse.app',
        'https://www.xverse.app',
        'https://wallet.hiro.so',
        'https://leather.io',
        'https://app.leather.io',
      ];

      if (!trustedOrigins.includes(event.origin)) return;

      this.handleWalletMessage(event.data);
    });

    // Listen for WalletConnect responses
    window.addEventListener('walletconnect_response', (event: any) => {
      this.handleWalletConnectResponse(event.detail);
    });
  }

  private setupStorageListener(): void {
    if (typeof window === 'undefined') return;

    // Listen for storage changes (used as a communication channel)
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('walletconnect_response_')) {
        try {
          const response: MobileWalletResponse = JSON.parse(event.newValue || '{}');
          this.handleWalletResponse(response);
        } catch (error) {
          console.error('Failed to parse wallet response from storage:', error);
        }
      }
    });
  }

  public initiateConnection(uri: string, walletType?: 'xverse' | 'hiro' | 'leather'): string {
    const sessionTopic = this.extractSessionTopic(uri);
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const request: WalletConnectionRequest = {
      uri,
      sessionTopic,
      walletType,
      timestamp: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
    };

    this.pendingRequests.set(requestId, request);

    // Store in sessionStorage for persistence
    sessionStorage.setItem(`wallet_request_${requestId}`, JSON.stringify(request));

    return requestId;
  }

  private extractSessionTopic(uri: string): string {
    try {
      const url = new URL(uri);
      const topic = url.pathname.split(':')[1]?.split('@')[0];
      return topic || uri;
    } catch {
      return uri;
    }
  }

  private handleWalletMessage(data: any): void {
    if (!data || typeof data !== 'object') return;

    const response: MobileWalletResponse = {
      type: data.type || 'connect',
      success: data.success !== false,
      data: data.data,
      error: data.error,
      walletType: data.walletType,
      timestamp: Date.now(),
    };

    this.handleWalletResponse(response);
  }

  private handleWalletConnectResponse(detail: any): void {
    const response: MobileWalletResponse = {
      type: 'connect',
      success: !detail.error,
      data: detail.result,
      error: detail.error?.message,
      timestamp: Date.now(),
    };

    this.handleWalletResponse(response);
  }

  private handleWalletResponse(response: MobileWalletResponse): void {
    // Find matching pending request
    const matchingRequest = Array.from(this.pendingRequests.entries()).find(([_, request]) => {
      // Match by session topic or other criteria
      return true; // For now, accept all responses
    });

    if (matchingRequest) {
      const [requestId] = matchingRequest;
      this.pendingRequests.delete(requestId);
      sessionStorage.removeItem(`wallet_request_${requestId}`);
    }

    // Notify listeners
    this.responseListeners.forEach(listener => {
      try {
        listener(response);
      } catch (error) {
        console.error('Error in wallet response listener:', error);
      }
    });

    // Store response for debugging
    this.storeResponseForDebugging(response);
  }

  private storeResponseForDebugging(response: MobileWalletResponse): void {
    try {
      const existing = JSON.parse(localStorage.getItem('wallet_responses') || '[]');
      existing.push(response);

      // Keep only last 10 responses
      if (existing.length > 10) {
        existing.shift();
      }

      localStorage.setItem('wallet_responses', JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to store wallet response for debugging:', error);
    }
  }

  public addResponseListener(listener: (response: MobileWalletResponse) => void): () => void {
    this.responseListeners.add(listener);

    // Return cleanup function
    return () => {
      this.responseListeners.delete(listener);
    };
  }

  public waitForResponse(requestId: string, timeout: number = 30000): Promise<MobileWalletResponse> {
    return new Promise((resolve, reject) => {
      const request = this.pendingRequests.get(requestId);
      if (!request) {
        reject(new Error('Request not found'));
        return;
      }

      if (Date.now() > request.expiresAt) {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request expired'));
        return;
      }

      const cleanup = this.addResponseListener((response) => {
        cleanup();
        resolve(response);
      });

      // Set timeout
      setTimeout(() => {
        cleanup();
        this.pendingRequests.delete(requestId);
        reject(new Error('Response timeout'));
      }, timeout);
    });
  }

  public getPendingRequests(): WalletConnectionRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  public clearExpiredRequests(): void {
    const now = Date.now();
    for (const [requestId, request] of this.pendingRequests.entries()) {
      if (now > request.expiresAt) {
        this.pendingRequests.delete(requestId);
        sessionStorage.removeItem(`wallet_request_${requestId}`);
      }
    }
  }

  public cleanup(): void {
    this.pendingRequests.clear();
    this.responseListeners.clear();

    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('wallet_request_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

// Convenience functions
export const initiateMobileWalletConnection = (
  uri: string,
  walletType?: 'xverse' | 'hiro' | 'leather'
): string => {
  return MobileWalletResponseHandler.getInstance().initiateConnection(uri, walletType);
};

export const waitForMobileWalletResponse = (
  requestId: string,
  timeout?: number
): Promise<MobileWalletResponse> => {
  return MobileWalletResponseHandler.getInstance().waitForResponse(requestId, timeout);
};

export const addMobileWalletResponseListener = (
  listener: (response: MobileWalletResponse) => void
): (() => void) => {
  return MobileWalletResponseHandler.getInstance().addResponseListener(listener);
};