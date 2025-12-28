import request from 'supertest'
import express from 'express'
import authRoutes from '../routes/auth'
import { errorHandler } from '../middleware/errorHandler'

const app = express()
app.use(express.json())
app.use('/auth', authRoutes)
app.use(errorHandler)

describe('Auth Routes', () => {
  describe('POST /auth/message', () => {
    it('should generate auth message for valid address', async () => {
      const response = await request(app)
        .post('/auth/message')
        .send({ stacksAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' })

      expect(response.status).toBe(200)
      expect(response.body.message).toContain('Sign this message')
      expect(response.body.message).toContain('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')
    })

    it('should return error for missing address', async () => {
      const response = await request(app)
        .post('/auth/message')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('required')
    })
  })

  describe('POST /auth/login', () => {
    it('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ stacksAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Missing required fields')
    })
  })
})