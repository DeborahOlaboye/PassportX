import { EventEmitter } from 'events';

export interface BadgeCountUpdate {
  userId: string;
  totalBadges: number;
  activeBadges: number;
  revokedBadges: number;
  softRevokedBadges: number;
  hardRevokedBadges: number;
  lastUpdated: number;
}

export interface CountUpdateMetrics {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  averageUpdateTime: number;
  usersWithZeroBadges: number;
}

export class BadgeCountUpdateService extends EventEmitter {
  private userBadgeCounts: Map<string, BadgeCountUpdate> = new Map();
  private updateHistory: BadgeCountUpdate[] = [];
  private logger: any;
  private metrics: CountUpdateMetrics = {
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    averageUpdateTime: 0,
    usersWithZeroBadges: 0
  };
  private updateTimes: number[] = [];
  private updateCallbacks: ((update: BadgeCountUpdate) => Promise<void>)[] = [];
  private readonly MAX_HISTORY = 10000;

  constructor(logger?: any) {
    super();
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[BadgeCountUpdateService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[BadgeCountUpdateService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[BadgeCountUpdateService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[BadgeCountUpdateService] ${msg}`, ...args)
    };
  }

  registerUpdateCallback(callback: (update: BadgeCountUpdate) => Promise<void>): void {
    this.updateCallbacks.push(callback);
    this.logger.debug('Badge count update callback registered');
  }

  async incrementBadgeCount(userId: string, revocationType?: 'soft' | 'hard'): Promise<BadgeCountUpdate> {
    const startTime = Date.now();

    try {
      const current = this.userBadgeCounts.get(userId) || this.createEmptyCount(userId);

      if (!revocationType) {
        current.totalBadges++;
        current.activeBadges++;
      }

      current.lastUpdated = Date.now();
      this.userBadgeCounts.set(userId, current);

      const updateTime = Date.now() - startTime;
      this.recordUpdateMetrics(true, updateTime);

      await this.notifyUpdateCallbacks(current);
      this.emit('count-updated', current);

      this.logger.debug('Badge count incremented', { userId, revocationType });
      return current;
    } catch (error) {
      const updateTime = Date.now() - startTime;
      this.recordUpdateMetrics(false, updateTime);
      this.logger.error('Error incrementing badge count', { error, userId });
      throw error;
    }
  }

  async decrementBadgeCount(userId: string, revocationType: 'soft' | 'hard'): Promise<BadgeCountUpdate> {
    const startTime = Date.now();

    try {
      const current = this.userBadgeCounts.get(userId) || this.createEmptyCount(userId);

      if (current.totalBadges > 0) {
        current.totalBadges--;
      }

      if (current.activeBadges > 0 && revocationType === 'soft') {
        current.activeBadges--;
        current.softRevokedBadges++;
      } else if (current.activeBadges > 0 && revocationType === 'hard') {
        current.activeBadges--;
        current.hardRevokedBadges++;
      }

      current.revokedBadges = current.softRevokedBadges + current.hardRevokedBadges;
      current.lastUpdated = Date.now();
      this.userBadgeCounts.set(userId, current);

      const updateTime = Date.now() - startTime;
      this.recordUpdateMetrics(true, updateTime);

      this.updateUserZeroStatus(userId, current);
      await this.notifyUpdateCallbacks(current);
      this.emit('count-updated', current);

      this.logger.debug('Badge count decremented', { userId, revocationType, newTotal: current.totalBadges });
      return current;
    } catch (error) {
      const updateTime = Date.now() - startTime;
      this.recordUpdateMetrics(false, updateTime);
      this.logger.error('Error decrementing badge count', { error, userId });
      throw error;
    }
  }

  async updateUserBadgeCounts(userId: string, counts: {
    totalBadges: number;
    activeBadges: number;
    revokedBadges?: number;
    softRevokedBadges?: number;
    hardRevokedBadges?: number;
  }): Promise<BadgeCountUpdate> {
    const startTime = Date.now();

    try {
      const update: BadgeCountUpdate = {
        userId,
        totalBadges: counts.totalBadges,
        activeBadges: counts.activeBadges,
        revokedBadges: counts.revokedBadges ?? 0,
        softRevokedBadges: counts.softRevokedBadges ?? 0,
        hardRevokedBadges: counts.hardRevokedBadges ?? 0,
        lastUpdated: Date.now()
      };

      this.userBadgeCounts.set(userId, update);
      this.updateHistory.push(update);

      if (this.updateHistory.length > this.MAX_HISTORY) {
        this.updateHistory.shift();
      }

      const updateTime = Date.now() - startTime;
      this.recordUpdateMetrics(true, updateTime);

      this.updateUserZeroStatus(userId, update);
      await this.notifyUpdateCallbacks(update);
      this.emit('count-updated', update);

      this.logger.debug('User badge counts updated', { userId, ...counts });
      return update;
    } catch (error) {
      const updateTime = Date.now() - startTime;
      this.recordUpdateMetrics(false, updateTime);
      this.logger.error('Error updating badge counts', { error, userId });
      throw error;
    }
  }

  private createEmptyCount(userId: string): BadgeCountUpdate {
    return {
      userId,
      totalBadges: 0,
      activeBadges: 0,
      revokedBadges: 0,
      softRevokedBadges: 0,
      hardRevokedBadges: 0,
      lastUpdated: Date.now()
    };
  }

  private recordUpdateMetrics(success: boolean, updateTime: number): void {
    this.metrics.totalUpdates++;

    if (success) {
      this.metrics.successfulUpdates++;
    } else {
      this.metrics.failedUpdates++;
    }

    this.updateTimes.push(updateTime);
    if (this.updateTimes.length > 1000) {
      this.updateTimes = this.updateTimes.slice(-1000);
    }

    const sum = this.updateTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageUpdateTime = sum / this.updateTimes.length;
  }

  private updateUserZeroStatus(userId: string, counts: BadgeCountUpdate): void {
    if (counts.totalBadges === 0) {
      this.metrics.usersWithZeroBadges++;
    }
  }

  private async notifyUpdateCallbacks(update: BadgeCountUpdate): Promise<void> {
    for (const callback of this.updateCallbacks) {
      try {
        await callback(update);
      } catch (error) {
        this.logger.error('Error in update callback', { error, userId: update.userId });
      }
    }
  }

  getUserBadgeCount(userId: string): BadgeCountUpdate | null {
    return this.userBadgeCounts.get(userId) || null;
  }

  getAllUserCounts(): BadgeCountUpdate[] {
    return Array.from(this.userBadgeCounts.values());
  }

  getUsersWithActiveBadges(): string[] {
    const users: string[] = [];

    for (const [userId, counts] of this.userBadgeCounts.entries()) {
      if (counts.activeBadges > 0) {
        users.push(userId);
      }
    }

    return users;
  }

  getUsersWithRevokedBadges(): string[] {
    const users: string[] = [];

    for (const [userId, counts] of this.userBadgeCounts.entries()) {
      if (counts.revokedBadges > 0) {
        users.push(userId);
      }
    }

    return users;
  }

  getUpdateHistory(limit: number = 100): BadgeCountUpdate[] {
    return this.updateHistory.slice(-limit);
  }

  getUserUpdateHistory(userId: string, limit: number = 100): BadgeCountUpdate[] {
    return this.updateHistory
      .filter(h => h.userId === userId)
      .slice(-limit);
  }

  getMetrics(): CountUpdateMetrics {
    return { ...this.metrics };
  }

  getDetailedMetrics() {
    const successRate = this.metrics.totalUpdates > 0
      ? ((this.metrics.successfulUpdates / this.metrics.totalUpdates) * 100).toFixed(2) + '%'
      : '0%';

    const totalBadges = Array.from(this.userBadgeCounts.values()).reduce((sum, c) => sum + c.totalBadges, 0);
    const totalActiveBadges = Array.from(this.userBadgeCounts.values()).reduce((sum, c) => sum + c.activeBadges, 0);
    const totalRevokedBadges = Array.from(this.userBadgeCounts.values()).reduce((sum, c) => sum + c.revokedBadges, 0);

    return {
      ...this.getMetrics(),
      successRate,
      uniqueUsers: this.userBadgeCounts.size,
      totalBadgesTracked: totalBadges,
      totalActiveBadges,
      totalRevokedBadges,
      revocationRate: totalBadges > 0
        ? ((totalRevokedBadges / totalBadges) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  resetMetrics(): void {
    this.metrics = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      averageUpdateTime: 0,
      usersWithZeroBadges: 0
    };
    this.updateTimes = [];
    this.logger.info('Badge count update metrics reset');
  }

  resetAllCounts(): void {
    this.userBadgeCounts.clear();
    this.updateHistory = [];
    this.logger.info('All badge counts reset');
  }

  destroy(): void {
    this.userBadgeCounts.clear();
    this.updateHistory = [];
    this.updateCallbacks = [];
    this.removeAllListeners();
    this.logger.info('BadgeCountUpdateService destroyed');
  }
}

export default BadgeCountUpdateService;
