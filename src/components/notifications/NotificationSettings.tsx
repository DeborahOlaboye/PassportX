'use client';

import {
  NotificationType,
  NotificationChannel,
  NotificationPreference,
} from '@/types/notification';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Mail, Bell, Smartphone } from 'lucide-react';

export default function NotificationSettings() {
  const { preferences, loading, updatePreference } =
    useNotificationPreferences('user-id');

  const handleToggle = (
    type: NotificationType,
    channel: NotificationChannel
  ) => {
    const pref = preferences.find(
      (p: NotificationPreference) => p.type === type
    );
    if (pref) {
      const newChannels = pref.channels.includes(channel)
        ? pref.channels.filter((c: NotificationChannel) => c !== channel)
        : [...pref.channels, channel];
      updatePreference(type, newChannels, newChannels.length > 0);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notification Settings</h2>
      {Object.values(NotificationType).map((type) => {
        const pref = preferences.find(
          (p: NotificationPreference) => p.type === type
        );
        return (
          <div key={type} className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 capitalize">
              {type.replace(/_/g, ' ')}
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pref?.channels.includes(NotificationChannel.IN_APP)}
                  onChange={() =>
                    handleToggle(type, NotificationChannel.IN_APP)
                  }
                  className="w-4 h-4"
                />
                <Bell className="w-4 h-4" />
                <span>In-app</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pref?.channels.includes(NotificationChannel.EMAIL)}
                  onChange={() => handleToggle(type, NotificationChannel.EMAIL)}
                  className="w-4 h-4"
                />
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pref?.channels.includes(
                    NotificationChannel.WEBSOCKET
                  )}
                  onChange={() =>
                    handleToggle(type, NotificationChannel.WEBSOCKET)
                  }
                  className="w-4 h-4"
                />
                <Smartphone className="w-4 h-4" />
                <span>Push</span>
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
