import { ChainhookEventPayload, NotificationPayload } from '../types/handlers'

export interface WebSocketConnection {
  userId: string
  socketId: string
  send: (event: string, data: any) => void
  disconnect: () => void
}

export class WebSocketEventEmitter {
  private static connections: Map<string, WebSocketConnection> = new Map()
  private static userConnections: Map<string, Set<string>> = new Map()

  static registerConnection(connection: WebSocketConnection): void {
    this.connections.set(connection.socketId, connection)

    const userConnections = this.userConnections.get(connection.userId) || new Set()
    userConnections.add(connection.socketId)
    this.userConnections.set(connection.userId, userConnections)

    console.log(`WebSocket connection registered for user: ${connection.userId}`)
  }

  static unregisterConnection(socketId: string): void {
    const connection = this.connections.get(socketId)
    
    if (connection) {
      const userConnections = this.userConnections.get(connection.userId)
      
      if (userConnections) {
        userConnections.delete(socketId)
        
        if (userConnections.size === 0) {
          this.userConnections.delete(connection.userId)
        } else {
          this.userConnections.set(connection.userId, userConnections)
        }
      }

      this.connections.delete(socketId)
      console.log(`WebSocket connection unregistered: ${socketId}`)
    }
  }

  static async emitChainhookEvent(
    chainhookEvent: ChainhookEventPayload,
    eventData: any
  ): Promise<void> {
    try {
      for (const [, connection] of this.connections) {
        connection.send('chainhook:event', {
          type: 'chainhook-event',
          event: chainhookEvent,
          data: eventData,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('Error emitting Chainhook event via WebSocket:', error)
    }
  }

  static async emitNotification(notification: NotificationPayload): Promise<void> {
    try {
      const userConnections = this.userConnections.get(notification.userId)
      
      if (!userConnections || userConnections.size === 0) {
        console.log(`No active WebSocket connections for user: ${notification.userId}`)
        return
      }

      for (const socketId of userConnections) {
        const connection = this.connections.get(socketId)
        
        if (connection) {
          connection.send('notification:new', {
            _id: this.generateNotificationId(),
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            read: false,
            createdAt: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('Error emitting notification via WebSocket:', error)
    }
  }

  static async emitNotifications(notifications: NotificationPayload[]): Promise<void> {
    for (const notification of notifications) {
      await this.emitNotification(notification)
    }
  }

  static async broadcastChainhookEvent(
    chainhookEvent: ChainhookEventPayload,
    eventData: any
  ): Promise<void> {
    try {
      for (const [, connection] of this.connections) {
        connection.send('chainhook:broadcast', {
          type: 'chainhook-broadcast',
          event: chainhookEvent,
          data: eventData,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('Error broadcasting Chainhook event:', error)
    }
  }

  static getConnectionCount(): number {
    return this.connections.size
  }

  static getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0
  }

  static getUserConnections(userId: string): WebSocketConnection[] {
    const socketIds = this.userConnections.get(userId) || new Set()
    const connections: WebSocketConnection[] = []

    for (const socketId of socketIds) {
      const connection = this.connections.get(socketId)
      if (connection) {
        connections.push(connection)
      }
    }

    return connections
  }

  static getAllConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values())
  }

  static isUserConnected(userId: string): boolean {
    const connections = this.userConnections.get(userId)
    return connections ? connections.size > 0 : false
  }

  static disconnectUser(userId: string): void {
    const socketIds = this.userConnections.get(userId)
    
    if (!socketIds) {
      return
    }

    for (const socketId of socketIds) {
      const connection = this.connections.get(socketId)
      if (connection) {
        connection.disconnect()
      }
    }

    this.userConnections.delete(userId)
  }

  static async emitEventAcknowledgment(
    socketId: string,
    eventId: string,
    success: boolean,
    message?: string
  ): Promise<void> {
    try {
      const connection = this.connections.get(socketId)
      
      if (connection) {
        connection.send('event:acknowledgment', {
          eventId,
          success,
          message,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('Error sending event acknowledgment:', error)
    }
  }

  private static generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
