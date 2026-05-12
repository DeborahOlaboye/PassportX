import { useState, useEffect, useCallback } from 'react';
import { NotificationType, NotificationChannel, NotificationPreference } from '@/types/notification';

export function useNotificationPreferences(_userId: string) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (
    type: NotificationType,
    channels: NotificationChannel[],
    enabled: boolean
  ) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, channels, enabled }),
      });
      if (!response.ok) throw new Error('Failed to update preference');
      await fetchPreferences();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return {
    preferences,
    loading,
    error,
    updatePreference,
    refetch: fetchPreferences,
  };
}
