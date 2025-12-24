import express, { Request, Response } from 'express'
import UserActivityService from '../services/userActivityService'

const router = express.Router()

let userActivityService: UserActivityService | null = null

export function setUserActivityService(service: UserActivityService) {
  userActivityService = service
}

const handleError = (res: Response, error: any, message: string) => {
  console.error(message, error)
  res.status(500).json({
    success: false,
    error: message,
    details: error instanceof Error ? error.message : String(error)
  })
}

router.get('/feed', async (req: Request, res: Response) => {
  try {
    if (!userActivityService) {
      return res.status(503).json({
        success: false,
        error: 'Activity service not initialized'
      })
    }

    const userId = req.query.userId as string
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const eventType = req.query.eventType as any
    const isRead = req.query.isRead as string

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      })
    }

    const filters: any = {}
    if (eventType) {
      filters.eventType = eventType
    }
    if (isRead !== undefined) {
      filters.isRead = isRead === 'true'
    }

    const result = await userActivityService.getUserActivityFeed(
      userId,
      { page, limit },
      filters
    )

    res.json({
      success: true,
      data: {
        activities: result.activities,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore
        }
      }
    })
  } catch (error) {
    handleError(res, error, 'Error fetching activity feed')
  }
})

router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    if (!userActivityService) {
      return res.status(503).json({
        success: false,
        error: 'Activity service not initialized'
      })
    }

    const userId = req.query.userId as string

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      })
    }

    const count = await userActivityService.getUnreadCount(userId)

    res.json({
      success: true,
      data: { unreadCount: count }
    })
  } catch (error) {
    handleError(res, error, 'Error fetching unread count')
  }
})

router.post('/mark-as-read', async (req: Request, res: Response) => {
  try {
    if (!userActivityService) {
      return res.status(503).json({
        success: false,
        error: 'Activity service not initialized'
      })
    }

    const { activityId } = req.body

    if (!activityId) {
      return res.status(400).json({
        success: false,
        error: 'activityId is required'
      })
    }

    const activity = await userActivityService.markActivityAsRead(activityId)

    res.json({
      success: !!activity,
      data: activity
    })
  } catch (error) {
    handleError(res, error, 'Error marking activity as read')
  }
})

router.post('/mark-all-as-read', async (req: Request, res: Response) => {
  try {
    if (!userActivityService) {
      return res.status(503).json({
        success: false,
        error: 'Activity service not initialized'
      })
    }

    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      })
    }

    const count = await userActivityService.markAllActivitiesAsRead(userId)

    res.json({
      success: true,
      data: { markedCount: count }
    })
  } catch (error) {
    handleError(res, error, 'Error marking all activities as read')
  }
})

router.delete('/:activityId', async (req: Request, res: Response) => {
  try {
    if (!userActivityService) {
      return res.status(503).json({
        success: false,
        error: 'Activity service not initialized'
      })
    }

    const { activityId } = req.params

    if (!activityId) {
      return res.status(400).json({
        success: false,
        error: 'activityId is required'
      })
    }

    const success = await userActivityService.deleteActivity(activityId)

    res.json({
      success,
      data: success ? { deleted: true } : { deleted: false }
    })
  } catch (error) {
    handleError(res, error, 'Error deleting activity')
  }
})

router.delete('/user/:userId', async (req: Request, res: Response) => {
  try {
    if (!userActivityService) {
      return res.status(503).json({
        success: false,
        error: 'Activity service not initialized'
      })
    }

    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      })
    }

    const count = await userActivityService.clearUserActivities(userId)

    res.json({
      success: true,
      data: { deletedCount: count }
    })
  } catch (error) {
    handleError(res, error, 'Error clearing user activities')
  }
})

export default router
