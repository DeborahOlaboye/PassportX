import mongoose, { Schema, Document } from 'mongoose'

export interface IWebhook extends Document {
  url: string
  secret: string
  events: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastDeliveredAt?: Date
  failureCount: number
}

const WebhookSchema: Schema = new Schema({
  url: { type: String, required: true },
  secret: { type: String, required: true },
  events: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastDeliveredAt: { type: Date },
  failureCount: { type: Number, default: 0 }
})

WebhookSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model<IWebhook>('Webhook', WebhookSchema)