import { NetworkType } from '@/types/network';

export interface NetworkSwitchEvent {
  timestamp: number;
  fromNetwork: NetworkType;
  toNetwork: NetworkType;
  success: boolean;
  duration?: number;
  error?: string;
}

export interface NetworkStatusEvent {
  timestamp: number;
  network: NetworkType;
  isConnected: boolean;
  latency?: number;
  blockHeight?: number;
  error?: string;
}

export class NetworkAnalytics {
  private static instance: NetworkAnalytics;
  private events: (NetworkSwitchEvent | NetworkStatusEvent)[] = [];
  private readonly MAX_EVENTS = 1000;

  private constructor() {
    this.loadPersistedEvents();
  }

  public static getInstance(): NetworkAnalytics {
    if (!NetworkAnalytics.instance) {
      NetworkAnalytics.instance = new NetworkAnalytics();
    }
    return NetworkAnalytics.instance;
  }

  public trackNetworkSwitch(
    fromNetwork: NetworkType,
    toNetwork: NetworkType,
    success: boolean,
    duration?: number,
    error?: string
  ): void {
    const event: NetworkSwitchEvent = {
      timestamp: Date.now(),
      fromNetwork,
      toNetwork,
      success,
      duration,
      error,
    };

    this.addEvent(event);
  }

  public trackNetworkStatus(
    network: NetworkType,
    isConnected: boolean,
    latency?: number,
    blockHeight?: number,
    error?: string
  ): void {
    const event: NetworkStatusEvent = {
      timestamp: Date.now(),
      network,
      isConnected,
      latency,
      blockHeight,
      error,
    };

    this.addEvent(event);
  }

  private addEvent(event: NetworkSwitchEvent | NetworkStatusEvent): void {
    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    this.persistEvents();
  }

  private persistEvents(): void {
    try {
      const eventsToPersist = this.events.slice(-100); // Only persist last 100 events
      localStorage.setItem('network-analytics-events', JSON.stringify(eventsToPersist));
    } catch (error) {
      console.warn('Failed to persist network analytics events:', error);
    }
  }

  private loadPersistedEvents(): void {
    try {
      const persisted = localStorage.getItem('network-analytics-events');
      if (persisted) {
        this.events = JSON.parse(persisted);
      }
    } catch (error) {
      console.warn('Failed to load persisted network analytics events:', error);
      this.events = [];
    }
  }

  public getNetworkSwitchEvents(): NetworkSwitchEvent[] {
    return this.events.filter((event): event is NetworkSwitchEvent => 'fromNetwork' in event);
  }

  public getNetworkStatusEvents(): NetworkStatusEvent[] {
    return this.events.filter((event): event is NetworkStatusEvent => 'isConnected' in event);
  }

  public getSwitchSuccessRate(): number {
    const switchEvents = this.getNetworkSwitchEvents();
    if (switchEvents.length === 0) return 0;

    const successfulSwitches = switchEvents.filter(event => event.success).length;
    return (successfulSwitches / switchEvents.length) * 100;
  }

  public getAverageSwitchDuration(): number {
    const switchEvents = this.getNetworkSwitchEvents().filter(event => event.success && event.duration);
    if (switchEvents.length === 0) return 0;

    const totalDuration = switchEvents.reduce((sum, event) => sum + (event.duration || 0), 0);
    return totalDuration / switchEvents.length;
  }

  public getNetworkUptime(network: NetworkType): number {
    const statusEvents = this.getNetworkStatusEvents().filter(event => event.network === network);
    if (statusEvents.length === 0) return 0;

    const connectedEvents = statusEvents.filter(event => event.isConnected).length;
    return (connectedEvents / statusEvents.length) * 100;
  }

  public getAverageLatency(network: NetworkType): number {
    const statusEvents = this.getNetworkStatusEvents()
      .filter(event => event.network === network && event.isConnected && event.latency);

    if (statusEvents.length === 0) return 0;

    const totalLatency = statusEvents.reduce((sum, event) => sum + (event.latency || 0), 0);
    return totalLatency / statusEvents.length;
  }

  public exportAnalytics(): string {
    const analytics = {
      summary: {
        totalEvents: this.events.length,
        switchSuccessRate: this.getSwitchSuccessRate(),
        averageSwitchDuration: this.getAverageSwitchDuration(),
        mainnetUptime: this.getNetworkUptime('mainnet'),
        testnetUptime: this.getNetworkUptime('testnet'),
        mainnetAvgLatency: this.getAverageLatency('mainnet'),
        testnetAvgLatency: this.getAverageLatency('testnet'),
      },
      events: this.events,
      exportTimestamp: Date.now(),
    };

    return JSON.stringify(analytics, null, 2);
  }

  public clearAnalytics(): void {
    this.events = [];
    localStorage.removeItem('network-analytics-events');
  }

  public getRecentEvents(count: number = 50): (NetworkSwitchEvent | NetworkStatusEvent)[] {
    return this.events.slice(-count);
  }
}

// Convenience functions for tracking
export const trackNetworkSwitch = (
  fromNetwork: NetworkType,
  toNetwork: NetworkType,
  success: boolean,
  duration?: number,
  error?: string
): void => {
  NetworkAnalytics.getInstance().trackNetworkSwitch(fromNetwork, toNetwork, success, duration, error);
};

export const trackNetworkStatus = (
  network: NetworkType,
  isConnected: boolean,
  latency?: number,
  blockHeight?: number,
  error?: string
): void => {
  NetworkAnalytics.getInstance().trackNetworkStatus(network, isConnected, latency, blockHeight, error);
};