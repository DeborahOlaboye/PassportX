import request from 'supertest'
import express from 'express'
import webhooksRoutes from '../../routes/webhooks'
import { errorHandler } from '../../middleware/errorHandler'
import { connectDB, closeDB } from '../../utils/database'

const app = express()
app.use(express.json())
app.use('/api/webhooks', webhooksRoutes)
app.use(errorHandler)

describe('Webhook Routes', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await closeDB()
  })

  beforeEach(async () => {
    await Webhook.deleteMany({})
  })

  describe('POST /api/webhooks/register', () => {
    it('should register a webhook', async () => {
      const response = await request(app)
        .post('/api/webhooks/register')
        .send({
          url: 'https://example.com/webhook',
          events: ['badge_mint']
        })
        .expect(201)

      expect(response.body.message).toBe('Webhook registered successfully')
      expect(response.body.webhook.url).toBe('https://example.com/webhook')
      expect(response.body.webhook.events).toEqual(['badge_mint'])
    })

    it('should reject invalid URL', async () => {
      const response = await request(app)
        .post('/api/webhooks/register')
        .send({
          url: 'invalid-url',
          events: ['badge_mint']
        })
        .expect(500)

      expect(response.body.error).toContain('Invalid webhook URL')
    })
  })

  describe('GET /api/webhooks', () => {
    it('should return webhooks', async () => {
      // Register a webhook first
      await request(app)
        .post('/api/webhooks/register')
        .send({
          url: 'https://example.com/webhook',
          events: ['badge_mint']
        })

      const response = await request(app)
        .get('/api/webhooks')
        .expect(200)

      expect(response.body.webhooks.length).toBe(1)
      expect(response.body.webhooks[0].url).toBe('https://example.com/webhook')
    })
  })

  describe('PUT /api/webhooks/:id', () => {
    it('should update webhook', async () => {
      const registerResponse = await request(app)
        .post('/api/webhooks/register')
        .send({
          url: 'https://example.com/webhook',
          events: ['badge_mint']
        })

      const webhookId = registerResponse.body.webhook.id

      const updateResponse = await request(app)
        .put(`/api/webhooks/${webhookId}`)
        .send({
          events: ['badge_mint', 'badge_verification']
        })
        .expect(200)

      expect(updateResponse.body.message).toBe('Webhook updated successfully')
    })
  })

  describe('DELETE /api/webhooks/:id', () => {
    it('should delete webhook', async () => {
      const registerResponse = await request(app)
        .post('/api/webhooks/register')
        .send({
          url: 'https://example.com/webhook',
          events: ['badge_mint']
        })

      const webhookId = registerResponse.body.webhook.id

      await request(app)
        .delete(`/api/webhooks/${webhookId}`)
        .expect(200)

      const getResponse = await request(app)
        .get('/api/webhooks')
        .expect(200)

      expect(getResponse.body.webhooks.length).toBe(0)
    })
  })

  describe('POST /api/webhooks/retry-failed', () => {
    it('should initiate retry process', async () => {
      const response = await request(app)
        .post('/api/webhooks/retry-failed')
        .expect(200)

      expect(response.body.message).toBe('Retry process initiated for failed webhooks')
    })
  })
})