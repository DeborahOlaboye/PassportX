import { MonitoringConfig } from '../services/monitoringOrchestrator'

export function getMonitoringConfig(): MonitoringConfig {
  const nodeUrl = process.env.CHAINHOOK_NODE_URL || 'http://localhost:20456'
  const healthCheckInterval = process.env.CHAINHOOK_HEALTH_CHECK_INTERVAL
    ? parseInt(process.env.CHAINHOOK_HEALTH_CHECK_INTERVAL)
    : 30000
  const metricsInterval = process.env.CHAINHOOK_METRICS_INTERVAL
    ? parseInt(process.env.CHAINHOOK_METRICS_INTERVAL)
    : 60000
  const logRetentionDays = process.env.CHAINHOOK_LOG_RETENTION_DAYS
    ? parseInt(process.env.CHAINHOOK_LOG_RETENTION_DAYS)
    : 30

  return {
    nodeUrl,
    healthCheckInterval,
    metricsInterval,
    logRetentionDays,
    alertThresholds: {
      performanceThreshold: process.env.CHAINHOOK_PERF_THRESHOLD
        ? parseInt(process.env.CHAINHOOK_PERF_THRESHOLD)
        : 5000,
      failureRateThreshold: process.env.CHAINHOOK_FAILURE_RATE_THRESHOLD
        ? parseInt(process.env.CHAINHOOK_FAILURE_RATE_THRESHOLD)
        : 10,
      maxConsecutiveFailures: process.env.CHAINHOOK_MAX_CONSECUTIVE_FAILURES
        ? parseInt(process.env.CHAINHOOK_MAX_CONSECUTIVE_FAILURES)
        : 5
    }
  }
}

export function validateMonitoringConfig(config: MonitoringConfig): boolean {
  if (!config.nodeUrl) {
    console.error('Monitoring config: Missing nodeUrl')
    return false
  }

  if (config.healthCheckInterval && config.healthCheckInterval < 5000) {
    console.error('Monitoring config: Health check interval must be >= 5000ms')
    return false
  }

  if (config.metricsInterval && config.metricsInterval < 10000) {
    console.error('Monitoring config: Metrics interval must be >= 10000ms')
    return false
  }

  if (config.alertThresholds?.performanceThreshold && config.alertThresholds.performanceThreshold < 100) {
    console.error('Monitoring config: Performance threshold must be >= 100ms')
    return false
  }

  if (config.alertThresholds?.failureRateThreshold && 
      (config.alertThresholds.failureRateThreshold < 1 || config.alertThresholds.failureRateThreshold > 100)) {
    console.error('Monitoring config: Failure rate threshold must be between 1-100')
    return false
  }

  return true
}
