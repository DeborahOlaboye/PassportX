import mongoose, { Schema, Document } from 'mongoose';
import {
  NotificationType,
  NotificationStatus,
  NotificationChannel,
} from '../../src/types/notification';

export interface INotification extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  channels: NotificationChannel[];
  metadata?: Record<string, unknown>;
  readAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.UNREAD,
    },
    channels: [
      {
        type: String,
        enum: Object.values(NotificationChannel),
        required: true,
      },
    ],
    metadata: { type: Schema.Types.Mixed },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, status: 1 });

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
