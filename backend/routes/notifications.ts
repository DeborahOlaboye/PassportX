import express from 'express';
import { NotificationService } from '../services/NotificationService';
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../../src/types/notification';

interface AuthRequest extends express.Request {
  user?: { id: string };
}

const router = express.Router();
const notificationService = new NotificationService();

// GET /api/notifications - Get user notifications
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = req.query.status as NotificationStatus | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await notificationService.getNotificationsByUserId(
      userId,
      status,
      limit
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications - Create a new notification
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, title, message, channels, metadata } = req.body;
    const notification = await notificationService.createNotification({
      userId,
      type,
      title,
      message,
      status: NotificationStatus.UNREAD,
      channels,
      metadata,
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await notificationService.getNotificationById(
      req.params.id
    );
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await notificationService.markAsRead(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await notificationService.getNotificationById(
      req.params.id
    );
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const deleted = await notificationService.deleteNotification(req.params.id);
    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await notificationService.markAllAsRead(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export default router;
