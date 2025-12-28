import { analyticsService } from './analytics.service';

type EngagementEvent = {
  element: string;
  action: 'click' | 'hover' | 'scroll' | 'input' | 'submit';
  metadata?: Record<string, any>;
};

export class EngagementTracker {
  private static instance: EngagementTracker;
  private trackedElements = new Set<string>();
  private readonly sessionStartTime: number;
  private lastActivityTime: number;
  private idleTimeout: NodeJS.Timeout | null = null;
  private readonly IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.sessionStartTime = Date.now();
    this.lastActivityTime = this.sessionStartTime;
    this.setupActivityListeners();
  }

  public static getInstance(): EngagementTracker {
    if (!EngagementTracker.instance) {
      EngagementTracker.instance = new EngagementTracker();
    }
    return EngagementTracker.instance;
  }

  private setupActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const events: (keyof WindowEventMap)[] = [
      'click',
      'scroll',
      'keydown',
      'mousemove',
      'touchstart',
      'wheel',
    ];

    const handleActivity = () => {
      this.lastActivityTime = Date.now();
      if (this.idleTimeout) {
        clearTimeout(this.idleTimeout);
      }
      this.idleTimeout = setTimeout(() => this.trackIdleSession(), this.IDLE_TIMEOUT_MS);
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackSessionDuration();
      }
    });

    // Track beforeunload
    window.addEventListener('beforeunload', () => {
      this.trackSessionDuration();
    });
  }

  private trackIdleSession(): void {
    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000; // in seconds
    analyticsService.trackEvent('session_idle', {
      session_duration: sessionDuration,
      last_activity: new Date(this.lastActivityTime).toISOString(),
    });
  }

  private trackSessionDuration(): void {
    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000; // in seconds
    analyticsService.trackEvent('session_end', {
      duration_seconds: sessionDuration,
      page_url: window.location.pathname,
    });
  }

  public trackEngagement({ element, action, metadata = {} }: EngagementEvent): void {
    const elementId = this.getElementId(element);
    const eventKey = `${elementId}:${action}`;

    // Throttle rapid events from the same element/action
    if (this.trackedElements.has(eventKey)) {
      return;
    }

    this.trackedElements.add(eventKey);
    setTimeout(() => this.trackedElements.delete(eventKey), 1000); // Reset after 1 second

    analyticsService.trackEvent('engagement', {
      element: elementId,
      action,
      ...metadata,
      page_url: typeof window !== 'undefined' ? window.location.pathname : '',
      timestamp: new Date().toISOString(),
    });
  }

  public trackPageView(page: string): void {
    analyticsService.trackPageView(page);
  }

  private getElementId(element: string): string {
    if (typeof document === 'undefined') return element;
    
    try {
      const el = document.querySelector(element);
      if (!el) return element;
      
      // Try to get a meaningful identifier
      return (
        el.id ||
        el.getAttribute('data-testid') ||
        el.getAttribute('aria-label') ||
        element
      );
    } catch (error) {
      console.error('Error getting element ID:', error);
      return element;
    }
  }
}

export const engagementTracker = EngagementTracker.getInstance();

// Helper functions for common tracking scenarios
export function trackClick(element: string, metadata?: Record<string, any>): void {
  engagementTracker.trackEngagement({
    element,
    action: 'click',
    metadata,
  });
}

export function trackInput(element: string, metadata?: Record<string, any>): void {
  engagementTracker.trackEngagement({
    element,
    action: 'input',
    metadata,
  });
}

export function trackSubmit(element: string, metadata?: Record<string, any>): void {
  engagementTracker.trackEngagement({
    element,
    action: 'submit',
    metadata,
  });
}

export function trackScroll(element: string, metadata?: Record<string, any>): void {
  engagementTracker.trackEngagement({
    element,
    action: 'scroll',
    metadata,
  });
}

// Initialize the tracker when the module is loaded
if (typeof window !== 'undefined') {
  engagementTracker.trackPageView(window.location.pathname);
}
