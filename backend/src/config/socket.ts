import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

interface SocketUser {
  stacksAddress: string
  userId: string
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser
}

/**
 * Returns the JWT secret or throws at startup – never falls back to a
 * hardcoded default so that misconfigured deployments fail fast and
 * visibly rather than silently accepting forged tokens.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is not set. ' +
      'Set a strong, random secret before starting the server.'
    )
  }
  return secret
}

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const jwtSecret = getJwtSecret()

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]

      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      const decoded = jwt.verify(token, jwtSecret) as SocketUser

      socket.user = decoded
      next()
    } catch (error) {
      next(new Error('Authentication error: Invalid token'))
    }
  })

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.stacksAddress

    if (!userId) {
      socket.disconnect()
      return
    }

    console.log(`User connected: ${userId} (${socket.id})`)

    // Join user-specific room
    socket.join(`user:${userId}`)

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} (${socket.id})`)
    })

    // Mark notification as read
    socket.on('notification:read', (notificationId: string) => {
      console.log(`Notification ${notificationId} marked as read by ${userId}`)
      // Emit acknowledgment
      socket.emit('notification:read:ack', { notificationId })
    })

    // Mark all notifications as read
    socket.on('notifications:readAll', () => {
      console.log(`All notifications marked as read by ${userId}`)
      socket.emit('notifications:readAll:ack')
    })

    // Request notification list
    socket.on('notifications:fetch', () => {
      console.log(`Fetch notifications requested by ${userId}`)
      // This will be handled by the notification service
      socket.emit('notifications:fetch:ack')
    })
  })

  return io
}

// Export socket instance for use in other modules
let socketInstance: SocketIOServer | null = null

export const setSocketInstance = (io: SocketIOServer) => {
  socketInstance = io
}

export const getSocketInstance = (): SocketIOServer | null => {
  return socketInstance
}

// Utility function to emit notification to a specific user
export const emitNotificationToUser = (userId: string, notification: unknown) => {
  if (socketInstance) {
    socketInstance.to(`user:${userId}`).emit('notification:new', notification)
  }
}

// Utility function to emit to multiple users
export const emitNotificationToUsers = (userIds: string[], notification: unknown) => {
  if (socketInstance) {
    userIds.forEach(userId => {
      socketInstance!.to(`user:${userId}`).emit('notification:new', notification)
    })
  }
}

// Utility function to broadcast system announcement
export const broadcastSystemAnnouncement = (notification: unknown) => {
  if (socketInstance) {
    socketInstance.emit('notification:system', notification)
  }
}

// Utility function to broadcast analytics update to all connected clients
export const broadcastAnalyticsUpdate = (data: Record<string, unknown>) => {
  if (socketInstance) {
    socketInstance.emit('analytics:update', {
      timestamp: Date.now(),
      ...data
    })
  }
}

// Utility function to broadcast activity event to a specific user
export const broadcastActivityEvent = (userId: string, activity: unknown) => {
  if (socketInstance) {
    socketInstance.to(`user:${userId}`).emit('activity:new', {
      timestamp: Date.now(),
      activity
    })
  }
}

// Utility function to broadcast activity event to multiple users
export const broadcastActivityEventToUsers = (userIds: string[], activity: unknown) => {
  if (socketInstance) {
    userIds.forEach(userId => {
      socketInstance!.to(`user:${userId}`).emit('activity:new', {
        timestamp: Date.now(),
        activity
      })
    })
  }
}

// Utility function to broadcast activity feed update (mark as read, etc)
export const broadcastActivityUpdate = (userId: string, event: string, data: Record<string, unknown>) => {
  if (socketInstance) {
    socketInstance.to(`user:${userId}`).emit(`activity:${event}`, {
      timestamp: Date.now(),
      ...data
    })
  }
}

// Utility function to broadcast analytics event to all connected clients
export const broadcastAnalyticsEvent = (event: string, data: Record<string, unknown>) => {
  if (socketInstance) {
    socketInstance.emit(`analytics:${event}`, {
      timestamp: Date.now(),
      ...data
    })
  }
}
