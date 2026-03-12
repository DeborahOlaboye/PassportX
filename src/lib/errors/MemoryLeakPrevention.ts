/**
 * Memory leak prevention in error handlers
 */

import { logger } from '../logger';

export interface MemoryTracker {
  id: string;
  name: string;
  startTime: number;
  initialMemory: NodeJS.MemoryUsage;
  checkpoints: Array<{
    timestamp: number;
    memory: NodeJS.MemoryUsage;
    description?: string;
  }>;
  maxMemoryIncrease: number;
  alertThreshold: number;
}

export interface MemoryLeakDetection {
  isLeaking: boolean;
  confidence: number; // 0-1
  growthRate: number; // bytes per second
  suspiciousPatterns: string[];
  recommendations: string[];
}

export class MemoryLeakPrevention {
  private trackers = new Map<string, MemoryTracker>();
  private globalMemoryHistory: Array<{
    timestamp: number;
    memory: NodeJS.MemoryUsage;
  }> = [];
  private cleanupCallbacks = new Set<() => void>();
  private intervalHandles = new Set<NodeJS.Timeout>();
  private timeoutHandles = new Set<NodeJS.Timeout>();
  private eventListeners = new Map<
    string,
    Array<{
      target: EventTarget;
      event: string;
      listener: EventListenerOrEventListenerObject;
    }>
  >();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private maxHistorySize = 1000;
  private alertCallbacks: Array<(detection: MemoryLeakDetection) => void> = [];

  constructor(
    options: {
      maxHistorySize?: number;
      monitoringInterval?: number;
    } = {}
  ) {
    this.maxHistorySize = options.maxHistorySize || 1000;

    // Start global memory monitoring
    this.startGlobalMonitoring(options.monitoringInterval || 30000);

    // Set up process exit cleanup
    this.setupProcessCleanup();
  }

