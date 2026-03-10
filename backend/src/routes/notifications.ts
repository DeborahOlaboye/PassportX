import express, { Response } from 'express';
import { AuthRequest } from '../types';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { createRateLimiter } from '../middleware/rateLimiter';
import { NOTIFICATION_WRITE_RATE_LIMIT } from '../config/rateLimits';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationStats,
  createNotification,
  createSystemAnnouncement,
} from '../services/notificationService';
import logger from '../utils/logger';

const router = express.Router();

// Rate limiter for notification write operations (50 requests per 15 minutes)
const notificationWriteLimiter = createRateLimiter(
  NOTIFICATION_WRITE_RATE_LIMIT
);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Returns paginated notifications for the authenticated user with optional type and read-status filters.
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, example: "badge_issued" }
 *       - in: query
 *         name: read
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [newest, oldest], default: newest }
 *     responses:
 *       200:
 *         description: Paginated notification list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get(
  '/',
  authenticateToken,
  validatePagination,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.stacksAddress;
      const { type, read, page, limit, sortBy = 'newest' } = req.query;

      const result = await getUserNotifications({
        userId,
        type: type
          ? Array.isArray(type)
            ? (type as string[])
            : [type as string]
          : undefined,
        read: read === 'true' ? true : read === 'false' ? false : undefined,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as 'newest' | 'oldest',
      });

      res.json(result);
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer, example: 5 }
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics by type
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notification stats grouped by type
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer, example: 12 }
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 */
router.get(
  '/unread-count',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.stacksAddress;
      const count = await getUnreadCount(userId);

      res.json({ count });
    } catch (error) {
      logger.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }
);

/**
 * GET /api/notifications/stats
 * Get notification statistics by type
 */
router.get(
  '/stats',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.stacksAddress;
      const stats = await getNotificationStats(userId);

      res.json(stats);
    } catch (error) {
      logger.error('Error fetching notification stats:', error);
      res.status(500).json({ error: 'Failed to fetch notification stats' });
    }
  }
);

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put(
  '/:id/read',
  notificationWriteLimiter,
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.stacksAddress;
      const { id } = req.params;

      const notification = await markNotificationAsRead(id, userId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }
);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put(
  '/read-all',
  notificationWriteLimiter,
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.stacksAddress;
      const count = await markAllNotificationsAsRead(userId);

      res.json({ message: `${count} notifications marked as read`, count });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res
        .status(500)
        .json({ error: 'Failed to mark all notifications as read' });
    }
  }
);

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete(
  '/:id',
  notificationWriteLimiter,
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.stacksAddress;
      const { id } = req.params;

      const deleted = await deleteNotification(id, userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }
);

/**
 * DELETE /api/notifications/read
 * Delete all read notifications
 */
router.delete(
  '/read',
  notificationWriteLimiter,
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.stacksAddress;
      const count = await deleteReadNotifications(userId);

      res.json({ message: `${count} read notifications deleted`, count });
    } catch (error) {
      logger.error('Error deleting read notifications:', error);
      res.status(500).json({ error: 'Failed to delete read notifications' });
    }
  }
);

/**
 * POST /api/notifications/test
 * Create test notification (development only)
 */
router.post(
  '/test',
  notificationWriteLimiter,
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res
          .status(403)
          .json({ error: 'Test notifications not available in production' });
      }

      const userId = req.user!.stacksAddress;
      const { type, title, message, data } = req.body;

      const notification = await createNotification(
        userId,
        type,
        title,
        message,
        data
      );

      res.json({ message: 'Test notification created', notification });
    } catch (error: unknown) {
      logger.error('Error creating test notification:', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create test notification',
      });
    }
  }
);

/**
 * POST /api/notifications/system-announcement
 * Create system-wide announcement (admin only)
 */
router.post(
  '/system-announcement',
  notificationWriteLimiter,
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, message, data, expiresAt } = req.body;

      if (!title || !message) {
        return res
          .status(400)
          .json({ error: 'Title and message are required' });
      }

      await createSystemAnnouncement(
        title,
        message,
        data,
        expiresAt ? new Date(expiresAt) : undefined
      );

      res.json({ message: 'System announcement sent successfully' });
    } catch (error) {
      logger.error('Error creating system announcement:', error);
      res.status(500).json({ error: 'Failed to create system announcement' });
    }
  }
);

export default router;
