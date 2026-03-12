/**
 * Graceful degradation system for non-critical failures
 */

import { logger } from '../logger';
import { ErrorCategory } from './ErrorTypes';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  fallbackValue?: unknown;
  dependencies?: string[];
  criticalLevel: 'critical' | 'important' | 'nice-to-have';
}

export interface DegradationRule {
  triggerConditions: {
    errorCategories?: ErrorCategory[];
    errorCodes?: string[];
    errorRate?: number;
    timeWindow?: number;
  };
  actions: {
    disableFeatures?: string[];
    enableFallbacks?: string[];
    reduceComplexity?: boolean;
    notifyUsers?: boolean;
  };
  recovery: {
    autoRecover?: boolean;
    recoveryDelay?: number;
    healthCheckInterval?: number;
  };
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  features: Record<
    string,
    {
      status: 'active' | 'degraded' | 'disabled';
      lastError?: string;
      errorCount: number;
      lastHealthCheck: number;
    }
  >;
  degradationLevel: number; // 0-100, where 100 is fully degraded
  activeRules: string[];
}

export class GracefulDegradationManager {
  private features = new Map<string, FeatureFlag>();
  private degradationRules = new Map<string, DegradationRule>();
  private systemHealth: SystemHealth = {
    overall: 'healthy',
    features: {},
    degradationLevel: 0,
    activeRules: [],
  };
  private errorCounts = new Map<string, number>();
  private errorTimestamps = new Map<string, number[]>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private onHealthChange?: (health: SystemHealth) => void;

  constructor(
    options: {
      onHealthChange?: (health: SystemHealth) => void;
      healthCheckInterval?: number;
    } = {}
  ) {
    this.onHealthChange = options.onHealthChange;
    this.startHealthMonitoring(options.healthCheckInterval || 30000);
  }

  registerFeature(feature: FeatureFlag): void {
    this.features.set(feature.name, feature);
    this.systemHealth.features[feature.name] = {
      status: feature.enabled ? 'active' : 'disabled',
      errorCount: 0,
      lastHealthCheck: Date.now(),
    };

    logger.info('Feature registered for graceful degradation', {
      featureName: feature.name,
      enabled: feature.enabled,
      criticalLevel: feature.criticalLevel,
    });
  }

  registerDegradationRule(ruleName: string, rule: DegradationRule): void {
    this.degradationRules.set(ruleName, rule);
    logger.info('Degradation rule registered', { ruleName });
  }

  isFeatureEnabled(featureName: string): boolean {
    const feature = this.features.get(featureName);
    if (!feature) {
      logger.warn('Unknown feature requested', { featureName });
      return false;
    }

    const featureHealth = this.systemHealth.features[featureName];
    return feature.enabled && featureHealth?.status === 'active';
  }

  getFeatureFallback<T>(featureName: string, defaultValue: T): T {
    const feature = this.features.get(featureName);

    if (!feature || !this.isFeatureEnabled(featureName)) {
      const fallbackValue = feature?.fallbackValue as T;
      return fallbackValue !== undefined ? fallbackValue : defaultValue;
    }

    return defaultValue;
  }

  async executeWithDegradation<T>(
    featureName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    if (!this.isFeatureEnabled(featureName)) {
      if (fallback) {
        logger.info('Using fallback for disabled feature', { featureName });
        return await fallback();
      }
      throw new Error(
        `Feature ${featureName} is disabled and no fallback provided`
      );
    }

    try {
      const result = await operation();
      this.recordSuccess(featureName);
      return result;
    } catch (error) {
      this.recordError(featureName, error as Error);

      if (fallback) {
        logger.warn('Operation failed, using fallback', {
          featureName,
          error: (error as Error).message,
        });
        return await fallback();
      }

      throw error;
    }
  }

  private recordError(featureName: string, error: Error): void {
    const now = Date.now();

    // Update error count
    const currentCount = this.errorCounts.get(featureName) || 0;
    this.errorCounts.set(featureName, currentCount + 1);

    // Update error timestamps
    const timestamps = this.errorTimestamps.get(featureName) || [];
    timestamps.push(now);
    // Keep only last hour of timestamps
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentTimestamps = timestamps.filter((ts) => ts >= oneHourAgo);
    this.errorTimestamps.set(featureName, recentTimestamps);

    // Update feature health
    const featureHealth = this.systemHealth.features[featureName];
    if (featureHealth) {
      featureHealth.errorCount = currentCount;
      featureHealth.lastError = error.message;
    }

    // Check if degradation rules should be triggered
    this.evaluateDegradationRules();

    logger.warn('Error recorded for feature', {
      featureName,
      errorCount: currentCount,
      recentErrors: recentTimestamps.length,
      error: error.message,
    });
  }

