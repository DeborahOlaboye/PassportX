export interface MobileWalletEvent {
  timestamp: number;
  eventType: 'connection_attempt' | 'connection_success' | 'connection_failure' | 'qr_scan' | 'deep_link_open' | 'response_received';
  walletType?: 'xverse' | 'hiro' | 'leather';
  platform: 'ios' | 'android' | 'desktop';
  sessionId: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface MobileWalletMetrics {
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  averageConnectionTime: number;
  platformBreakdown: Record<string, number>;
  walletBreakdown: Record<string, number>;
  errorBreakdown: Record<string, number>;
}

export class MobileWalletAnalytics {
  private static instance: MobileWalletAnalytics;
  private events: MobileWalletEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private sessionStartTimes: Map<string, number> = new Map();

  private constructor() {
    this.loadPersistedEvents();
  }

  public static getInstance(): MobileWalletAnalytics {
    if (!MobileWalletAnalytics.instance) {
      MobileWalletAnalytics.instance = new MobileWalletAnalytics();
    }
    return MobileWalletAnalytics.instance;
  }

  public trackConnectionAttempt(walletType: 'xverse' | 'hiro' | 'leather', sessionId: string): void {
    const platform = this.detectPlatform();
    const event: MobileWalletEvent = {
      timestamp: Date.now(),
      eventType: 'connection_attempt',
      walletType,
      platform,
      sessionId,
    };

    this.sessionStartTimes.set(sessionId, Date.now());
    this.addEvent(event);
  }

  public trackConnectionSuccess(walletType: 'xverse' | 'hiro' | 'leather', sessionId: string): void {
    const startTime = this.sessionStartTimes.get(sessionId);
    const duration = startTime ? Date.now() - startTime : undefined;
    const platform = this.detectPlatform();

    const event: MobileWalletEvent = {
      timestamp: Date.now(),
      eventType: 'connection_success',
      walletType,
      platform,
      sessionId,
      duration,
    };

    this.addEvent(event);
    this.sessionStartTimes.delete(sessionId);
  }

  public trackConnectionFailure(
    walletType: 'xverse' | 'hiro' | 'leather',
    sessionId: string,
    error: string
  ): void {
    const startTime = this.sessionStartTimes.get(sessionId);
    const duration = startTime ? Date.now() - startTime : undefined;
    const platform = this.detectPlatform();

    const event: MobileWalletEvent = {
      timestamp: Date.now(),
      eventType: 'connection_failure',
      walletType,
      platform,
      sessionId,
      duration,
      error,
    };

    this.addEvent(event);
    this.sessionStartTimes.delete(sessionId);
  }

  public trackQRScan(sessionId: string): void {
    const platform = this.detectPlatform();
    const event: MobileWalletEvent = {
      timestamp: Date.now(),
      eventType: 'qr_scan',
      platform,
      sessionId,
    };

    this.addEvent(event);
  }

  public trackDeepLinkOpen(walletType: 'xverse' | 'hiro' | 'leather', sessionId: string): void {
    const platform = this.detectPlatform();
    const event: MobileWalletEvent = {
      timestamp: Date.now(),
      eventType: 'deep_link_open',
      walletType,
      platform,
      sessionId,
    };

    this.addEvent(event);
  }

  public trackResponseReceived(sessionId: string, metadata?: Record<string, any>): void {
    const platform = this.detectPlatform();
    const event: MobileWalletEvent = {
      timestamp: Date.now(),
      eventType: 'response_received',
      platform,
      sessionId,
      metadata,
    };

    this.addEvent(event);
  }

  private detectPlatform(): 'ios' | 'android' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    }

    if (/android/.test(userAgent)) {
      return 'android';
    }

    return 'desktop';
  }

  private addEvent(event: MobileWalletEvent): void {
    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    this.persistEvents();
  }

  private persistEvents(): void {
    try {
      const eventsToPersist = this.events.slice(-500); // Persist last 500 events
      localStorage.setItem('mobile-wallet-analytics', JSON.stringify(eventsToPersist));
    } catch (error) {
      console.warn('Failed to persist mobile wallet analytics:', error);
    }
  }

  private loadPersistedEvents(): void {
    try {
      const persisted = localStorage.getItem('mobile-wallet-analytics');
      if (persisted) {
        this.events = JSON.parse(persisted);
      }
    } catch (error) {
      console.warn('Failed to load persisted mobile wallet analytics:', error);
      this.events = [];
    }
  }

  public getMetrics(timeRange?: { start: number; end: number }): MobileWalletMetrics {
    let filteredEvents = this.events;

    if (timeRange) {
      filteredEvents = this.events.filter(
        event => event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
      );
    }

    const connectionAttempts = filteredEvents.filter(e => e.eventType === 'connection_attempt');
    const successfulConnections = filteredEvents.filter(e => e.eventType === 'connection_success');
    const failedConnections = filteredEvents.filter(e => e.eventType === 'connection_failure');

    const totalDuration = successfulConnections.reduce((sum, event) => sum + (event.duration || 0), 0);
    const averageConnectionTime = successfulConnections.length > 0
      ? totalDuration / successfulConnections.length
      : 0;

    const platformBreakdown: Record<string, number> = {};
    const walletBreakdown: Record<string, number> = {};
    const errorBreakdown: Record<string, number> = {};

    filteredEvents.forEach(event => {
      // Platform breakdown
      platformBreakdown[event.platform] = (platformBreakdown[event.platform] || 0) + 1;

      // Wallet breakdown
      if (event.walletType) {
        walletBreakdown[event.walletType] = (walletBreakdown[event.walletType] || 0) + 1;
      }

      // Error breakdown
      if (event.error) {
        errorBreakdown[event.error] = (errorBreakdown[event.error] || 0) + 1;
      }
    });

    return {
      totalConnections: connectionAttempts.length,
      successfulConnections: successfulConnections.length,
      failedConnections: failedConnections.length,
      averageConnectionTime,
      platformBreakdown,
      walletBreakdown,
      errorBreakdown,
    };
  }

  public getSuccessRate(): number {
    const metrics = this.getMetrics();
    const total = metrics.successfulConnections + metrics.failedConnections;
    return total > 0 ? (metrics.successfulConnections / total) * 100 : 0;
  }

  public getRecentEvents(count: number = 50): MobileWalletEvent[] {
    return this.events.slice(-count);
  }

  public exportAnalytics(): string {
    const metrics = this.getMetrics();
    const recentEvents = this.getRecentEvents(100);

    const analytics = {
      summary: {
        successRate: this.getSuccessRate(),
        metrics,
        totalEvents: this.events.length,
      },
      recentEvents,
      exportTimestamp: Date.now(),
    };

    return JSON.stringify(analytics, null, 2);
  }

  public clearAnalytics(): void {
    this.events = [];
    this.sessionStartTimes.clear();
    localStorage.removeItem('mobile-wallet-analytics');
  }

  public getSessionStatus(sessionId: string): {
    status: 'active' | 'success' | 'failed' | 'unknown';
    duration?: number;
    error?: string;
  } {
    const startTime = this.sessionStartTimes.get(sessionId);
    const sessionEvents = this.events.filter(e => e.sessionId === sessionId);

    const successEvent = sessionEvents.find(e => e.eventType === 'connection_success');
    const failureEvent = sessionEvents.find(e => e.eventType === 'connection_failure');

    if (successEvent) {
      return {
        status: 'success',
        duration: successEvent.duration,
      };
    }

    if (failureEvent) {
      return {
        status: 'failed',
        duration: failureEvent.duration,
        error: failureEvent.error,
      };
    }

    if (startTime) {
      return {
        status: 'active',
        duration: Date.now() - startTime,
      };
    }

    return { status: 'unknown' };
  }
}

