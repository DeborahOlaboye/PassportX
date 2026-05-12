import express from 'express';
import { NotificationService } from '../services/NotificationService';
import { NotificationType, NotificationChannel, NotificationStatus } from '../../src/types/notification';

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

    const notifications = await notificationService.getNotificationsByUserId(userId, status, limit);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

export default router;