  private recordSuccess(featureName: string): void {
    const featureHealth = this.systemHealth.features[featureName];
    if (featureHealth && featureHealth.status === 'degraded') {
      // Consider recovery if feature was degraded
      this.considerRecovery(featureName);
    }
  }

  private evaluateDegradationRules(): void {
    const now = Date.now();

    for (const [ruleName, rule] of this.degradationRules) {
      const shouldTrigger = this.shouldTriggerRule(rule, now);

      if (shouldTrigger && !this.systemHealth.activeRules.includes(ruleName)) {
        this.triggerDegradation(ruleName, rule);
      }
    }
  }

  private shouldTriggerRule(rule: DegradationRule, now: number): boolean {
    const { triggerConditions } = rule;

    // Check error rate condition
    if (triggerConditions.errorRate && triggerConditions.timeWindow) {
      const windowStart = now - triggerConditions.timeWindow;
      let totalErrors = 0;
      let totalOperations = 0;

      for (const [, timestamps] of this.errorTimestamps) {
        const recentErrors = timestamps.filter((ts) => ts >= windowStart);
        totalErrors += recentErrors.length;
        // Estimate total operations (in a real system, this would be tracked)
        totalOperations += recentErrors.length * 10; // Rough estimate
      }

      const errorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;
      if (errorRate >= triggerConditions.errorRate) {
        return true;
      }
    }

    // Check specific error categories or codes
    // This would require integration with the error handler to track recent errors
    // For now, we'll use a simplified approach based on feature error counts

    return false;
  }

  private triggerDegradation(ruleName: string, rule: DegradationRule): void {
    logger.warn('Triggering degradation rule', { ruleName });

    this.systemHealth.activeRules.push(ruleName);

    // Disable features
    if (rule.actions.disableFeatures) {
      for (const featureName of rule.actions.disableFeatures) {
        this.disableFeature(featureName);
      }
    }

    // Enable fallbacks
    if (rule.actions.enableFallbacks) {
      for (const featureName of rule.actions.enableFallbacks) {
        this.enableFallback(featureName);
      }
    }

    // Update system health
    this.updateSystemHealth();

    // Schedule recovery if auto-recovery is enabled
    if (rule.recovery.autoRecover && rule.recovery.recoveryDelay) {
      setTimeout(() => {
        this.attemptRecovery(ruleName, rule);
      }, rule.recovery.recoveryDelay);
    }

    // Notify about degradation
    if (this.onHealthChange) {
      this.onHealthChange(this.systemHealth);
    }
  }

  private disableFeature(featureName: string): void {
    const feature = this.features.get(featureName);
    if (feature && feature.criticalLevel !== 'critical') {
      const featureHealth = this.systemHealth.features[featureName];
      if (featureHealth) {
        featureHealth.status = 'disabled';
      }

      logger.warn('Feature disabled due to degradation', { featureName });
    }
  }

  private enableFallback(featureName: string): void {
    const featureHealth = this.systemHealth.features[featureName];
    if (featureHealth) {
      featureHealth.status = 'degraded';
    }

    logger.info('Feature fallback enabled', { featureName });
  }

  private attemptRecovery(ruleName: string, rule: DegradationRule): void {
    logger.info('Attempting recovery from degradation', { ruleName });

    // Perform health checks on affected features
    const healthyFeatures: string[] = [];

    if (rule.actions.disableFeatures) {
      for (const featureName of rule.actions.disableFeatures) {
        if (this.performHealthCheck(featureName)) {
          healthyFeatures.push(featureName);
        }
      }
    }

    // Re-enable healthy features
    for (const featureName of healthyFeatures) {
      this.enableFeature(featureName);
    }

    // Remove rule from active rules if all features are healthy
    if (
      healthyFeatures.length === (rule.actions.disableFeatures?.length || 0)
    ) {
      const ruleIndex = this.systemHealth.activeRules.indexOf(ruleName);
      if (ruleIndex > -1) {
        this.systemHealth.activeRules.splice(ruleIndex, 1);
      }

      logger.info('Recovery completed for degradation rule', { ruleName });
    }

    this.updateSystemHealth();

    if (this.onHealthChange) {
      this.onHealthChange(this.systemHealth);
    }
  }

