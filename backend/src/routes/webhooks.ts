import { Router, Request, Response } from 'express'
import WebhookService from '../services/WebhookService'
import { authMiddleware } from '../middleware/auth'

const router = Router()
const webhookService = WebhookService.getInstance()

// Webhook management routes

// Register a new webhook
router.post('/register', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { url, events, secret, categories, levels } = req.body

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({
        error: 'Missing required fields: url and events array'
      })
    }

    const webhook = await webhookService.registerWebhook(url, events, secret, categories, levels)

    res.status(201).json({
      message: 'Webhook registered successfully',
      webhook: {
        id: webhook._id,
        url: webhook.url,
        events: webhook.events,
        categories: webhook.categories,
        levels: webhook.levels,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to register webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get all webhooks for the authenticated user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const webhooks = await webhookService.getActiveWebhooks()

    res.json({
      webhooks: webhooks.map(webhook => ({
        id: webhook._id,
        url: webhook.url,
        events: webhook.events,
        categories: webhook.categories,
        levels: webhook.levels,
        isActive: webhook.isActive,
        lastDeliveredAt: webhook.lastDeliveredAt,
        failureCount: webhook.failureCount,
        createdAt: webhook.createdAt
      }))
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch webhooks',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update webhook
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    const webhook = await webhookService.updateWebhook(id, updates)

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' })
    }

    res.json({
      message: 'Webhook updated successfully',
      webhook: {
        id: webhook._id,
        url: webhook.url,
        events: webhook.events,
        categories: webhook.categories,
        levels: webhook.levels,
        isActive: webhook.isActive
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete webhook
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const deleted = await webhookService.deleteWebhook(id)

    if (!deleted) {
      return res.status(404).json({ error: 'Webhook not found' })
    }

    res.json({ message: 'Webhook deleted successfully' })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Test webhook endpoint
router.post('/:id/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const testPayload = {
      event: 'test',
      data: { message: 'This is a test webhook' },
      timestamp: new Date().toISOString()
    }

    const webhooks = await webhookService.getActiveWebhooks()
    const webhook = webhooks.find(w => w._id.toString() === id)

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' })
    }

    await webhookService.sendWebhook(webhook, testPayload)

    res.json({ message: 'Test webhook sent successfully' })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send test webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Retry failed webhooks
router.post('/retry-failed', authMiddleware, async (req: Request, res: Response) => {
  try {
    await webhookService.retryFailedWebhooks()

    res.json({ message: 'Retry process initiated for failed webhooks' })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retry webhooks',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router