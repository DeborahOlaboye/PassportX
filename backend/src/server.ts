import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import { createRateLimiter } from './middleware/rateLimiter'
import { DEFAULT_RATE_LIMIT } from './config/rateLimits'
import dotenv from 'dotenv-safe'
import { registerRequiredEnvVars } from './config/env'
import { EnvValidator } from './utils/envValidation'
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
import reorgRoutes from './routes/reorg'
import AnalyticsAggregator from './services/analyticsAggregator'
import AnalyticsEventProcessor from './services/analyticsEventProcessor'
import UserActivityService from './services/userActivityService'
import WebhookService from './services/WebhookService'

dotenv.config()

// Register and validate environment variables
registerRequiredEnvVars()
EnvValidator.ensureValid()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3001

// CORS configuration with support for multiple origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Security middleware
app.use(helmet())
app.use(cors(corsOptions))

// Global rate limiting (default fallback for routes without specific limiters)
const globalLimiter = createRateLimiter(DEFAULT_RATE_LIMIT)
app.use(globalLimiter)

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
app.use('/api/reorg', reorgRoutes)

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