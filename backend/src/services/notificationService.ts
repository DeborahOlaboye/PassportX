import Notification from '../models/Notification'
import User from '../models/User'
import { INotification, INotificationQuery, INotificationResult, NotificationType } from '../types'
import { emitNotificationToUser, emitNotificationToUsers, broadcastSystemAnnouncement } from '../config/socket'

/**
 * Get notifications for a user with pagination
 */
export const getUserNotifications = async (query: INotificationQuery): Promise<INotificationResult> => {
  const {
    userId,
    type,
    read,
    page = 1,
    limit = 20,
    sortBy = 'newest'
  } = query

  // Build filter
  const filter: any = { userId }

  if (type) {
    filter.type = Array.isArray(type) ? { $in: type } : type
  }

  if (read !== undefined) {
    filter.read = read
  }

  // Calculate pagination
  const skip = (page - 1) * limit

  // Determine sort order
  const sort = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 }

  // Execute queries in parallel
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, read: false })
  ])

  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return {
    notifications: notifications as INotification[],
    total,
    unreadCount,
    page,
    limit,
    totalPages,
    hasMore
  }
}

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  return await Notification.countDocuments({ userId, read: false })
}

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<INotification | null> => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  )

  return notification
}

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<number> => {
  const result = await Notification.updateMany(
    { userId, read: false },
    { read: true }
  )

  return result.modifiedCount
}

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string, userId: string): Promise<boolean> => {
  const result = await Notification.deleteOne({ _id: notificationId, userId })
  return result.deletedCount > 0
}

/**
 * Delete all read notifications for a user
 */
export const deleteReadNotifications = async (userId: string): Promise<number> => {
  const result = await Notification.deleteMany({ userId, read: true })
  return result.deletedCount
}

/**
 * Create and send notification to a user
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any,
  expiresAt?: Date
): Promise<INotification> => {
  // Check if user has this notification type enabled
  const user = await User.findOne({ stacksAddress: userId })

  if (!user) {
    throw new Error('User not found')
  }

  // Check notification preferences
  const preferences = user.notificationPreferences
  if (preferences) {
    const preferenceMap: Record<NotificationType, keyof typeof preferences> = {
      badge_received: 'badgeReceived',
      badge_issued: 'badgeIssued',
      badge_verified: 'badgeVerified',
      community_update: 'communityUpdates',
      community_invite: 'communityInvite',
      system_announcement: 'systemAnnouncements'
    }

    const preferenceKey = preferenceMap[type]
    if (preferenceKey && preferences[preferenceKey] === false) {
      // User has disabled this notification type
      throw new Error(`User has disabled ${type} notifications`)
    }
  }

  // Create notification
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    data,
    read: false,
    expiresAt
  })

  // Emit real-time notification via WebSocket
  emitNotificationToUser(userId, notification.toObject())

  return notification
}

/**
 * Send notification to multiple users
 */
export const createNotificationForUsers = async (
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  data?: any,
  expiresAt?: Date
): Promise<INotification[]> => {
  const notifications: INotification[] = []

  for (const userId of userIds) {
    try {
      const notification = await createNotification(userId, type, title, message, data, expiresAt)
      notifications.push(notification)
    } catch (error) {
      console.error(`Failed to create notification for user ${userId}:`, error)
    }
  }

  return notifications
}

/**
 * Send system-wide announcement
 */
export const createSystemAnnouncement = async (
  title: string,
  message: string,
  data?: any,
  expiresAt?: Date
): Promise<void> => {
  // Get all users with system announcements enabled
  const users = await User.find({
    'notificationPreferences.systemAnnouncements': { $ne: false }
  }).select('stacksAddress')

  const userIds = users.map(u => u.stacksAddress)

  // Create notifications for all users
  const notifications = await Notification.insertMany(
    userIds.map(userId => ({
      userId,
      type: 'system_announcement',
      title,
      message,
      data,
      read: false,
      expiresAt
    }))
  )

  // Broadcast via WebSocket
  broadcastSystemAnnouncement({
    type: 'system_announcement',
    title,
    message,
    data
  })
}

/**
 * Clean up expired notifications
 */
export const cleanupExpiredNotifications = async (): Promise<number> => {
  const result = await Notification.deleteMany({
    expiresAt: { $lte: new Date() }
  })

  return result.deletedCount
}

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = async (userId: string) => {
  const stats = await Notification.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
        }
      }
    }
  ])

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      total: stat.count,
      unread: stat.unread
    }
    return acc
  }, {} as Record<NotificationType, { total: number; unread: number }>)
}