// Convenience functions for tracking
export const trackMobileWalletConnectionAttempt = (
  walletType: 'xverse' | 'hiro' | 'leather',
  sessionId: string
): void => {
  MobileWalletAnalytics.getInstance().trackConnectionAttempt(walletType, sessionId);
};

export const trackMobileWalletConnectionSuccess = (
  walletType: 'xverse' | 'hiro' | 'leather',
  sessionId: string
): void => {
  MobileWalletAnalytics.getInstance().trackConnectionSuccess(walletType, sessionId);
};

export const trackMobileWalletConnectionFailure = (
  walletType: 'xverse' | 'hiro' | 'leather',
  sessionId: string,
  error: string
): void => {
  MobileWalletAnalytics.getInstance().trackConnectionFailure(walletType, sessionId, error);
};

export const trackMobileWalletQRScan = (sessionId: string): void => {
  MobileWalletAnalytics.getInstance().trackQRScan(sessionId);
};

export const trackMobileWalletDeepLinkOpen = (
  walletType: 'xverse' | 'hiro' | 'leather',
  sessionId: string
): void => {
  MobileWalletAnalytics.getInstance().trackDeepLinkOpen(walletType, sessionId);
};

export const trackMobileWalletResponseReceived = (
  sessionId: string,
  metadata?: Record<string, any>
): void => {
  MobileWalletAnalytics.getInstance().trackResponseReceived(sessionId, metadata);
};