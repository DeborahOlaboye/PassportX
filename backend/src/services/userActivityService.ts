import { EventEmitter } from 'events'
import UserActivityFeed, { IUserActivityFeed, ActivityEventType } from '../models/UserActivityFeed'
import { broadcastActivityEvent, broadcastActivityUpdate } from '../config/socket'

export interface PaginationOptions {
  page: number
  limit: number
}

export interface ActivityFilters {
  eventType?: ActivityEventType
  isRead?: boolean
}

export class UserActivityService extends EventEmitter {
  private logger: any
  private readonly DEFAULT_PAGE_SIZE = 20
  private readonly MAX_PAGE_SIZE = 100

  constructor(logger?: any) {
    super()
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) =>
        console.debug(`[UserActivityService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) =>
        console.info(`[UserActivityService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) =>
        console.warn(`[UserActivityService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) =>
        console.error(`[UserActivityService] ${msg}`, ...args)
    }
  }

  async recordBadgeReceivedEvent(data: {
    userId: string
    badgeId: string
    badgeName: string
    category: string
    level: number
    blockHeight: number
    transactionHash: string
    contractAddress: string
  }): Promise<IUserActivityFeed> {
    try {
      const activity = new UserActivityFeed({
        userId: data.userId,
        eventType: 'badge_received',
        title: `Badge Received: ${data.badgeName}`,
        description: `You received the ${data.badgeName} badge (Level ${data.level})`,
        icon: '🎖️',
        metadata: {
          badgeId: data.badgeId,
          badgeName: data.badgeName,
          level: data.level,
          category: data.category,
          blockHeight: data.blockHeight,
          transactionHash: data.transactionHash,
          contractAddress: data.contractAddress
        },
        isRead: false
      })

      const savedActivity = await activity.save()
      this.logger.info('Recorded badge received event', { userId: data.userId, badgeId: data.badgeId })
      
      this.emit('activity:recorded', { userId: data.userId, activity: savedActivity })
      broadcastActivityEvent(data.userId, savedActivity)
      
      return savedActivity
    } catch (error) {
      this.logger.error('Error recording badge received event:', error)
      throw error
    }
  }

  async recordBadgeRevokedEvent(data: {
    userId: string
    badgeId: string
    badgeName: string
    revocationType: 'soft' | 'hard'
    blockHeight: number
    transactionHash: string
    contractAddress: string
  }): Promise<IUserActivityFeed> {
    try {
      const revocationText = data.revocationType === 'hard' ? 'permanently revoked' : 'temporarily revoked'
      const activity = new UserActivityFeed({
        userId: data.userId,
        eventType: 'badge_revoked',
        title: `Badge ${data.revocationType === 'hard' ? 'Revoked' : 'Suspended'}: ${data.badgeName}`,
        description: `Your ${data.badgeName} badge has been ${revocationText}`,
        icon: '❌',
        metadata: {
          badgeId: data.badgeId,
          badgeName: data.badgeName,
          revocationType: data.revocationType,
          blockHeight: data.blockHeight,
          transactionHash: data.transactionHash,
          contractAddress: data.contractAddress
        },
        isRead: false
      })

      const savedActivity = await activity.save()
      this.logger.info('Recorded badge revoked event', { userId: data.userId, badgeId: data.badgeId })
      
      this.emit('activity:recorded', { userId: data.userId, activity: savedActivity })
      broadcastActivityEvent(data.userId, savedActivity)
      
      return savedActivity
    } catch (error) {
      this.logger.error('Error recording badge revoked event:', error)
      throw error
    }
  }

  async recordCommunityJoinedEvent(data: {
    userId: string
    communityId: string
    communityName: string
    blockHeight: number
    transactionHash: string
    contractAddress: string
  }): Promise<IUserActivityFeed> {
    try {
      const activity = new UserActivityFeed({
        userId: data.userId,
        eventType: 'community_joined',
        title: `Joined Community: ${data.communityName}`,
        description: `You joined the ${data.communityName} community`,
        icon: '👥',
        metadata: {
          communityId: data.communityId,
          communityName: data.communityName,
          blockHeight: data.blockHeight,
          transactionHash: data.transactionHash,
          contractAddress: data.contractAddress
        },
        isRead: false
      })

      const savedActivity = await activity.save()
      this.logger.info('Recorded community joined event', { userId: data.userId, communityId: data.communityId })
      
      this.emit('activity:recorded', { userId: data.userId, activity: savedActivity })
      broadcastActivityEvent(data.userId, savedActivity)
      
      return savedActivity
    } catch (error) {
      this.logger.error('Error recording community joined event:', error)
      throw error
    }
  }

  async recordCommunityCreatedEvent(data: {
    userId: string
    communityId: string
    communityName: string
    blockHeight: number
    transactionHash: string
    contractAddress: string
  }): Promise<IUserActivityFeed> {
    try {
      const activity = new UserActivityFeed({
        userId: data.userId,
        eventType: 'community_created',
        title: `Created Community: ${data.communityName}`,
        description: `You created the ${data.communityName} community`,
        icon: '🌟',
        metadata: {
          communityId: data.communityId,
          communityName: data.communityName,
          blockHeight: data.blockHeight,
          transactionHash: data.transactionHash,
          contractAddress: data.contractAddress
        },
        isRead: false
      })

      const savedActivity = await activity.save()
      this.logger.info('Recorded community created event', { userId: data.userId, communityId: data.communityId })
      
      this.emit('activity:recorded', { userId: data.userId, activity: savedActivity })
      broadcastActivityEvent(data.userId, savedActivity)
      
      return savedActivity
    } catch (error) {
      this.logger.error('Error recording community created event:', error)
      throw error
    }
  }

  async recordBadgeMetadataUpdatedEvent(data: {
    userId: string
    badgeId: string
    badgeName: string
    updatedFields: string[]
    blockHeight: number
    transactionHash: string
    contractAddress: string
  }): Promise<IUserActivityFeed> {
    try {
      const fields = data.updatedFields.join(', ')
      const activity = new UserActivityFeed({
        userId: data.userId,
        eventType: 'badge_metadata_updated',
        title: `Badge Updated: ${data.badgeName}`,
        description: `The ${data.badgeName} badge was updated (${fields})`,
        icon: '⚙️',
        metadata: {
          badgeId: data.badgeId,
          badgeName: data.badgeName,
          blockHeight: data.blockHeight,
          transactionHash: data.transactionHash,
          contractAddress: data.contractAddress
        },
        isRead: false
      })

      const savedActivity = await activity.save()
      this.logger.info('Recorded badge metadata updated event', { userId: data.userId, badgeId: data.badgeId })
      
      this.emit('activity:recorded', { userId: data.userId, activity: savedActivity })
      broadcastActivityEvent(data.userId, savedActivity)
      
      return savedActivity
    } catch (error) {
      this.logger.error('Error recording badge metadata updated event:', error)
      throw error
    }
  }

  async recordPassportCreatedEvent(data: {
    userId: string
    blockHeight: number
    transactionHash: string
    contractAddress: string
  }): Promise<IUserActivityFeed> {
    try {
      const activity = new UserActivityFeed({
        userId: data.userId,
        eventType: 'passport_created',
        title: 'Passport Created',
        description: 'Your PassportX profile was created on the blockchain',
        icon: '🛂',
        metadata: {
          blockHeight: data.blockHeight,
          transactionHash: data.transactionHash,
          contractAddress: data.contractAddress
        },
        isRead: false
      })

      const savedActivity = await activity.save()
      this.logger.info('Recorded passport created event', { userId: data.userId })
      
      this.emit('activity:recorded', { userId: data.userId, activity: savedActivity })
      broadcastActivityEvent(data.userId, savedActivity)
      
      return savedActivity
    } catch (error) {
      this.logger.error('Error recording passport created event:', error)
      throw error
    }
  }

  async getUserActivityFeed(
    userId: string,
    options: PaginationOptions,
    filters?: ActivityFilters
  ): Promise<{ activities: IUserActivityFeed[]; total: number; hasMore: boolean }> {
    try {
      const page = Math.max(1, options.page)
      const limit = Math.min(options.limit, this.MAX_PAGE_SIZE) || this.DEFAULT_PAGE_SIZE
      const skip = (page - 1) * limit

      const query: any = { userId }

      if (filters?.eventType) {
        query.eventType = filters.eventType
      }

      if (filters?.isRead !== undefined) {
        query.isRead = filters.isRead
      }

      const [activities, total] = await Promise.all([
        UserActivityFeed.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        UserActivityFeed.countDocuments(query)
      ])

      const hasMore = skip + activities.length < total

      this.logger.debug('Retrieved user activity feed', { userId, page, limit, total })

      return { activities, total, hasMore }
    } catch (error) {
      this.logger.error('Error retrieving user activity feed:', error)
      throw error
    }
  }

  async markActivityAsRead(activityId: string): Promise<IUserActivityFeed | null> {
    try {
      const activity = await UserActivityFeed.findByIdAndUpdate(
        activityId,
        { isRead: true, updatedAt: new Date() },
        { new: true }
      )

      if (activity) {
        this.logger.debug('Marked activity as read', { activityId })
        this.emit('activity:marked-read', { activityId, userId: activity.userId })
        broadcastActivityUpdate(activity.userId, 'marked-read', { activityId })
      }

      return activity
    } catch (error) {
      this.logger.error('Error marking activity as read:', error)
      throw error
    }
  }

  async markAllActivitiesAsRead(userId: string): Promise<number> {
    try {
      const result = await UserActivityFeed.updateMany(
        { userId, isRead: false },
        { isRead: true, updatedAt: new Date() }
      )

      this.logger.info('Marked all activities as read', { userId, count: result.modifiedCount })
      this.emit('activities:marked-read-all', { userId, count: result.modifiedCount })
      broadcastActivityUpdate(userId, 'marked-read-all', { count: result.modifiedCount })

      return result.modifiedCount
    } catch (error) {
      this.logger.error('Error marking all activities as read:', error)
      throw error
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await UserActivityFeed.countDocuments({ userId, isRead: false })
      return count
    } catch (error) {
      this.logger.error('Error getting unread count:', error)
      throw error
    }
  }

  async deleteActivity(activityId: string): Promise<boolean> {
    try {
      const result = await UserActivityFeed.findByIdAndDelete(activityId)
      if (result) {
        this.logger.debug('Deleted activity', { activityId })
        this.emit('activity:deleted', { activityId, userId: result.userId })
        broadcastActivityUpdate(result.userId, 'deleted', { activityId })
        return true
      }
      return false
    } catch (error) {
      this.logger.error('Error deleting activity:', error)
      throw error
    }
  }

  async clearUserActivities(userId: string): Promise<number> {
    try {
      const result = await UserActivityFeed.deleteMany({ userId })
      this.logger.info('Cleared user activities', { userId, count: result.deletedCount })
      this.emit('activities:cleared', { userId, count: result.deletedCount })
      broadcastActivityUpdate(userId, 'cleared', { count: result.deletedCount })
      return result.deletedCount
    } catch (error) {
      this.logger.error('Error clearing user activities:', error)
      throw error
    }
  }
}

export default UserActivityService
