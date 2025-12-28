import { NotificationPayload } from '../types/handlers'

export interface StoredNotification {
  _id: string
  userId: string
  type: string
  title: string
  message: string
  data: any
  read: boolean
  createdAt: string
  updatedAt: string
}

export class NotificationDeliveryService {
  private static notificationStore: Map<string, StoredNotification[]> = new Map()
  private static notificationIdCounter = 0

  static async deliverNotification(notification: NotificationPayload): Promise<StoredNotification> {
    try {
      const storedNotification: StoredNotification = {
        _id: this.generateNotificationId(),
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const userNotifications = this.notificationStore.get(notification.userId) || []
      userNotifications.unshift(storedNotification)
      this.notificationStore.set(notification.userId, userNotifications)

      console.log(`Notification delivered to user ${notification.userId}: ${storedNotification._id}`)

      return storedNotification
    } catch (error) {
      console.error('Error delivering notification:', error)
      throw error
    }
  }

  static async deliverNotifications(notifications: NotificationPayload[]): Promise<StoredNotification[]> {
    const deliveredNotifications: StoredNotification[] = []

    for (const notification of notifications) {
      try {
        const delivered = await this.deliverNotification(notification)
        deliveredNotifications.push(delivered)
      } catch (error) {
        console.error(`Error delivering notification to user ${notification.userId}:`, error)
      }
    }

    return deliveredNotifications
  }

  static async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<StoredNotification[]> {
    try {
      const userNotifications = this.notificationStore.get(userId) || []
      return userNotifications.slice(offset, offset + limit)
    } catch (error) {
      console.error('Error retrieving user notifications:', error)
      return []
    }
  }

  static async markNotificationAsRead(
    userId: string,
    notificationId: string
  ): Promise<StoredNotification | null> {
    try {
      const userNotifications = this.notificationStore.get(userId) || []
      const notification = userNotifications.find(n => n._id === notificationId)

      if (notification) {
        notification.read = true
        notification.updatedAt = new Date().toISOString()
      }

      return notification || null
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return null
    }
  }

  static async markAllNotificationsAsRead(userId: string): Promise<number> {
    try {
      const userNotifications = this.notificationStore.get(userId) || []
      let count = 0

      for (const notification of userNotifications) {
        if (!notification.read) {
          notification.read = true
          notification.updatedAt = new Date().toISOString()
          count++
        }
      }

      return count
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return 0
    }
  }

  static async deleteNotification(
    userId: string,
    notificationId: string
  ): Promise<boolean> {
    try {
      const userNotifications = this.notificationStore.get(userId) || []
      const initialLength = userNotifications.length
      
      const filtered = userNotifications.filter(n => n._id !== notificationId)
      this.notificationStore.set(userId, filtered)

      return filtered.length < initialLength
    } catch (error) {
      console.error('Error deleting notification:', error)
      return false
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const userNotifications = this.notificationStore.get(userId) || []
      return userNotifications.filter(n => !n.read).length
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  static async getNotificationsByType(
    userId: string,
    notificationType: string,
    limit: number = 20
  ): Promise<StoredNotification[]> {
    try {
      const userNotifications = this.notificationStore.get(userId) || []
      return userNotifications
        .filter(n => n.type === notificationType)
        .slice(0, limit)
    } catch (error) {
      console.error('Error filtering notifications by type:', error)
      return []
    }
  }

  static async getUnreadNotifications(
    userId: string,
    limit: number = 20
  ): Promise<StoredNotification[]> {
    try {
      const userNotifications = this.notificationStore.get(userId) || []
      return userNotifications
        .filter(n => !n.read)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting unread notifications:', error)
      return []
    }
  }

  static async clearAllNotifications(userId: string): Promise<number> {
    try {
      const userNotifications = this.notificationStore.get(userId) || []
      const count = userNotifications.length
      this.notificationStore.delete(userId)
      return count
    } catch (error) {
      console.error('Error clearing notifications:', error)
      return 0
    }
  }

  static async clearOldNotifications(userId: string, daysOld: number): Promise<number> {
    try {
      const userNotifications = this.notificationStore.get(userId) || []
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)

      const filtered = userNotifications.filter(n => {
        const notificationDate = new Date(n.createdAt)
        return notificationDate > cutoffDate
      })

      const deletedCount = userNotifications.length - filtered.length
      this.notificationStore.set(userId, filtered)

      return deletedCount
    } catch (error) {
      console.error('Error clearing old notifications:', error)
      return 0
    }
  }

  static getNotificationCount(): number {
    let total = 0
    for (const [, notifications] of this.notificationStore) {
      total += notifications.length
    }
    return total
  }

  static getUserNotificationCount(userId: string): number {
    return (this.notificationStore.get(userId) || []).length
  }

  private static generateNotificationId(): string {
    return `notif_${Date.now()}_${++this.notificationIdCounter}`
  }
}
