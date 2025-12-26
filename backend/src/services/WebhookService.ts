import Webhook, { IWebhook } from '../models/Webhook'
import crypto from 'crypto'
import axios, { AxiosResponse } from 'axios'

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

  async registerWebhook(url: string, events: string[], secret?: string): Promise<IWebhook> {
    // Validate URL
    this.validateWebhookUrl(url)

    // Validate events
    this.validateEvents(events)

    console.log(`Registering webhook for URL: ${url} with events: ${events.join(', ')}`)

    // Generate secret if not provided
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex')

    const webhook = new Webhook({
      url,
      secret: webhookSecret,
      events,
      isActive: true
    })

    const savedWebhook = await webhook.save()
    console.log(`Webhook registered successfully with ID: ${savedWebhook._id}`)

    return savedWebhook
  }

  async getActiveWebhooks(event?: string): Promise<IWebhook[]> {
    const query: any = { isActive: true }
    if (event) {
      query.events = event
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
        await this.updateWebhook(webhook._id.toString(), {
          lastDeliveredAt: new Date(),
          failureCount: 0
        } as any)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
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
}

export default WebhookService