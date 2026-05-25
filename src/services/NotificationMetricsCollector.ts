export interface NotificationMetrics {
  sent: number;
  delivered: number;
  failed: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
}

class NotificationMetricsCollector {
  private latencies: number[] = [];
  private metrics: NotificationMetrics = {
    sent: 0,
    delivered: 0,
    failed: 0,
    averageLatency: 0,
    p95Latency: 0,
    p99Latency: 0,
  };

  recordSent(): void {
    this.metrics.sent++;
  }

  recordDelivered(latency: number): void {
    this.metrics.delivered++;
    this.latencies.push(latency);
    this.updateLatencyMetrics();
  }

  recordFailed(): void {
    this.metrics.failed++;
  }

  private updateLatencyMetrics(): void {
    if (this.latencies.length === 0) return;

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    this.metrics.averageLatency = sum / sorted.length;

    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    this.metrics.p95Latency = sorted[p95Index] || 0;
    this.metrics.p99Latency = sorted[p99Index] || 0;
  }

  getMetrics(): NotificationMetrics {
    return { ...this.metrics };
  }

  getSuccessRate(): number {
    if (this.metrics.sent === 0) return 0;
    return (this.metrics.delivered / this.metrics.sent) * 100;
  }

  getFailureRate(): number {
    if (this.metrics.sent === 0) return 0;
    return (this.metrics.failed / this.metrics.sent) * 100;
  }

  reset(): void {
    this.latencies = [];
    this.metrics = {
      sent: 0,
      delivered: 0,
      failed: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
    };
  }
}

export const notificationMetricsCollector = new NotificationMetricsCollector();
