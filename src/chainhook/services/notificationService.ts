import {
  ChainhookEventPayload,
  NotificationPayload,
  ChainhookEventHandler,
  UserNotificationPreferences
} from '../types/handlers';
import { EventMapper } from '../utils/eventMapper';

export class NotificationService {
  private static handlers: Map<string, ChainhookEventHandler> = new Map();
  private static userPreferences: Map<string, UserNotificationPreferences> = new Map();

  static registerHandler(eventType: string, handler: ChainhookEventHandler): void {
    this.handlers.set(eventType, handler);
  }

  static getHandler(eventType: string): ChainhookEventHandler | undefined {
    return this.handlers.get(eventType);
  }

  static async processEvent(
    chainhookEvent: ChainhookEventPayload,
    eventPayload: any
  ): Promise<NotificationPayload[]> {
    try {
      const eventType = EventMapper.extractEventType(chainhookEvent);
      
      if (!eventType) {
        console.warn('Could not determine event type from Chainhook event');
        return [];
      }

      const handler = this.getHandler(eventType);
      
      if (!handler) {
        console.warn(`No handler registered for event type: ${eventType}`);
        return [];
      }

      const notifications = await handler.handle(chainhookEvent);
      
      return notifications;
    } catch (error) {
      console.error('Error processing Chainhook event:', error);
      return [];
    }
  }

  static async filterNotificationsByPreferences(
    notifications: NotificationPayload[],
    userPreferences: UserNotificationPreferences | null
  ): Promise<NotificationPayload[]> {
    if (!userPreferences) {
      return notifications;
    }

    return notifications.filter(notification => {
      switch (notification.type) {
        case 'badge_received':
        case 'badge_issued':
          return userPreferences.badges.enabled && userPreferences.badges.mint;
        
        case 'badge_verified':
          return userPreferences.badges.enabled && userPreferences.badges.verify;
        
        case 'community_update':
          return userPreferences.community.enabled && userPreferences.community.updates;
        
        case 'community_invite':
          return userPreferences.community.enabled && userPreferences.community.invites;
        
        case 'system_announcement':
          return userPreferences.system.enabled && userPreferences.system.announcements;
        
        default:
          return true;
      }
    });
  }

  static async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    return this.userPreferences.get(userId) || null;
  }

  static async setUserPreferences(
    userId: string,
    preferences: UserNotificationPreferences
  ): Promise<void> {
    preferences.updatedAt = new Date().toISOString();
    this.userPreferences.set(userId, preferences);
  }

  static async createDefaultPreferences(userId: string): Promise<UserNotificationPreferences> {
    const preferences: UserNotificationPreferences = {
      userId,
      badges: {
        enabled: true,
        mint: true,
        verify: true
      },
      community: {
        enabled: true,
        updates: true,
        invites: true
      },
      system: {
        enabled: true,
        announcements: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.userPreferences.set(userId, preferences);
    return preferences;
  }

  static async updateUserPreferences(
    userId: string,
    updates: Partial<UserNotificationPreferences>
  ): Promise<UserNotificationPreferences> {
    const existing = await this.getUserPreferences(userId);
    
    const updated: UserNotificationPreferences = {
      ...(existing || await this.createDefaultPreferences(userId)),
      ...updates,
      userId,
      updatedAt: new Date().toISOString()
    };

    await this.setUserPreferences(userId, updated);
    return updated;
  }

  static async disableNotificationType(userId: string, notificationType: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences) {
      await this.createDefaultPreferences(userId);
      return;
    }

    switch (notificationType) {
      case 'badge_received':
      case 'badge_issued':
        preferences.badges.mint = false;
        break;
      case 'badge_verified':
        preferences.badges.verify = false;
        break;
      case 'community_update':
        preferences.community.updates = false;
        break;
      case 'community_invite':
        preferences.community.invites = false;
        break;
      case 'system_announcement':
        preferences.system.announcements = false;
        break;
    }

    await this.setUserPreferences(userId, preferences);
  }

  static async enableNotificationType(userId: string, notificationType: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences) {
      await this.createDefaultPreferences(userId);
      return;
    }

    switch (notificationType) {
      case 'badge_received':
      case 'badge_issued':
        preferences.badges.mint = true;
        break;
      case 'badge_verified':
        preferences.badges.verify = true;
        break;
      case 'community_update':
        preferences.community.updates = true;
        break;
      case 'community_invite':
        preferences.community.invites = true;
        break;
      case 'system_announcement':
        preferences.system.announcements = true;
        break;
    }

    await this.setUserPreferences(userId, preferences);
  }
}
