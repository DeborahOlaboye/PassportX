import { Router } from 'express'
import mongoose from 'mongoose'
import { monitoringService } from '../middleware/monitoring'

const router = Router()

// Basic health check
router.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// Detailed health status
router.get('/status', (req, res) => {
  const health = monitoringService.getHealthStatus()
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  
  res.json({
    ...health,
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  })
})

// Request metrics
router.get('/metrics', (req, res) => {
  const metrics = monitoringService.getMetrics()
  res.json(metrics)
})

// Database health
router.get('/db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }

    const dbStats = await mongoose.connection.db?.stats()
    
    res.json({
      status: states[dbState as keyof typeof states],
      readyState: dbState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      stats: dbStats
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: (error as Error).message
    })
  }
})

export default router