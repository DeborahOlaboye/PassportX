import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import WebhookService from '../WebhookService'
import Webhook from '../models/Webhook'
import { connectDB, closeDB } from '../utils/database'

describe('WebhookService', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await closeDB()
  })

  beforeEach(async () => {
    await Webhook.deleteMany({})
  })

  describe('registerWebhook', () => {
    it('should register a valid webhook', async () => {
      const service = WebhookService.getInstance()
      const webhook = await service.registerWebhook(
        'https://example.com/webhook',
        ['badge_mint'],
        'test-secret'
      )

      expect(webhook.url).toBe('https://example.com/webhook')
      expect(webhook.events).toEqual(['badge_mint'])
      expect(webhook.secret).toBe('test-secret')
      expect(webhook.isActive).toBe(true)
    })

    it('should reject invalid URL', async () => {
      const service = WebhookService.getInstance()

      await expect(
        service.registerWebhook('invalid-url', ['badge_mint'])
      ).rejects.toThrow('Invalid webhook URL')
    })

    it('should reject non-HTTPS URL', async () => {
      const service = WebhookService.getInstance()

      await expect(
        service.registerWebhook('http://example.com/webhook', ['badge_mint'])
      ).rejects.toThrow('Webhook URL must use HTTPS')
    })

    it('should reject invalid events', async () => {
      const service = WebhookService.getInstance()

      await expect(
        service.registerWebhook('https://example.com/webhook', ['invalid_event'])
      ).rejects.toThrow('Invalid event type')
    })

    it('should generate secret if not provided', async () => {
      const service = WebhookService.getInstance()
      const webhook = await service.registerWebhook(
        'https://example.com/webhook',
        ['badge_mint']
      )

      expect(webhook.secret).toBeDefined()
      expect(typeof webhook.secret).toBe('string')
      expect(webhook.secret.length).toBeGreaterThan(0)
    })
  })

  describe('getActiveWebhooks', () => {
    it('should return active webhooks for specific event', async () => {
      const service = WebhookService.getInstance()

      await service.registerWebhook('https://example1.com/webhook', ['badge_mint'])
      await service.registerWebhook('https://example2.com/webhook', ['badge_verification'])

      const badgeMintWebhooks = await service.getActiveWebhooks('badge_mint')
      const badgeVerificationWebhooks = await service.getActiveWebhooks('badge_verification')

      expect(badgeMintWebhooks.length).toBe(1)
      expect(badgeVerificationWebhooks.length).toBe(1)
      expect(badgeMintWebhooks[0].url).toBe('https://example1.com/webhook')
      expect(badgeVerificationWebhooks[0].url).toBe('https://example2.com/webhook')
    })

    it('should return all active webhooks when no event specified', async () => {
      const service = WebhookService.getInstance()

      await service.registerWebhook('https://example1.com/webhook', ['badge_mint'])
      await service.registerWebhook('https://example2.com/webhook', ['badge_verification'])

      const allWebhooks = await service.getActiveWebhooks()

      expect(allWebhooks.length).toBe(2)
    })
  })

  describe('updateWebhook', () => {
    it('should update webhook properties', async () => {
      const service = WebhookService.getInstance()
      const webhook = await service.registerWebhook(
        'https://example.com/webhook',
        ['badge_mint']
      )

      const updated = await service.updateWebhook(webhook._id.toString(), {
        events: ['badge_mint', 'badge_verification'],
        isActive: false
      } as any)

      expect(updated?.events).toEqual(['badge_mint', 'badge_verification'])
      expect(updated?.isActive).toBe(false)
    })
  })

  describe('deleteWebhook', () => {
    it('should delete webhook', async () => {
      const service = WebhookService.getInstance()
      const webhook = await service.registerWebhook(
        'https://example.com/webhook',
        ['badge_mint']
      )

      const deleted = await service.deleteWebhook(webhook._id.toString())
      expect(deleted).toBe(true)

      const webhooks = await service.getActiveWebhooks()
      expect(webhooks.length).toBe(0)
    })
  })
})