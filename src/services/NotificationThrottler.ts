export interface ThrottleConfig {
  maxPerSecond: number;
  maxPerMinute: number;
  maxPerHour: number;
}

class NotificationThrottler {
  private timestamps: number[] = [];
  private config: ThrottleConfig = {
    maxPerSecond: 10,
    maxPerMinute: 100,
    maxPerHour: 1000,
  };

  canSend(): boolean {
    const now = Date.now();
    this.cleanup(now);

    const secondCount = this.countInWindow(now, 1000);
    const minuteCount = this.countInWindow(now, 60000);
    const hourCount = this.countInWindow(now, 3600000);

    return (
      secondCount < this.config.maxPerSecond &&
      minuteCount < this.config.maxPerMinute &&
      hourCount < this.config.maxPerHour
    );
  }

  record(): void {
    this.timestamps.push(Date.now());
  }

  private countInWindow(now: number, windowMs: number): number {
    return this.timestamps.filter((ts) => now - ts < windowMs).length;
  }

  private cleanup(now: number): void {
    const oneHourAgo = now - 3600000;
    this.timestamps = this.timestamps.filter((ts) => ts > oneHourAgo);
  }

  setConfig(config: Partial<ThrottleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ThrottleConfig {
    return { ...this.config };
  }

  getCountInLastSecond(): number {
    return this.countInWindow(Date.now(), 1000);
  }

  getCountInLastMinute(): number {
    return this.countInWindow(Date.now(), 60000);
  }

  getCountInLastHour(): number {
    return this.countInWindow(Date.now(), 3600000);
  }

  reset(): void {
    this.timestamps = [];
  }
}

export const notificationThrottler = new NotificationThrottler();
