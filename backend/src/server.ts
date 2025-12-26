import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { connectDB } from './utils/database'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/monitoring'
import { initializeSocket, setSocketInstance } from './config/socket'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import communityRoutes from './routes/communities'
import badgeRoutes from './routes/badges'
import badgeSearchRoutes from './routes/badgeSearch'
import blockchainRoutes from './routes/blockchain'
import healthRoutes from './routes/health'
import verificationRoutes from './routes/verification'
import notificationRoutes from './routes/notifications'
import analyticsRoutes, { setAnalyticsAggregator } from './routes/analytics'
import activityRoutes, { setUserActivityService } from './routes/activity'
import webhooksRoutes from './routes/webhooks'
import AnalyticsAggregator from './services/analyticsAggregator'
import AnalyticsEventProcessor from './services/analyticsEventProcessor'
import UserActivityService from './services/userActivityService'
import WebhookService from './services/WebhookService'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Request monitoring
app.use(requestLogger)

// Health routes
app.use('/health', healthRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/communities', communityRoutes)
app.use('/api/badges', badgeRoutes)
app.use('/api/badges', badgeSearchRoutes)
app.use('/api/blockchain', blockchainRoutes)
app.use('/api/verify', verificationRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/webhooks', webhooksRoutes)

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Initialize Socket.IO
const io = initializeSocket(httpServer)
setSocketInstance(io)

// Start server
const startServer = async () => {
  try {
    await connectDB()

    // Initialize analytics
    const analyticsAggregator = new AnalyticsAggregator()
    setAnalyticsAggregator(analyticsAggregator)

    const analyticsEventProcessor = new AnalyticsEventProcessor(analyticsAggregator)

    // Initialize user activity service
    const userActivityService = new UserActivityService()
    setUserActivityService(userActivityService)

    // Optional: Record daily snapshots (can be set up via cron jobs)
    // For now, snapshots can be triggered via POST /api/analytics/snapshot

    httpServer.listen(PORT, () => {
      console.log(`🚀 PassportX Backend running on port ${PORT}`)
      console.log(`🔌 WebSocket server ready`)
      console.log(`📊 Analytics aggregator initialized`)
      console.log(`📝 User activity service initialized`)
    })

    // Initialize webhook retry scheduler
    const webhookService = WebhookService.getInstance()
    setInterval(async () => {
      try {
        await webhookService.retryFailedWebhooks()
      } catch (error) {
        console.error('Error in webhook retry scheduler:', error)
      }
    }, 5 * 60 * 1000) // Retry every 5 minutes

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...')
      await analyticsEventProcessor.cleanup()
      await analyticsAggregator.cleanup()
      process.exit(0)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()