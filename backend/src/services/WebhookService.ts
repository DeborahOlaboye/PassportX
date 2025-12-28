import Webhook, { IWebhook } from '../models/Webhook'
import crypto from 'crypto'
import axios, { AxiosResponse } from 'axios'
import { BadgeCategory, BadgeLevel, BadgeCategoryFilter } from './BadgeCategoryFilter'

export interface WebhookPayload {
  event: string
  data: any
  timestamp: string
  signature?: string
}

export class WebhookService {
  private static instance: WebhookService

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService()
    }
    return WebhookService.instance
  }

  async registerWebhook(
    url: string,
    events: string[],
    secret?: string,
    categories?: BadgeCategory[],
    levels?: BadgeLevel[]
  ): Promise<IWebhook> {
    // Validate URL
    this.validateWebhookUrl(url)

    // Validate events
    this.validateEvents(events)

    // Validate categories and levels
    if (categories) {
      this.validateCategories(categories)
    }
    if (levels) {
      this.validateLevels(levels)
    }

    console.log(`Registering webhook for URL: ${url} with events: ${events.join(', ')}`)

    // Generate secret if not provided
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex')

    const webhook = new Webhook({
      url,
      secret: webhookSecret,
      events,
      categories,
      levels,
      isActive: true
    })

    const savedWebhook = await webhook.save()
    console.log(`Webhook registered successfully with ID: ${savedWebhook._id}`)

    return savedWebhook
  }

  async getActiveWebhooks(event?: string, category?: BadgeCategory, level?: BadgeLevel): Promise<IWebhook[]> {
    const query: any = { isActive: true }

    if (event) {
      query.events = event
    }

    if (category) {
      query.categories = category
    }

    if (level) {
      query.levels = level
    }

    return await Webhook.find(query)
  }

  async updateWebhook(id: string, updates: Partial<IWebhook>): Promise<IWebhook | null> {
    return await Webhook.findByIdAndUpdate(id, updates, { new: true })
  }

  async deleteWebhook(id: string): Promise<boolean> {
    const result = await Webhook.findByIdAndDelete(id)
    return !!result
  }

  async sendWebhook(webhook: IWebhook, payload: WebhookPayload): Promise<void> {
    const signature = this.generateSignature(payload, webhook.secret)

    const signedPayload = {
      ...payload,
      signature
    }

    console.log(`Sending webhook to ${webhook.url} for event ${payload.event}`)

    try {
      const response: AxiosResponse = await axios.post(webhook.url, signedPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'User-Agent': 'PassportX-Webhook/1.0'
        },
        timeout: 10000 // 10 seconds
      })

      if (response.status >= 200 && response.status < 300) {
        console.log(`Webhook delivered successfully to ${webhook.url}`)
        await this.updateWebhook(webhook._id.toString(), {
          lastDeliveredAt: new Date(),
          failureCount: 0
        } as any)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error(`Webhook delivery failed to ${webhook.url}:`, error)
      await this.handleWebhookFailure(webhook, error)
      throw error
    }
  }

  private generateSignature(payload: WebhookPayload, secret: string): string {
    const payloadString = JSON.stringify(payload)
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex')
  }

  private async handleWebhookFailure(webhook: IWebhook, error: any): Promise<void> {
    const newFailureCount = webhook.failureCount + 1

    const updates: any = {
      failureCount: newFailureCount
    }

    // Deactivate webhook after 5 consecutive failures
    if (newFailureCount >= 5) {
      updates.isActive = false
    }

    await this.updateWebhook(webhook._id.toString(), updates)
  }

  async retryFailedWebhooks(): Promise<void> {
    const failedWebhooks = await Webhook.find({
      isActive: true,
      failureCount: { $gt: 0, $lt: 5 }
    })

    console.log(`Retrying ${failedWebhooks.length} failed webhooks`)

    for (const webhook of failedWebhooks) {
      try {
        // Send a test payload or last failed payload
        const testPayload = {
          event: 'retry',
          data: { message: 'Retrying failed webhook delivery' },
          timestamp: new Date().toISOString()
        }

        await this.sendWebhook(webhook, testPayload)
        console.log(`Successfully retried webhook ${webhook._id}`)
      } catch (error) {
        console.error(`Retry failed for webhook ${webhook._id}:`, error)
      }
    }
  }

  /**
   * Broadcast reorg event to all registered webhooks
   */
  async broadcastReorgEvent(reorgEvent: any): Promise<void> {
    const webhooks = await this.getActiveWebhooks()

    const payload: WebhookPayload = {
      event: 'blockchain_reorg',
      data: reorgEvent,
      timestamp: new Date().toISOString()
    }

    console.log(`Broadcasting reorg event to ${webhooks.length} webhooks`)

    for (const webhook of webhooks) {
      try {
        await this.sendWebhook(webhook, payload)
      } catch (error) {
        console.error(`Failed to send reorg event to webhook ${webhook._id}:`, error)
      }
    }
  }

  /**
   * Mark webhook as invalid due to reorg
   */
  async markWebhookInvalid(transactionHash: string, reason: string): Promise<void> {
    // Find webhooks that might have delivered events for this transaction
    // This is a simplified implementation - in practice, you'd track
    // which webhooks received which transaction events
    console.log(`Marking webhooks invalid for transaction ${transactionHash} due to ${reason}`)

    // For now, just log the intent. In a full implementation, you'd:
    // 1. Find webhooks that received events for this transaction
    // 2. Mark their deliveries as potentially invalid
    // 3. Send correction webhooks if needed
  }

  private validateWebhookUrl(url: string): void {
    try {
      const parsedUrl = new URL(url)

      if (parsedUrl.protocol !== 'https:') {
        throw new Error('Webhook URL must use HTTPS')
      }

      if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
        throw new Error('Invalid hostname in webhook URL')
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid webhook URL: ${error.message}`)
      }
      throw new Error('Invalid webhook URL')
    }
  }

  private validateEvents(events: string[]): void {
    const validEvents = ['badge_mint', 'badge_verification', 'community_update', 'test']

    for (const event of events) {
      if (!validEvents.includes(event)) {
        throw new Error(`Invalid event type: ${event}. Valid events: ${validEvents.join(', ')}`)
      }
    }

    if (events.length === 0) {
      throw new Error('At least one event type must be specified')
    }
  }

  private validateCategories(categories: BadgeCategory[]): void {
    const categoryFilter = BadgeCategoryFilter.getInstance()
    const validCategories = categoryFilter.getValidCategories()

    for (const category of categories) {
      if (!validCategories.includes(category)) {
        throw new Error(`Invalid category: ${category}. Valid categories: ${validCategories.join(', ')}`)
      }
    }
  }

  private validateLevels(levels: BadgeLevel[]): void {
    const categoryFilter = BadgeCategoryFilter.getInstance()
    const validLevels = categoryFilter.getValidLevels()

    for (const level of levels) {
      if (!validLevels.includes(level)) {
        throw new Error(`Invalid level: ${level}. Valid levels: ${validLevels.join(', ')}`)
      }
    }
  }
}

export default WebhookService