export interface RateLimitConfig {
  maxNotifications: number;
  windowMs: number;
}

class NotificationRateLimiter {
  private notifications: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxNotifications: 10, windowMs: 60000 }) {
    this.config = config;
  }

  canSend(userId: string): boolean {
    const now = Date.now();
    const userNotifications = this.notifications.get(userId) || [];
    
    const recentNotifications = userNotifications.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    if (recentNotifications.length >= this.config.maxNotifications) {
      return false;
    }

    recentNotifications.push(now);
    this.notifications.set(userId, recentNotifications);
    return true;
  }

  getRemainingCount(userId: string): number {
    const now = Date.now();
    const userNotifications = this.notifications.get(userId) || [];
    const recentNotifications = userNotifications.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );
    return Math.max(0, this.config.maxNotifications - recentNotifications.length);
  }

  reset(userId: string): void {
    this.notifications.delete(userId);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [userId, timestamps] of this.notifications.entries()) {
      const recent = timestamps.filter((t) => now - t < this.config.windowMs);
      if (recent.length === 0) {
        this.notifications.delete(userId);
      } else {
        this.notifications.set(userId, recent);
      }
    }
  }
}

export const notificationRateLimiter = new NotificationRateLimiter();
