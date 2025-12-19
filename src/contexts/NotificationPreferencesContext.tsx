'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { UserNotificationPreferences } from '@/chainhook/types/handlers'

interface NotificationPreferencesContextType {
  preferences: UserNotificationPreferences | null
  isLoading: boolean
  error: string | null
  updatePreferences: (updates: Partial<UserNotificationPreferences>) => Promise<void>
  toggleBadgeNotifications: (enabled: boolean) => Promise<void>
  toggleBadgeMintNotifications: (enabled: boolean) => Promise<void>
  toggleBadgeVerifyNotifications: (enabled: boolean) => Promise<void>
  toggleCommunityNotifications: (enabled: boolean) => Promise<void>
  toggleCommunityUpdateNotifications: (enabled: boolean) => Promise<void>
  toggleCommunityInviteNotifications: (enabled: boolean) => Promise<void>
  toggleSystemNotifications: (enabled: boolean) => Promise<void>
  toggleSystemAnnouncementNotifications: (enabled: boolean) => Promise<void>
  resetToDefaults: () => Promise<void>
}

const NotificationPreferencesContext = createContext<NotificationPreferencesContextType | undefined>(undefined)

export function NotificationPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/notification-preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences || null)
      } else if (response.status === 404) {
        setPreferences(null)
      } else {
        setError('Failed to fetch notification preferences')
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err)
      setError('Failed to fetch notification preferences')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updatePreferences = useCallback(async (updates: Partial<UserNotificationPreferences>) => {
    try {
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      } else {
        setError('Failed to update notification preferences')
      }
    } catch (err) {
      console.error('Error updating notification preferences:', err)
      setError('Failed to update notification preferences')
    }
  }, [])

  const toggleBadgeNotifications = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      badges: {
        ...preferences?.badges,
        enabled
      }
    } as Partial<UserNotificationPreferences>)
  }, [preferences, updatePreferences])

  const toggleBadgeMintNotifications = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      badges: {
        ...preferences?.badges,
        mint: enabled
      }
    } as Partial<UserNotificationPreferences>)
  }, [preferences, updatePreferences])

  const toggleBadgeVerifyNotifications = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      badges: {
        ...preferences?.badges,
        verify: enabled
      }
    } as Partial<UserNotificationPreferences>)
  }, [preferences, updatePreferences])

  const toggleCommunityNotifications = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      community: {
        ...preferences?.community,
        enabled
      }
    } as Partial<UserNotificationPreferences>)
  }, [preferences, updatePreferences])

  const toggleCommunityUpdateNotifications = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      community: {
        ...preferences?.community,
        updates: enabled
      }
    } as Partial<UserNotificationPreferences>)
  }, [preferences, updatePreferences])

  const toggleCommunityInviteNotifications = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      community: {
        ...preferences?.community,
        invites: enabled
      }
    } as Partial<UserNotificationPreferences>)
  }, [preferences, updatePreferences])

  const toggleSystemNotifications = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      system: {
        ...preferences?.system,
        enabled
      }
    } as Partial<UserNotificationPreferences>)
  }, [preferences, updatePreferences])

  const toggleSystemAnnouncementNotifications = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      system: {
        ...preferences?.system,
        announcements: enabled
      }
    } as Partial<UserNotificationPreferences>)
  }, [preferences, updatePreferences])

  const resetToDefaults = useCallback(async () => {
    try {
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/notification-preferences/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchPreferences()
      } else {
        setError('Failed to reset notification preferences')
      }
    } catch (err) {
      console.error('Error resetting notification preferences:', err)
      setError('Failed to reset notification preferences')
    }
  }, [fetchPreferences])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  return (
    <NotificationPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        error,
        updatePreferences,
        toggleBadgeNotifications,
        toggleBadgeMintNotifications,
        toggleBadgeVerifyNotifications,
        toggleCommunityNotifications,
        toggleCommunityUpdateNotifications,
        toggleCommunityInviteNotifications,
        toggleSystemNotifications,
        toggleSystemAnnouncementNotifications,
        resetToDefaults
      }}
    >
      {children}
    </NotificationPreferencesContext.Provider>
  )
}

export function useNotificationPreferences() {
  const context = useContext(NotificationPreferencesContext)
  if (context === undefined) {
    throw new Error('useNotificationPreferences must be used within a NotificationPreferencesProvider')
  }
  return context
}
