import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType, NotificationChannel } from '../../src/types/notification';

export interface INotificationPreference extends Document {
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  enabled: boolean;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    channels: [{ type: String, enum: Object.values(NotificationChannel), required: true }],
    enabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

NotificationPreferenceSchema.index({ userId: 1, type: 1 }, { unique: true });

export const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  NotificationPreferenceSchema
);
