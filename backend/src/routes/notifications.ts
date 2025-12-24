import express, { Response } from 'express'
import { AuthRequest } from '../types'
import { authenticateToken } from '../middleware/auth'
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationStats,
  createNotification,
  createSystemAnnouncement
} from '../services/notificationService'

const router = express.Router()

/**
 * GET /api/notifications
 * Get user notifications with pagination and filtering
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.stacksAddress
    const {
      type,
      read,
      page = '1',
      limit = '20',
      sortBy = 'newest'
    } = req.query

    const result = await getUserNotifications({
      userId,
      type: type ? (Array.isArray(type) ? type as string[] : [type as string]) : undefined,
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as 'newest' | 'oldest'
    })

    res.json(result)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.stacksAddress
    const count = await getUnreadCount(userId)

    res.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    res.status(500).json({ error: 'Failed to fetch unread count' })
  }
})

/**
 * GET /api/notifications/stats
 * Get notification statistics by type
 */
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.stacksAddress
    const stats = await getNotificationStats(userId)

    res.json(stats)
  } catch (error) {
    console.error('Error fetching notification stats:', error)
    res.status(500).json({ error: 'Failed to fetch notification stats' })
  }
})

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.stacksAddress
    const { id } = req.params

    const notification = await markNotificationAsRead(id, userId)

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ message: 'Notification marked as read', notification })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.stacksAddress
    const count = await markAllNotificationsAsRead(userId)

    res.json({ message: `${count} notifications marked as read`, count })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
})

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.stacksAddress
    const { id } = req.params

    const deleted = await deleteNotification(id, userId)

    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

/**
 * DELETE /api/notifications/read
 * Delete all read notifications
 */
router.delete('/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.stacksAddress
    const count = await deleteReadNotifications(userId)

    res.json({ message: `${count} read notifications deleted`, count })
  } catch (error) {
    console.error('Error deleting read notifications:', error)
    res.status(500).json({ error: 'Failed to delete read notifications' })
  }
})

/**
 * POST /api/notifications/test
 * Create test notification (development only)
 */
router.post('/test', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test notifications not available in production' })
    }

    const userId = req.user!.stacksAddress
    const { type, title, message, data } = req.body

    const notification = await createNotification(userId, type, title, message, data)

    res.json({ message: 'Test notification created', notification })
  } catch (error: any) {
    console.error('Error creating test notification:', error)
    res.status(500).json({ error: error.message || 'Failed to create test notification' })
  }
})

/**
 * POST /api/notifications/system-announcement
 * Create system-wide announcement (admin only)
 */
router.post('/system-announcement', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Add admin authorization check
    const { title, message, data, expiresAt } = req.body

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' })
    }

    await createSystemAnnouncement(
      title,
      message,
      data,
      expiresAt ? new Date(expiresAt) : undefined
    )

    res.json({ message: 'System announcement sent successfully' })
  } catch (error) {
    console.error('Error creating system announcement:', error)
    res.status(500).json({ error: 'Failed to create system announcement' })
  }
})

export default router
