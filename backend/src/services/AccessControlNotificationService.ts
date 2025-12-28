import { Server as SocketIOServer } from 'socket.io';
import { AnyAccessControlEvent, AccessControlEventType } from '../types/accessControl';

/**
 * Access Control Notification Service
 *
 * Real-time WebSocket notifications for permission changes
 */

export interface PermissionNotification {
  type: 'permission_changed' | 'role_assigned' | 'role_revoked' | 'admin_added' | 'admin_removed' | 'user_suspended' | 'security_alert';
  eventType: AccessControlEventType;
  principal: string;
  targetPrincipal?: string;
  communityId?: string;
  data: Record<string, any>;
  timestamp: Date;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
}

export class AccessControlNotificationService {
  private io?: SocketIOServer;
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    };
  }

  /**
   * Initialize WebSocket server
   */
  initialize(io: SocketIOServer): void {
    this.io = io;

    this.io.on('connection', (socket) => {
      this.logger.debug(`WebSocket client connected: ${socket.id}`);

      // Allow clients to subscribe to specific users or communities
      socket.on('subscribe:user', (principal: string) => {
        socket.join(`user:${principal}`);
        this.logger.debug(`Client subscribed to user: ${principal}`);
      });

      socket.on('subscribe:community', (communityId: string) => {
        socket.join(`community:${communityId}`);
        this.logger.debug(`Client subscribed to community: ${communityId}`);
      });

      socket.on('subscribe:security', () => {
        socket.join('security');
        this.logger.debug('Client subscribed to security alerts');
      });

      socket.on('unsubscribe:user', (principal: string) => {
        socket.leave(`user:${principal}`);
        this.logger.debug(`Client unsubscribed from user: ${principal}`);
      });

      socket.on('unsubscribe:community', (communityId: string) => {
        socket.leave(`community:${communityId}`);
        this.logger.debug(`Client unsubscribed from community: ${communityId}`);
      });

      socket.on('disconnect', () => {
        this.logger.debug(`WebSocket client disconnected: ${socket.id}`);
      });
    });

    this.logger.info('Access Control Notification Service initialized');
  }

  /**
   * Notify about access control event
   */
  notifyAccessControlEvent(event: AnyAccessControlEvent): void {
    if (!this.io) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    const notification: PermissionNotification = {
      type: this.getNotificationType(event.eventType),
      eventType: event.eventType,
      principal: event.principal,
      targetPrincipal: event.targetPrincipal,
      communityId: event.metadata?.communityId,
      data: event.metadata || {},
      timestamp: new Date(event.timestamp),
      severity: this.getSeverity(event.eventType)
    };

    // Broadcast to relevant rooms
    this.broadcastNotification(notification);

    this.logger.debug(`Access control notification sent: ${notification.type}`, {
      eventType: notification.eventType,
      principal: notification.principal
    });
  }

  /**
   * Notify about security alert
   */
  notifySecurityAlert(alert: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    principal: string;
  }): void {
    if (!this.io) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    // Send to security channel
    this.io.to('security').emit('security:alert', alert);

    // Send to affected user
    this.io.to(`user:${alert.principal}`).emit('permission:security_alert', alert);

    this.logger.debug('Security alert notification sent', {
      type: alert.type,
      severity: alert.severity,
      principal: alert.principal
    });
  }

  /**
   * Broadcast notification to relevant rooms
   */
  private broadcastNotification(notification: PermissionNotification): void {
    if (!this.io) return;

    // Broadcast to all subscribers
    this.io.emit('permission:updated', notification);

    // Broadcast to specific user (principal)
    this.io.to(`user:${notification.principal}`).emit('permission:user_updated', notification);

    // Broadcast to affected target user
    if (notification.targetPrincipal) {
      this.io.to(`user:${notification.targetPrincipal}`).emit('permission:user_updated', notification);
    }

    // Broadcast to community
    if (notification.communityId) {
      this.io.to(`community:${notification.communityId}`).emit('permission:community_updated', notification);
    }

    // Broadcast critical events to security channel
    if (notification.severity === 'critical' || notification.severity === 'high') {
      this.io.to('security').emit('permission:critical_change', notification);
    }
  }

  /**
   * Get notification type from event type
   */
  private getNotificationType(eventType: AccessControlEventType): PermissionNotification['type'] {
    switch (eventType) {
      case AccessControlEventType.ADMIN_ADDED:
        return 'admin_added';
      case AccessControlEventType.ADMIN_REMOVED:
        return 'admin_removed';
      case AccessControlEventType.ROLE_ASSIGNED:
        return 'role_assigned';
      case AccessControlEventType.ROLE_REVOKED:
        return 'role_revoked';
      case AccessControlEventType.USER_SUSPENDED:
      case AccessControlEventType.USER_UNSUSPENDED:
        return 'user_suspended';
      case AccessControlEventType.GLOBAL_PERMISSION_SET:
      case AccessControlEventType.COMMUNITY_PERMISSION_SET:
      default:
        return 'permission_changed';
    }
  }

  /**
   * Get severity level for event type
   */
  private getSeverity(eventType: AccessControlEventType): PermissionNotification['severity'] {
    switch (eventType) {
      case AccessControlEventType.ADMIN_ADDED:
      case AccessControlEventType.ADMIN_REMOVED:
      case AccessControlEventType.COMMUNITY_OWNERSHIP_TRANSFERRED:
        return 'critical';

      case AccessControlEventType.USER_SUSPENDED:
      case AccessControlEventType.GLOBAL_PERMISSION_SET:
        return 'high';

      case AccessControlEventType.ISSUER_AUTHORIZED:
      case AccessControlEventType.ISSUER_REVOKED:
      case AccessControlEventType.COMMUNITY_PERMISSION_SET:
        return 'medium';

      case AccessControlEventType.ROLE_ASSIGNED:
      case AccessControlEventType.ROLE_REVOKED:
        return 'low';

      default:
        return 'info';
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.io?.sockets.sockets.size || 0;
  }

  /**
   * Get room subscriber counts
   */
  getRoomSubscriberCounts(): Record<string, number> {
    if (!this.io) return {};

    const counts: Record<string, number> = {};

    this.io.sockets.adapter.rooms.forEach((sockets, room) => {
      // Skip socket IDs (they are also in rooms map)
      if (!room.startsWith('user:') && !room.startsWith('community:') && room !== 'security') {
        return;
      }
      counts[room] = sockets.size;
    });

    return counts;
  }
}

export default new AccessControlNotificationService();
