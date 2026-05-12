import { Server as SocketIOServer } from 'socket.io';
import { NotificationService } from './NotificationService';
import { Notification } from '../models/Notification';

export class NotificationWebSocketService {
  private io: SocketIOServer;
  private notificationService: NotificationService;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.notificationService = new NotificationService();
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId as string;

      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} connected to notification service`);
      }

      socket.on('disconnect', () => {
        if (userId) {
          socket.leave(`user:${userId}`);
          console.log(`User ${userId} disconnected from notification service`);
        }
      });
    });
  }

  async sendNotificationToUser(userId: string, notification: Notification): Promise<void> {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  async notifyNotificationRead(userId: string, notificationId: string): Promise<void> {
    this.io.to(`user:${userId}`).emit('notification:read', { notificationId });
  }

  async notifyNotificationDeleted(userId: string, notificationId: string): Promise<void> {
    this.io.to(`user:${userId}`).emit('notification:deleted', { notificationId });
  }
}
