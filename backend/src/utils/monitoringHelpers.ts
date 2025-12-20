import ChainhookEventLogger from '../services/chainhookEventLogger'
import MetricsTracker from '../services/metricsTracker'
import AlertService from '../services/alertService'

export class MonitoringHelpers {
  static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    if (percentile < 0 || percentile > 100) {
      throw new Error('Percentile must be between 0 and 100')
    }

    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1

    return sorted[Math.max(0, index)]
  }

  static calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length

    return Math.sqrt(variance)
  }

  static formatProcessingTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds.toFixed(0)}ms`
    }
    return `${(milliseconds / 1000).toFixed(2)}s`
  }

  static formatUptime(percentage: number): string {
    return `${percentage.toFixed(2)}%`
  }

  static getHealthStatus(uptime: number): 'healthy' | 'degraded' | 'critical' {
    if (uptime >= 99.5) return 'healthy'
    if (uptime >= 95) return 'degraded'
    return 'critical'
  }

  static getSeverityColor(severity: string): string {
    const colors: { [key: string]: string } = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
      critical: '#9C27B0'
    }
    return colors[severity] || '#999999'
  }

  static formatEventStatus(status: string): string {
    const formatMap: { [key: string]: string } = {
      received: 'Received',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed'
    }
    return formatMap[status] || status
  }

  static getEventStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      received: '📥',
      processing: '⏳',
      completed: '✅',
      failed: '❌'
    }
    return icons[status] || '❓'
  }

  static async generateMetricsReport(
    metricsTracker: MetricsTracker,
    hours: number = 1
  ): Promise<string> {
    const avgTime = await metricsTracker.getAverageProcessingTime(hours)
    const totalReceived = await metricsTracker.getTotalEventsReceived(hours)
    const failureRate = await metricsTracker.getFailureRate(hours)

    return `
Metrics Report (Last ${hours} hour(s)):
- Events Received: ${totalReceived}
- Average Processing Time: ${this.formatProcessingTime(avgTime)}
- Failure Rate: ${failureRate.toFixed(2)}%
    `.trim()
  }

  static async generateAlertSummary(alertService: AlertService): Promise<string> {
    const unresolved = await alertService.getUnresolvedAlerts(100)
    const critical = await alertService.getCriticalAlerts()

    const byType: { [key: string]: number } = {}
    const bySeverity: { [key: string]: number } = {}

    unresolved.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1
    })

    let summary = `Alert Summary:\n- Total Unresolved: ${unresolved.length}\n- Critical: ${critical.length}\n`

    if (Object.keys(byType).length > 0) {
      summary += `\nBy Type:\n`
      Object.entries(byType).forEach(([type, count]) => {
        summary += `  - ${type}: ${count}\n`
      })
    }

    if (Object.keys(bySeverity).length > 0) {
      summary += `\nBy Severity:\n`
      Object.entries(bySeverity).forEach(([severity, count]) => {
        summary += `  - ${severity}: ${count}\n`
      })
    }

    return summary.trim()
  }

  static async generateEventSummary(eventLogger: ChainhookEventLogger): Promise<string> {
    const completed = await eventLogger.getEventCount('completed')
    const failed = await eventLogger.getEventCount('failed')
    const total = await eventLogger.getEventCount()

    const failureRate = total > 0 ? ((failed / total) * 100).toFixed(2) : '0.00'

    return `
Event Summary:
- Total Events: ${total}
- Completed: ${completed}
- Failed: ${failed}
- Failure Rate: ${failureRate}%
    `.trim()
  }

  static generateAlertMessage(type: string, severity: string, message: string): string {
    const icon = this.getSeverityEmoji(severity)
    return `${icon} [${severity.toUpperCase()}] ${type.toUpperCase()}: ${message}`
  }

  private static getSeverityEmoji(severity: string): string {
    const emojis: { [key: string]: string } = {
      low: '⚪',
      medium: '🟡',
      high: '🔴',
      critical: '🔥'
    }
    return emojis[severity] || '❓'
  }

  static async buildDashboardSummary(
    metricsTracker: MetricsTracker,
    alertService: AlertService,
    eventLogger: ChainhookEventLogger
  ): Promise<string> {
    const [metricsReport, alertSummary, eventSummary] = await Promise.all([
      this.generateMetricsReport(metricsTracker),
      this.generateAlertSummary(alertService),
      this.generateEventSummary(eventLogger)
    ])

    return `
${metricsReport}

${alertSummary}

${eventSummary}
    `.trim()
  }
}

export default MonitoringHelpers
