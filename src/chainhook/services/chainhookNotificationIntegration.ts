import {
  ChainhookEventPayload,
  ChainhookEventHandler,
  NotificationPayload
} from '../types/handlers'
import { NotificationService } from './notificationService'
import { WebSocketEventEmitter } from './webSocketEventEmitter'
import { BadgeMintHandler } from '../handlers/badgeMintHandler'
import { BadgeVerificationHandler } from '../handlers/badgeVerificationHandler'
import { CommunityUpdateHandler } from '../handlers/communityUpdateHandler'

export class ChainhookNotificationIntegration {
  private static initialized = false
  private static handlers: Map<string, ChainhookEventHandler> = new Map()

  static initialize(): void {
    if (this.initialized) {
      console.warn('ChainhookNotificationIntegration already initialized')
      return
    }

    this.registerDefaultHandlers()
    this.initialized = true
    console.log('ChainhookNotificationIntegration initialized with default handlers')
  }

  private static registerDefaultHandlers(): void {
    const badgeMintHandler = new BadgeMintHandler()
    const badgeVerificationHandler = new BadgeVerificationHandler()
    const communityUpdateHandler = new CommunityUpdateHandler()

    NotificationService.registerHandler(badgeMintHandler.getEventType(), badgeMintHandler)
    NotificationService.registerHandler(badgeVerificationHandler.getEventType(), badgeVerificationHandler)
    NotificationService.registerHandler(communityUpdateHandler.getEventType(), communityUpdateHandler)

    this.handlers.set(badgeMintHandler.getEventType(), badgeMintHandler)
    this.handlers.set(badgeVerificationHandler.getEventType(), badgeVerificationHandler)
    this.handlers.set(communityUpdateHandler.getEventType(), communityUpdateHandler)
  }

  static registerHandler(eventType: string, handler: ChainhookEventHandler): void {
    NotificationService.registerHandler(eventType, handler)
    this.handlers.set(eventType, handler)
    console.log(`Handler registered for event type: ${eventType}`)
  }

  static async processChainhookEvent(
    chainhookEvent: ChainhookEventPayload,
    eventPayload: any
  ): Promise<void> {
    try {
      console.log('Processing Chainhook event for notifications')

      const notifications = await NotificationService.processEvent(
        chainhookEvent,
        eventPayload
      )

      if (notifications.length === 0) {
        console.log('No notifications generated from Chainhook event')
        return
      }

      await this.deliverNotifications(notifications)
      await this.emitNotificationEvents(notifications)

      console.log(`Successfully processed ${notifications.length} notifications`)
    } catch (error) {
      console.error('Error processing Chainhook event:', error)
      throw error
    }
  }

  private static async deliverNotifications(notifications: NotificationPayload[]): Promise<void> {
    for (const notification of notifications) {
      try {
        const userPreferences = await NotificationService.getUserPreferences(
          notification.userId
        )

        const shouldSend = userPreferences
          ? !(
              (notification.type === 'badge_received' && !userPreferences.badges.mint) ||
              (notification.type === 'badge_verified' && !userPreferences.badges.verify) ||
              (notification.type === 'community_update' && !userPreferences.community.updates) ||
              (notification.type === 'community_invite' && !userPreferences.community.invites) ||
              (notification.type === 'system_announcement' && !userPreferences.system.announcements)
            )
          : true

        if (!shouldSend) {
          console.log(`Skipping notification for user ${notification.userId} due to preferences`)
          continue
        }

        await WebSocketEventEmitter.emitNotification(notification)
      } catch (error) {
        console.error(`Error delivering notification to user ${notification.userId}:`, error)
      }
    }
  }

  private static async emitNotificationEvents(notifications: NotificationPayload[]): Promise<void> {
    for (const notification of notifications) {
      try {
        await WebSocketEventEmitter.emitNotification(notification)
      } catch (error) {
        console.error('Error emitting notification event:', error)
      }
    }
  }

  static async broadcastChainhookEvent(
    chainhookEvent: ChainhookEventPayload,
    eventData: any
  ): Promise<void> {
    try {
      await WebSocketEventEmitter.broadcastChainhookEvent(chainhookEvent, eventData)
    } catch (error) {
      console.error('Error broadcasting Chainhook event:', error)
    }
  }

  static getRegisteredHandlers(): Map<string, ChainhookEventHandler> {
    return new Map(this.handlers)
  }

  static isInitialized(): boolean {
    return this.initialized
  }
}