  createTracker(
    name: string,
    options: {
      maxMemoryIncrease?: number;
      alertThreshold?: number;
    } = {}
  ): string {
    const id = `tracker_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const tracker: MemoryTracker = {
      id,
      name,
      startTime: Date.now(),
      initialMemory: process.memoryUsage(),
      checkpoints: [],
      maxMemoryIncrease: options.maxMemoryIncrease || 100 * 1024 * 1024, // 100MB
      alertThreshold: options.alertThreshold || 50 * 1024 * 1024, // 50MB
    };

    this.trackers.set(id, tracker);

    logger.debug('Memory tracker created', {
      trackerId: id,
      name,
      initialHeapUsed: tracker.initialMemory.heapUsed,
    });

    return id;
  }

  addCheckpoint(trackerId: string, description?: string): void {
    const tracker = this.trackers.get(trackerId);
    if (!tracker) {
      logger.warn('Unknown memory tracker', { trackerId });
      return;
    }

    const currentMemory = process.memoryUsage();
    const checkpoint = {
      timestamp: Date.now(),
      memory: currentMemory,
      description,
    };

    tracker.checkpoints.push(checkpoint);

    // Check for memory growth
    const memoryIncrease =
      currentMemory.heapUsed - tracker.initialMemory.heapUsed;

    if (memoryIncrease > tracker.alertThreshold) {
      logger.warn('Memory usage alert', {
        trackerId,
        name: tracker.name,
        memoryIncrease: memoryIncrease / 1024 / 1024, // MB
        description,
      });
    }

    // Detect potential leaks
    if (tracker.checkpoints.length >= 5) {
      const detection = this.detectMemoryLeak(tracker);
      if (detection.isLeaking && detection.confidence > 0.7) {
        this.triggerLeakAlert(tracker, detection);
      }
    }
  }

  finishTracker(trackerId: string): MemoryLeakDetection | null {
    const tracker = this.trackers.get(trackerId);
    if (!tracker) {
      logger.warn('Unknown memory tracker', { trackerId });
      return null;
    }

    // Add final checkpoint
    this.addCheckpoint(trackerId, 'final');

    const detection = this.detectMemoryLeak(tracker);

    logger.debug('Memory tracker finished', {
      trackerId,
      name: tracker.name,
      duration: Date.now() - tracker.startTime,
      checkpoints: tracker.checkpoints.length,
      isLeaking: detection.isLeaking,
      confidence: detection.confidence,
    });

    this.trackers.delete(trackerId);
    return detection;
  }

  private detectMemoryLeak(tracker: MemoryTracker): MemoryLeakDetection {
    const checkpoints = tracker.checkpoints;
    if (checkpoints.length < 3) {
      return {
        isLeaking: false,
        confidence: 0,
        growthRate: 0,
        suspiciousPatterns: [],
        recommendations: [],
      };
    }

    const memoryValues = checkpoints.map((cp) => cp.memory.heapUsed);
    const timeValues = checkpoints.map((cp) => cp.timestamp);

    // Calculate growth rate using linear regression
    const growthRate = this.calculateGrowthRate(timeValues, memoryValues);

    // Detect patterns
    const suspiciousPatterns: string[] = [];
    const recommendations: string[] = [];

    // Check for consistent growth
    const growthPoints = memoryValues.filter(
      (val, i) => i > 0 && val > memoryValues[i - 1]
    ).length;
    const growthRatio = growthPoints / (memoryValues.length - 1);

    if (growthRatio > 0.7) {
      suspiciousPatterns.push('consistent_memory_growth');
      recommendations.push('Review object creation and disposal patterns');
    }

    // Check for large jumps
    const largeJumps = memoryValues.filter((val, i) => {
      if (i === 0) return false;
      const increase = val - memoryValues[i - 1];
      return increase > 10 * 1024 * 1024; // 10MB jump
    }).length;

    if (largeJumps > 0) {
      suspiciousPatterns.push('large_memory_jumps');
      recommendations.push(
        'Check for large object allocations or array operations'
      );
    }

    // Check final memory vs initial
    const finalMemory = memoryValues[memoryValues.length - 1];
    const initialMemory = tracker.initialMemory.heapUsed;
    const totalIncrease = finalMemory - initialMemory;

    if (totalIncrease > tracker.maxMemoryIncrease) {
      suspiciousPatterns.push('excessive_memory_usage');
      recommendations.push(
        'Consider implementing object pooling or more aggressive cleanup'
      );
    }

    // Calculate confidence based on multiple factors
    let confidence = 0;

    if (growthRate > 1000) confidence += 0.3; // Growing by 1KB/s
    if (growthRatio > 0.8) confidence += 0.4; // 80% of checkpoints show growth
    if (totalIncrease > tracker.alertThreshold) confidence += 0.3;

    confidence = Math.min(confidence, 1);

    const isLeaking = confidence > 0.6 && growthRate > 0;

    return {
      isLeaking,
      confidence,
      growthRate,
      suspiciousPatterns,
      recommendations,
    };
  }

  private calculateGrowthRate(
    timeValues: number[],
    memoryValues: number[]
  ): number {
    if (timeValues.length < 2) return 0;

    // Simple linear regression to find growth rate
    const n = timeValues.length;
    const sumX = timeValues.reduce((sum, t) => sum + t, 0);
    const sumY = memoryValues.reduce((sum, m) => sum + m, 0);
    const sumXY = timeValues.reduce(
      (sum, t, i) => sum + t * memoryValues[i],
      0
    );
    const sumXX = timeValues.reduce((sum, t) => sum + t * t, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Convert from bytes per millisecond to bytes per second
    return slope * 1000;
  }

  private triggerLeakAlert(
    tracker: MemoryTracker,
    detection: MemoryLeakDetection
  ): void {
    logger.error('Memory leak detected', {
      trackerId: tracker.id,
      name: tracker.name,
      confidence: detection.confidence,
      growthRate: detection.growthRate,
      patterns: detection.suspiciousPatterns,
      recommendations: detection.recommendations,
    });

    // Notify callbacks
    for (const callback of this.alertCallbacks) {
      try {
        callback(detection);
      } catch (error) {
        logger.error('Error in memory leak alert callback', { error });
      }
    }
  }

  // Utility methods for preventing common memory leaks

  registerCleanupCallback(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback);

    // Return unregister function
    return () => {
      this.cleanupCallbacks.delete(callback);
    };
  }

  safeSetInterval(callback: () => void, interval: number): NodeJS.Timeout {
    const handle = setInterval(callback, interval);
    this.intervalHandles.add(handle);

    // Auto-cleanup after 1 hour to prevent indefinite intervals
    setTimeout(() => {
      this.clearInterval(handle);
    }, 60 * 60 * 1000);

    return handle;
  }

  safeSetTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const handle = setTimeout(() => {
      callback();
      this.timeoutHandles.delete(handle);
    }, delay);

    this.timeoutHandles.add(handle);
    return handle;
  }

  clearInterval(handle: NodeJS.Timeout): void {
    clearInterval(handle);
    this.intervalHandles.delete(handle);
  }

  clearTimeout(handle: NodeJS.Timeout): void {
    clearTimeout(handle);
    this.timeoutHandles.delete(handle);
  }

  addEventListener(
    target: EventTarget,
    event: string,
    listener: EventListenerOrEventListenerObject
  ): () => void {
    if (target && typeof target.addEventListener === 'function') {
      target.addEventListener(event, listener);

      const key = `${target.constructor?.name || 'unknown'}_${event}`;
      const listeners = this.eventListeners.get(key) || [];
      listeners.push({ target, event, listener });
      this.eventListeners.set(key, listeners);

      // Return cleanup function
      return () => {
        if (target && typeof target.removeEventListener === 'function') {
          target.removeEventListener(event, listener);
        }

        const currentListeners = this.eventListeners.get(key) || [];
        const filteredListeners = currentListeners.filter(
          (l) => l.listener !== listener
        );

        if (filteredListeners.length === 0) {
          this.eventListeners.delete(key);
        } else {
          this.eventListeners.set(key, filteredListeners);
        }
      };
    }

    return () => {}; // No-op cleanup for invalid targets
  }

  createWeakCache<K extends object, V>(): {
    set: (key: K, value: V) => void;
    get: (key: K) => V | undefined;
    has: (key: K) => boolean;
    delete: (key: K) => boolean;
    clear: () => void;
  } {
    const cache = new WeakMap<K, V>();

    return {
      set: (key: K, value: V) => cache.set(key, value),
      get: (key: K) => cache.get(key),
      has: (key: K) => cache.has(key),
      delete: (key: K) => cache.delete(key),
      clear: () => {
        // WeakMap doesn't have clear, but objects will be GC'd when no longer referenced
      },
    };
  }

  private startGlobalMonitoring(interval: number): void {
    this.monitoringInterval = setInterval(() => {
      const currentMemory = process.memoryUsage();

      this.globalMemoryHistory.push({
        timestamp: Date.now(),
        memory: currentMemory,
      });

      // Limit history size
      if (this.globalMemoryHistory.length > this.maxHistorySize) {
        this.globalMemoryHistory = this.globalMemoryHistory.slice(
          -this.maxHistorySize
        );
      }

      // Check for global memory trends
      if (this.globalMemoryHistory.length >= 10) {
        this.checkGlobalMemoryTrends();
      }
    }, interval);
  }

  private checkGlobalMemoryTrends(): void {
    const recent = this.globalMemoryHistory.slice(-10);
    const memoryValues = recent.map((h) => h.memory.heapUsed);
    const timeValues = recent.map((h) => h.timestamp);

    const growthRate = this.calculateGrowthRate(timeValues, memoryValues);

    // Alert if global memory is growing rapidly
    if (growthRate > 5000) {
      // 5KB/s
      logger.warn('Global memory growth detected', {
        growthRate: growthRate / 1024, // KB/s
        currentHeapUsed: memoryValues[memoryValues.length - 1] / 1024 / 1024, // MB
        activeTrackers: this.trackers.size,
      });
    }
  }

  private setupProcessCleanup(): void {
    const cleanup = (): void => {
      logger.info('Performing memory leak prevention cleanup');

      // Run all cleanup callbacks
      for (const callback of this.cleanupCallbacks) {
        try {
          callback();
        } catch (error) {
          logger.error('Error in cleanup callback', { error });
        }
      }

      // Clear all intervals
      for (const handle of this.intervalHandles) {
        clearInterval(handle);
      }
      this.intervalHandles.clear();

      // Clear all timeouts
      for (const handle of this.timeoutHandles) {
        clearTimeout(handle);
      }
      this.timeoutHandles.clear();

      // Remove all event listeners
      for (const [key, listeners] of this.eventListeners) {
        for (const { target, event, listener } of listeners) {
          try {
            if (target && typeof target.removeEventListener === 'function') {
              target.removeEventListener(event, listener);
            }
          } catch (error) {
            logger.error('Error removing event listener', { error, key });
          }
        }
      }
      this.eventListeners.clear();

      // Clear monitoring
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
    };

    // Register cleanup for various exit scenarios
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', cleanup);
    process.on('unhandledRejection', cleanup);
  }

  onMemoryLeak(callback: (detection: MemoryLeakDetection) => void): void {
    this.alertCallbacks.push(callback);
  }

  getGlobalMemoryStats(): {
    current: NodeJS.MemoryUsage;
    trend: 'increasing' | 'decreasing' | 'stable';
    growthRate: number;
    historySize: number;
  } {
    const current = process.memoryUsage();

    if (this.globalMemoryHistory.length < 5) {
      return {
        current,
        trend: 'stable',
        growthRate: 0,
        historySize: this.globalMemoryHistory.length,
      };
    }

    const recent = this.globalMemoryHistory.slice(-5);
    const memoryValues = recent.map((h) => h.memory.heapUsed);
    const timeValues = recent.map((h) => h.timestamp);

    const growthRate = this.calculateGrowthRate(timeValues, memoryValues);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (growthRate > 100) trend = 'increasing';
    else if (growthRate < -100) trend = 'decreasing';

    return {
      current,
      trend,
      growthRate,
      historySize: this.globalMemoryHistory.length,
    };
  }

  forceGarbageCollection(): void {
    if (global.gc) {
      logger.debug('Forcing garbage collection');
      global.gc();
    } else {
      logger.warn(
        'Garbage collection not available. Start Node.js with --expose-gc flag'
      );
    }
  }

  destroy(): void {
    // Trigger cleanup
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.trackers.clear();
    this.globalMemoryHistory = [];
    this.cleanupCallbacks.clear();
    this.alertCallbacks = [];
  }
}

// Global memory leak prevention instance
export const memoryLeakPrevention = new MemoryLeakPrevention();

// Utility function for tracking memory in async operations
export async function withMemoryTracking<T>(
  name: string,
  operation: () => Promise<T>,
  options?: { maxMemoryIncrease?: number; alertThreshold?: number }
): Promise<T> {
  const trackerId = memoryLeakPrevention.createTracker(name, options);

  try {
    memoryLeakPrevention.addCheckpoint(trackerId, 'start');
    const result = await operation();
    memoryLeakPrevention.addCheckpoint(trackerId, 'success');
    return result;
  } catch (error) {
    memoryLeakPrevention.addCheckpoint(trackerId, 'error');
    throw error;
  } finally {
    const detection = memoryLeakPrevention.finishTracker(trackerId);
    if (detection?.isLeaking) {
      logger.warn('Memory leak detected in operation', {
        name,
        confidence: detection.confidence,
        recommendations: detection.recommendations,
      });
    }
  }
}
