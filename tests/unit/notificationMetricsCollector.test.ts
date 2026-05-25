import { notificationMetricsCollector } from '../../src/services/NotificationMetricsCollector';

describe('Notification Metrics Collector', () => {
  beforeEach(() => {
    notificationMetricsCollector.reset();
  });

  describe('recordSent', () => {
    it('should increment sent count', () => {
      notificationMetricsCollector.recordSent();
      const metrics = notificationMetricsCollector.getMetrics();
      expect(metrics.sent).toBe(1);
    });
  });

  describe('recordDelivered', () => {
    it('should increment delivered count and record latency', () => {
      notificationMetricsCollector.recordDelivered(100);
      const metrics = notificationMetricsCollector.getMetrics();
      expect(metrics.delivered).toBe(1);
      expect(metrics.averageLatency).toBe(100);
    });
  });

  describe('recordFailed', () => {
    it('should increment failed count', () => {
      notificationMetricsCollector.recordFailed();
      const metrics = notificationMetricsCollector.getMetrics();
      expect(metrics.failed).toBe(1);
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      notificationMetricsCollector.recordSent();
      notificationMetricsCollector.recordDelivered(100);
      const metrics = notificationMetricsCollector.getMetrics();
      expect(metrics.sent).toBe(1);
      expect(metrics.delivered).toBe(1);
    });
  });

  describe('getSuccessRate', () => {
    it('should calculate success rate', () => {
      notificationMetricsCollector.recordSent();
      notificationMetricsCollector.recordDelivered(100);
      const rate = notificationMetricsCollector.getSuccessRate();
      expect(rate).toBe(100);
    });

    it('should return 0 when no notifications sent', () => {
      const rate = notificationMetricsCollector.getSuccessRate();
      expect(rate).toBe(0);
    });
  });

  describe('getFailureRate', () => {
    it('should calculate failure rate', () => {
      notificationMetricsCollector.recordSent();
      notificationMetricsCollector.recordFailed();
      const rate = notificationMetricsCollector.getFailureRate();
      expect(rate).toBe(100);
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      notificationMetricsCollector.recordSent();
      notificationMetricsCollector.recordDelivered(100);
      notificationMetricsCollector.reset();
      const metrics = notificationMetricsCollector.getMetrics();
      expect(metrics.sent).toBe(0);
      expect(metrics.delivered).toBe(0);
    });
  });
});
