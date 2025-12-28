// Reorg handling configuration
export const REORG_CONFIG = {
  // Maximum rollback depth to handle
  MAX_ROLLBACK_DEPTH: parseInt(process.env.REORG_MAX_ROLLBACK_DEPTH || '100'),

  // Monitoring settings
  MONITORING_ENABLED: process.env.REORG_MONITORING_ENABLED !== 'false',

  // Cache TTL in milliseconds
  CACHE_TTL_MS: parseInt(process.env.REORG_CACHE_TTL_MS || '300000'), // 5 minutes

  // Database rollback log retention in hours
  DATABASE_LOG_RETENTION_HOURS: parseInt(process.env.REORG_DATABASE_LOG_RETENTION_HOURS || '24'),

  // Alert thresholds
  ALERT_THRESHOLDS: {
    // Deep reorg: rollback depth exceeding this value
    DEEP_REORG_BLOCKS: parseInt(process.env.REORG_DEEP_REORG_BLOCKS || '10'),

    // Frequent reorgs: more than this many per hour
    FREQUENT_REORG_PER_HOUR: parseInt(process.env.REORG_FREQUENT_REORG_PER_HOUR || '5'),

    // Large impact: transactions affected exceeding this value
    LARGE_IMPACT_TRANSACTIONS: parseInt(process.env.REORG_LARGE_IMPACT_TRANSACTIONS || '100')
  },

  // Service configuration
  SERVICE_CONFIG: {
    // Cleanup interval for rollback operations (milliseconds)
    CLEANUP_INTERVAL_MS: parseInt(process.env.REORG_CLEANUP_INTERVAL_MS || '3600000'), // 1 hour

    // Maximum rollback operations to keep in memory
    MAX_ROLLBACK_OPERATIONS: parseInt(process.env.REORG_MAX_ROLLBACK_OPERATIONS || '10000')
  }
}

export default REORG_CONFIG