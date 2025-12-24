import { v4 as uuidv4 } from 'uuid';

type AnalyticsEvent = {
  eventName: string;
  eventData: Record<string, any>;
  timestamp: string;
  sessionId: string;
  walletAddress?: string;
};

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private walletAddress: string | null = null;
  private readonly apiEndpoint: string;

  private constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.apiEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || '/api/analytics';
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public setWalletAddress(address: string): void {
    this.walletAddress = address;
  }

  public trackWalletConnect(): void {
    this.trackEvent('wallet_connected', {
      wallet_type: 'walletconnect',
      wallet_address: this.walletAddress || 'unknown',
    });
  }

  public trackTransactionCompleted(transactionHash: string, method: string): void {
    this.trackEvent('transaction_completed', {
      transaction_hash: transactionHash,
      method,
      wallet_address: this.walletAddress || 'unknown',
    });
  }

  public trackError(error: Error, context: Record<string, any> = {}): void {
    this.trackEvent('error_occurred', {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      ...context,
    });
  }

  public trackPageView(page: string): void {
    this.trackEvent('page_view', {
      page,
      referrer: typeof window !== 'undefined' ? document.referrer : '',
    });
  }

  private async trackEvent(eventName: string, eventData: Record<string, any> = {}): Promise<void> {
    const event: AnalyticsEvent = {
      eventName,
      eventData,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      walletAddress: this.walletAddress || undefined,
    };

    try {
      // In development, log to console instead of sending to server
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', eventName, eventData);
        return;
      }

      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server-session';
    }

    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }
}

export const analyticsService = AnalyticsService.getInstance();
