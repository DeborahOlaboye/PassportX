import { useEffect, useCallback } from 'react';

export interface DeepLinkData {
  action: string;
  sessionId?: string;
  result?: 'success' | 'error' | 'cancelled';
  data?: any;
  error?: string;
}

export interface DeepLinkHandler {
  onDeepLink: (data: DeepLinkData) => void;
  onError: (error: Error) => void;
}

class MobileWalletDeepLinkHandler {
  private static instance: MobileWalletDeepLinkHandler;
  private handlers: Map<string, DeepLinkHandler> = new Map();
  private isListening = false;

  static getInstance(): MobileWalletDeepLinkHandler {
    if (!MobileWalletDeepLinkHandler.instance) {
      MobileWalletDeepLinkHandler.instance = new MobileWalletDeepLinkHandler();
    }
    return MobileWalletDeepLinkHandler.instance;
  }

  registerHandler(sessionId: string, handler: DeepLinkHandler): void {
    this.handlers.set(sessionId, handler);
    this.startListening();
  }

  unregisterHandler(sessionId: string): void {
    this.handlers.delete(sessionId);
    if (this.handlers.size === 0) {
      this.stopListening();
    }
  }

  private startListening(): void {
    if (this.isListening) return;

    // Handle custom URL scheme deep links (walletconnect://)
    if (typeof window !== 'undefined') {
      // Listen for custom protocol links
      const handleCustomProtocol = (event: CustomEvent) => {
        this.handleDeepLink(event.detail);
      };

      window.addEventListener('walletconnect' as any, handleCustomProtocol as any);

      // Handle hash changes for web-based deep links
      const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash.startsWith('#wc')) {
          this.handleDeepLinkFromHash(hash);
        }
      };

      window.addEventListener('hashchange', handleHashChange);

      // Handle popstate for history-based navigation
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.walletconnect) {
          this.handleDeepLink(event.state.walletconnect);
        }
      };

      window.addEventListener('popstate', handlePopState);

      // Check for deep link on page load
      if (window.location.hash.startsWith('#wc')) {
        this.handleDeepLinkFromHash(window.location.hash);
      }

      this.isListening = true;
    }
  }

  private stopListening(): void {
    if (!this.isListening) return;

    if (typeof window !== 'undefined') {
      window.removeEventListener('walletconnect' as any, this.handleCustomProtocol as any);
      window.removeEventListener('hashchange', this.handleHashChange);
      window.removeEventListener('popstate', this.handlePopState);
    }

    this.isListening = false;
  }

  private handleCustomProtocol = (event: CustomEvent) => {
    this.handleDeepLink(event.detail);
  };

  private handleHashChange = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#wc')) {
      this.handleDeepLinkFromHash(hash);
    }
  };

  private handlePopState = (event: PopStateEvent) => {
    if (event.state?.walletconnect) {
      this.handleDeepLink(event.state.walletconnect);
    }
  };

  private handleDeepLinkFromHash(hash: string): void {
    try {
      // Parse WalletConnect URI from hash
      const uri = hash.substring(1); // Remove the '#'
      const data: DeepLinkData = {
        action: 'connect',
        sessionId: this.extractSessionId(uri),
        data: { uri }
      };
      this.handleDeepLink(data);
    } catch (error) {
      console.error('Failed to parse deep link from hash:', error);
    }
  }

  private handleDeepLink(data: DeepLinkData): void {
    const sessionId = data.sessionId || 'default';
    const handler = this.handlers.get(sessionId);

    if (handler) {
      try {
        handler.onDeepLink(data);
      } catch (error) {
        console.error('Error in deep link handler:', error);
        handler.onError(error as Error);
      }
    } else {
      console.warn('No handler registered for session:', sessionId);
    }
  }

  private extractSessionId(uri: string): string | undefined {
    try {
      // Parse WalletConnect URI to extract session ID
      const url = new URL(uri);
      const params = new URLSearchParams(url.search);
      return params.get('sessionId') || undefined;
    } catch (error) {
      console.error('Failed to extract session ID from URI:', error);
      return undefined;
    }
  }

  // Utility method to create deep link URLs
  createDeepLink(walletType: 'xverse' | 'hiro' | 'leather', uri: string): string {
    const baseUrls = {
      xverse: 'xverse://wc',
      hiro: 'hiro://wc',
      leather: 'leather://wc',
    };

    const baseUrl = baseUrls[walletType];
    return `${baseUrl}?uri=${encodeURIComponent(uri)}`;
  }

  // Check if device supports deep linking for a specific wallet
  async canOpenWallet(walletType: 'xverse' | 'hiro' | 'leather'): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const deepLink = this.createDeepLink(walletType, 'test');

    try {
      // Try to open the deep link
      window.location.href = deepLink;

      // If we're still here after a short delay, the app might not be installed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if the page is still visible (app didn't open)
      return document.hidden;
    } catch (error) {
      return false;
    }
  }
}

// React hook for using deep link handler
export function useMobileWalletDeepLink(sessionId: string, handler: DeepLinkHandler) {
  const deepLinkHandler = MobileWalletDeepLinkHandler.getInstance();

  useEffect(() => {
    deepLinkHandler.registerHandler(sessionId, handler);

    return () => {
      deepLinkHandler.unregisterHandler(sessionId);
    };
  }, [sessionId, handler]);

  const createDeepLink = useCallback((walletType: 'xverse' | 'hiro' | 'leather', uri: string) => {
    return deepLinkHandler.createDeepLink(walletType, uri);
  }, []);

  const canOpenWallet = useCallback(async (walletType: 'xverse' | 'hiro' | 'leather') => {
    return deepLinkHandler.canOpenWallet(walletType);
  }, []);

  return {
    createDeepLink,
    canOpenWallet,
  };
}

export default MobileWalletDeepLinkHandler;