  private performHealthCheck(featureName: string): boolean {
    // Simple health check based on recent error rate
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const timestamps = this.errorTimestamps.get(featureName) || [];
    const recentErrors = timestamps.filter((ts) => ts >= fiveMinutesAgo);

    // Consider healthy if less than 3 errors in the last 5 minutes
    const isHealthy = recentErrors.length < 3;

    const featureHealth = this.systemHealth.features[featureName];
    if (featureHealth) {
      featureHealth.lastHealthCheck = now;
    }

    return isHealthy;
  }

  private enableFeature(featureName: string): void {
    const featureHealth = this.systemHealth.features[featureName];
    if (featureHealth) {
      featureHealth.status = 'active';
    }

    logger.info('Feature re-enabled after recovery', { featureName });
  }

  private considerRecovery(featureName: string): void {
    // Check if feature has been stable for a while
    const now = Date.now();
    const timestamps = this.errorTimestamps.get(featureName) || [];
    const recentErrors = timestamps.filter((ts) => ts >= now - 10 * 60 * 1000); // Last 10 minutes

    if (recentErrors.length === 0) {
      this.enableFeature(featureName);
      this.updateSystemHealth();
    }
  }

  private updateSystemHealth(): void {
    const features = Object.values(this.systemHealth.features);
    const _activeFeatures = features.filter(
      (f) => f.status === 'active'
    ).length;
    const degradedFeatures = features.filter(
      (f) => f.status === 'degraded'
    ).length;
    const disabledFeatures = features.filter(
      (f) => f.status === 'disabled'
    ).length;

    // Calculate degradation level
    const totalFeatures = features.length;
    this.systemHealth.degradationLevel =
      totalFeatures > 0
        ? ((degradedFeatures * 0.5 + disabledFeatures) / totalFeatures) * 100
        : 0;

    // Determine overall health
    if (this.systemHealth.degradationLevel === 0) {
      this.systemHealth.overall = 'healthy';
    } else if (this.systemHealth.degradationLevel < 50) {
      this.systemHealth.overall = 'degraded';
    } else {
      this.systemHealth.overall = 'critical';
    }
  }

  private startHealthMonitoring(interval: number): void {
    this.healthCheckInterval = setInterval(() => {
      // Perform periodic health checks
      for (const featureName of this.features.keys()) {
        this.performHealthCheck(featureName);
      }

      this.updateSystemHealth();

      if (this.onHealthChange) {
        this.onHealthChange(this.systemHealth);
      }
    }, interval);
  }

  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth };
  }

  getFeatureHealth(
    featureName: string
  ): SystemHealth['features'][string] | null {
    return this.systemHealth.features[featureName] || null;
  }

  forceRecovery(): void {
    logger.info('Forcing system recovery');

    // Re-enable all features
    for (const featureName of this.features.keys()) {
      this.enableFeature(featureName);
    }

    // Clear active rules
    this.systemHealth.activeRules = [];

    // Reset error counts
    this.errorCounts.clear();
    this.errorTimestamps.clear();

    this.updateSystemHealth();

    if (this.onHealthChange) {
      this.onHealthChange(this.systemHealth);
    }
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Global graceful degradation manager
export const degradationManager = new GracefulDegradationManager({
  onHealthChange: (health) => {
    logger.info('System health changed', {
      overall: health.overall,
      degradationLevel: health.degradationLevel,
      activeRules: health.activeRules.length,
    });
  },
});

// Utility function to register common features
export function registerCommonFeatures(): void {
  degradationManager.registerFeature({
    name: 'badge-minting',
    enabled: true,
    criticalLevel: 'critical',
    fallbackValue: null,
  });

  degradationManager.registerFeature({
    name: 'community-creation',
    enabled: true,
    criticalLevel: 'important',
    fallbackValue: null,
  });

  degradationManager.registerFeature({
    name: 'analytics-tracking',
    enabled: true,
    criticalLevel: 'nice-to-have',
    fallbackValue: false,
  });

  degradationManager.registerFeature({
    name: 'real-time-notifications',
    enabled: true,
    criticalLevel: 'nice-to-have',
    fallbackValue: false,
  });

  // Register degradation rules
  degradationManager.registerDegradationRule('high-error-rate', {
    triggerConditions: {
      errorRate: 0.1, // 10% error rate
      timeWindow: 5 * 60 * 1000, // 5 minutes
    },
    actions: {
      disableFeatures: ['analytics-tracking', 'real-time-notifications'],
      enableFallbacks: ['community-creation'],
      notifyUsers: true,
    },
    recovery: {
      autoRecover: true,
      recoveryDelay: 10 * 60 * 1000, // 10 minutes
      healthCheckInterval: 2 * 60 * 1000, // 2 minutes
    },
  });
}
