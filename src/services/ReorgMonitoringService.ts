import { ReorgEvent } from '../backend/src/services/ReorgHandlerService'
import ReorgAwareDatabase from '../backend/src/services/ReorgAwareDatabase'

export interface ReorgMetrics {
  totalReorgs: number
  averageRollbackDepth: number
  maxRollbackDepth: number
  totalAffectedTransactions: number
  reorgFrequency: number // reorgs per hour
  lastReorgTimestamp: number
  reorgByDepth: Record<number, number>
  reorgByHour: Record<number, number>
}

export interface ReorgAlert {
  id: string
  type: 'deep_reorg' | 'frequent_reorg' | 'large_impact'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  reorgEvent: ReorgEvent
  metadata?: any
}

export class ReorgMonitoringService {
  private static instance: ReorgMonitoringService
  private metrics: ReorgMetrics
  private alerts: ReorgAlert[] = []
  private logger: any
  private alertCallbacks: Set<(alert: ReorgAlert) => void> = new Set()
  private metricsHistory: ReorgMetrics[] = []
  private maxHistorySize = 1000

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
    this.metrics = {
      totalReorgs: 0,
      averageRollbackDepth: 0,
      maxRollbackDepth: 0,
      totalAffectedTransactions: 0,
      reorgFrequency: 0,
      lastReorgTimestamp: 0,
      reorgByDepth: {},
      reorgByHour: {}
    }
  }

  static getInstance(logger?: any): ReorgMonitoringService {
    if (!ReorgMonitoringService.instance) {
      ReorgMonitoringService.instance = new ReorgMonitoringService(logger)
    }
    return ReorgMonitoringService.instance
  }

  /**
   * Record a reorg event and update metrics
   */
  async recordReorgEvent(reorgEvent: ReorgEvent, database?: ReorgAwareDatabase): Promise<void> {
    this.logger.info('Recording reorg event for monitoring', {
      rollbackToBlock: reorgEvent.rollbackToBlock,
      affectedTransactions: reorgEvent.affectedTransactions.length,
      timestamp: reorgEvent.timestamp
    })

    // Update metrics
    this.updateMetrics(reorgEvent)

    // Get database statistics if available
    let dbStats = null
    if (database) {
      dbStats = database.getRollbackStats()
    }

    // Check for alerts
    const alerts = this.checkForAlerts(reorgEvent, dbStats)
    for (const alert of alerts) {
      this.alerts.push(alert)
      this.notifyAlertCallbacks(alert)
    }

    // Log comprehensive reorg information
    this.logReorgDetails(reorgEvent, dbStats)

    // Store metrics history
    this.storeMetricsHistory()

    // Clean up old data
    this.cleanupOldData()
  }

  /**
   * Subscribe to alert notifications
   */
  onAlert(callback: (alert: ReorgAlert) => void): () => void {
    this.alertCallbacks.add(callback)
    return () => {
      this.alertCallbacks.delete(callback)
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): ReorgMetrics {
    return { ...this.metrics }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): ReorgAlert[] {
    return this.alerts.slice(-limit)
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 24): ReorgMetrics[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)
    return this.metricsHistory.filter(m => m.lastReorgTimestamp >= cutoffTime)
  }

  /**
   * Generate monitoring report
   */
  generateReport(): {
    summary: ReorgMetrics
    alerts: ReorgAlert[]
    trends: {
      reorgFrequencyTrend: 'increasing' | 'decreasing' | 'stable'
      averageDepthTrend: 'increasing' | 'decreasing' | 'stable'
    }
    recommendations: string[]
  } {
    const recentMetrics = this.getMetricsHistory(24)
    const trends = this.calculateTrends(recentMetrics)
    const recommendations = this.generateRecommendations(trends)

    return {
      summary: this.metrics,
      alerts: this.getRecentAlerts(5),
      trends,
      recommendations
    }
  }

  /**
   * Update metrics based on reorg event
   */
  private updateMetrics(reorgEvent: ReorgEvent): void {
    const rollbackDepth = reorgEvent.newCanonicalBlock - reorgEvent.rollbackToBlock

    // Update counters
    this.metrics.totalReorgs++
    this.metrics.totalAffectedTransactions += reorgEvent.affectedTransactions.length
    this.metrics.lastReorgTimestamp = reorgEvent.timestamp

    // Update max rollback depth
    if (rollbackDepth > this.metrics.maxRollbackDepth) {
      this.metrics.maxRollbackDepth = rollbackDepth
    }

    // Update average rollback depth
    const totalDepth = this.metrics.averageRollbackDepth * (this.metrics.totalReorgs - 1) + rollbackDepth
    this.metrics.averageRollbackDepth = totalDepth / this.metrics.totalReorgs

    // Update depth distribution
    this.metrics.reorgByDepth[rollbackDepth] = (this.metrics.reorgByDepth[rollbackDepth] || 0) + 1

    // Update hourly distribution
    const hour = new Date(reorgEvent.timestamp).getHours()
    this.metrics.reorgByHour[hour] = (this.metrics.reorgByHour[hour] || 0) + 1

    // Calculate reorg frequency (reorgs per hour over last 24 hours)
    const recentReorgs = this.metricsHistory.filter(m =>
      m.lastReorgTimestamp >= (Date.now() - 24 * 60 * 60 * 1000)
    ).length
    this.metrics.reorgFrequency = recentReorgs / 24
  }

  /**
   * Check for alert conditions
   */
  private checkForAlerts(reorgEvent: ReorgEvent, dbStats?: any): ReorgAlert[] {
    const alerts: ReorgAlert[] = []
    const rollbackDepth = reorgEvent.newCanonicalBlock - reorgEvent.rollbackToBlock

    // Deep reorg alert
    if (rollbackDepth > 10) {
      alerts.push({
        id: `deep-reorg-${reorgEvent.timestamp}`,
        type: 'deep_reorg',
        severity: rollbackDepth > 50 ? 'critical' : rollbackDepth > 20 ? 'high' : 'medium',
        message: `Deep reorg detected: ${rollbackDepth} blocks rolled back`,
        timestamp: Date.now(),
        reorgEvent,
        metadata: { rollbackDepth, affectedTransactions: reorgEvent.affectedTransactions.length }
      })
    }

    // Large impact alert
    if (reorgEvent.affectedTransactions.length > 100) {
      alerts.push({
        id: `large-impact-${reorgEvent.timestamp}`,
        type: 'large_impact',
        severity: reorgEvent.affectedTransactions.length > 500 ? 'critical' : 'high',
        message: `Large reorg impact: ${reorgEvent.affectedTransactions.length} transactions affected`,
        timestamp: Date.now(),
        reorgEvent,
        metadata: { affectedTransactions: reorgEvent.affectedTransactions.length }
      })
    }

    // Frequent reorg alert (more than 5 reorgs in last hour)
    const recentReorgs = this.metricsHistory.filter(m =>
      m.lastReorgTimestamp >= (Date.now() - 60 * 60 * 1000)
    ).length

    if (recentReorgs >= 5) {
      alerts.push({
        id: `frequent-reorg-${reorgEvent.timestamp}`,
        type: 'frequent_reorg',
        severity: recentReorgs > 10 ? 'critical' : 'high',
        message: `Frequent reorgs detected: ${recentReorgs} reorgs in the last hour`,
        timestamp: Date.now(),
        reorgEvent,
        metadata: { recentReorgs, timeWindow: '1h' }
      })
    }

    return alerts
  }

  /**
   * Log detailed reorg information
   */
  private logReorgDetails(reorgEvent: ReorgEvent, dbStats?: any): void {
    const rollbackDepth = reorgEvent.newCanonicalBlock - reorgEvent.rollbackToBlock

    this.logger.warn('Reorg event details', {
      rollbackToBlock: reorgEvent.rollbackToBlock,
      newCanonicalBlock: reorgEvent.newCanonicalBlock,
      rollbackDepth,
      affectedTransactionsCount: reorgEvent.affectedTransactions.length,
      affectedTransactions: reorgEvent.affectedTransactions.slice(0, 5), // Log first 5
      timestamp: new Date(reorgEvent.timestamp).toISOString(),
      dbOperationsRolledBack: dbStats?.totalOperations || 0,
      dbOperationsByBlock: dbStats?.operationsByBlock || {}
    })

    // Log affected transaction sample
    if (reorgEvent.affectedTransactions.length > 0) {
      this.logger.debug('Affected transactions sample', {
        sample: reorgEvent.affectedTransactions.slice(0, 10),
        total: reorgEvent.affectedTransactions.length
      })
    }
  }

  /**
   * Store current metrics in history
   */
  private storeMetricsHistory(): void {
    this.metricsHistory.push({ ...this.metrics })
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * Calculate trends from metrics history
   */
  private calculateTrends(recentMetrics: ReorgMetrics[]): {
    reorgFrequencyTrend: 'increasing' | 'decreasing' | 'stable'
    averageDepthTrend: 'increasing' | 'decreasing' | 'stable'
  } {
    if (recentMetrics.length < 2) {
      return { reorgFrequencyTrend: 'stable', averageDepthTrend: 'stable' }
    }

    const midPoint = Math.floor(recentMetrics.length / 2)
    const firstHalf = recentMetrics.slice(0, midPoint)
    const secondHalf = recentMetrics.slice(midPoint)

    const firstHalfFreq = firstHalf.reduce((sum, m) => sum + m.reorgFrequency, 0) / firstHalf.length
    const secondHalfFreq = secondHalf.reduce((sum, m) => sum + m.reorgFrequency, 0) / secondHalf.length

    const firstHalfDepth = firstHalf.reduce((sum, m) => sum + m.averageRollbackDepth, 0) / firstHalf.length
    const secondHalfDepth = secondHalf.reduce((sum, m) => sum + m.averageRollbackDepth, 0) / secondHalf.length

    const freqThreshold = 0.1
    const depthThreshold = 1

    return {
      reorgFrequencyTrend: Math.abs(secondHalfFreq - firstHalfFreq) < freqThreshold ? 'stable' :
                          secondHalfFreq > firstHalfFreq ? 'increasing' : 'decreasing',
      averageDepthTrend: Math.abs(secondHalfDepth - firstHalfDepth) < depthThreshold ? 'stable' :
                        secondHalfDepth > firstHalfDepth ? 'increasing' : 'decreasing'
    }
  }

  /**
   * Generate recommendations based on trends
   */
  private generateRecommendations(trends: any): string[] {
    const recommendations: string[] = []

    if (trends.reorgFrequencyTrend === 'increasing') {
      recommendations.push('Reorg frequency is increasing. Consider increasing block confirmation requirements.')
    }

    if (trends.averageDepthTrend === 'increasing') {
      recommendations.push('Average reorg depth is increasing. Monitor network stability.')
    }

    if (this.metrics.maxRollbackDepth > 100) {
      recommendations.push('Very deep reorgs detected. Consider implementing additional safety measures.')
    }

    if (this.alerts.filter(a => a.severity === 'critical').length > 0) {
      recommendations.push('Critical reorg alerts detected. Immediate investigation recommended.')
    }

    return recommendations
  }

  /**
   * Clean up old alerts and metrics
   */
  private cleanupOldData(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter(alert => alert.timestamp >= oneWeekAgo)
  }

  /**
   * Notify alert callbacks
   */
  private notifyAlertCallbacks(alert: ReorgAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        this.logger.error('Error in alert callback', error)
      }
    })
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[ReorgMonitoringService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[ReorgMonitoringService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[ReorgMonitoringService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ReorgMonitoringService] ${msg}`, ...args)
    }
  }
}

export default ReorgMonitoringService