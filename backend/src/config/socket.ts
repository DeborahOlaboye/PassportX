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

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
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

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as SocketUser

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
export const emitNotificationToUser = (userId: string, notification: any) => {
  if (socketInstance) {
    socketInstance.to(`user:${userId}`).emit('notification:new', notification)
  }
}

// Utility function to emit to multiple users
export const emitNotificationToUsers = (userIds: string[], notification: any) => {
  if (socketInstance) {
    userIds.forEach(userId => {
      socketInstance!.to(`user:${userId}`).emit('notification:new', notification)
    })
  }
}

// Utility function to broadcast system announcement
export const broadcastSystemAnnouncement = (notification: any) => {
  if (socketInstance) {
    socketInstance.emit('notification:system', notification)
  }
}
