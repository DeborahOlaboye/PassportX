'use client'

import { useState } from 'react'
import { useNotificationPreferences } from '@/contexts/NotificationPreferencesContext'

export function NotificationPreferencesPanel() {
  const {
    preferences,
    isLoading,
    error,
    toggleBadgeNotifications,
    toggleBadgeMintNotifications,
    toggleBadgeVerifyNotifications,
    toggleCommunityNotifications,
    toggleCommunityUpdateNotifications,
    toggleCommunityInviteNotifications,
    toggleSystemNotifications,
    toggleSystemAnnouncementNotifications,
    resetToDefaults
  } = useNotificationPreferences()

  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleBadgeToggle = async (enabled: boolean) => {
    try {
      setIsSaving(true)
      await toggleBadgeNotifications(enabled)
      showSuccess('Badge notifications updated')
    } catch (err) {
      console.error('Error toggling badge notifications:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBadgeMintToggle = async (enabled: boolean) => {
    try {
      setIsSaving(true)
      await toggleBadgeMintNotifications(enabled)
      showSuccess('Badge mint notifications updated')
    } catch (err) {
      console.error('Error toggling badge mint notifications:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBadgeVerifyToggle = async (enabled: boolean) => {
    try {
      setIsSaving(true)
      await toggleBadgeVerifyNotifications(enabled)
      showSuccess('Badge verification notifications updated')
    } catch (err) {
      console.error('Error toggling badge verification notifications:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCommunityToggle = async (enabled: boolean) => {
    try {
      setIsSaving(true)
      await toggleCommunityNotifications(enabled)
      showSuccess('Community notifications updated')
    } catch (err) {
      console.error('Error toggling community notifications:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCommunityUpdateToggle = async (enabled: boolean) => {
    try {
      setIsSaving(true)
      await toggleCommunityUpdateNotifications(enabled)
      showSuccess('Community update notifications updated')
    } catch (err) {
      console.error('Error toggling community update notifications:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCommunityInviteToggle = async (enabled: boolean) => {
    try {
      setIsSaving(true)
      await toggleCommunityInviteNotifications(enabled)
      showSuccess('Community invite notifications updated')
    } catch (err) {
      console.error('Error toggling community invite notifications:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSystemToggle = async (enabled: boolean) => {
    try {
      setIsSaving(true)
      await toggleSystemNotifications(enabled)
      showSuccess('System notifications updated')
    } catch (err) {
      console.error('Error toggling system notifications:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSystemAnnouncementToggle = async (enabled: boolean) => {
    try {
      setIsSaving(true)
      await toggleSystemAnnouncementNotifications(enabled)
      showSuccess('System announcement notifications updated')
    } catch (err) {
      console.error('Error toggling system announcement notifications:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset notification preferences to defaults?')) {
      try {
        setIsSaving(true)
        await resetToDefaults()
        showSuccess('Notification preferences reset to defaults')
      } catch (err) {
        console.error('Error resetting preferences:', err)
      } finally {
        setIsSaving(false)
      }
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading notification preferences...</div>
  }

  if (!preferences) {
    return <div className="p-4">No notification preferences found. Please try again.</div>
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <div className="space-y-8">
        <section className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Badge Notifications</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable all badge notifications</label>
              <button
                onClick={() => handleBadgeToggle(!preferences.badges.enabled)}
                disabled={isSaving}
                className={`px-3 py-1 rounded ${
                  preferences.badges.enabled
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-700'
                } disabled:opacity-50`}
              >
                {preferences.badges.enabled ? 'On' : 'Off'}
              </button>
            </div>

            {preferences.badges.enabled && (
              <>
                <div className="flex items-center justify-between pl-4">
                  <label className="text-sm">Badge received notifications</label>
                  <button
                    onClick={() => handleBadgeMintToggle(!preferences.badges.mint)}
                    disabled={isSaving}
                    className={`px-3 py-1 rounded text-sm ${
                      preferences.badges.mint
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    } disabled:opacity-50`}
                  >
                    {preferences.badges.mint ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="flex items-center justify-between pl-4">
                  <label className="text-sm">Badge verification notifications</label>
                  <button
                    onClick={() => handleBadgeVerifyToggle(!preferences.badges.verify)}
                    disabled={isSaving}
                    className={`px-3 py-1 rounded text-sm ${
                      preferences.badges.verify
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    } disabled:opacity-50`}
                  >
                    {preferences.badges.verify ? 'On' : 'Off'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Community Notifications</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable all community notifications</label>
              <button
                onClick={() => handleCommunityToggle(!preferences.community.enabled)}
                disabled={isSaving}
                className={`px-3 py-1 rounded ${
                  preferences.community.enabled
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-700'
                } disabled:opacity-50`}
              >
                {preferences.community.enabled ? 'On' : 'Off'}
              </button>
            </div>

            {preferences.community.enabled && (
              <>
                <div className="flex items-center justify-between pl-4">
                  <label className="text-sm">Community update notifications</label>
                  <button
                    onClick={() => handleCommunityUpdateToggle(!preferences.community.updates)}
                    disabled={isSaving}
                    className={`px-3 py-1 rounded text-sm ${
                      preferences.community.updates
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    } disabled:opacity-50`}
                  >
                    {preferences.community.updates ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="flex items-center justify-between pl-4">
                  <label className="text-sm">Community invite notifications</label>
                  <button
                    onClick={() => handleCommunityInviteToggle(!preferences.community.invites)}
                    disabled={isSaving}
                    className={`px-3 py-1 rounded text-sm ${
                      preferences.community.invites
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    } disabled:opacity-50`}
                  >
                    {preferences.community.invites ? 'On' : 'Off'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="pb-6">
          <h3 className="text-lg font-semibold mb-4">System Notifications</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable all system notifications</label>
              <button
                onClick={() => handleSystemToggle(!preferences.system.enabled)}
                disabled={isSaving}
                className={`px-3 py-1 rounded ${
                  preferences.system.enabled
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-700'
                } disabled:opacity-50`}
              >
                {preferences.system.enabled ? 'On' : 'Off'}
              </button>
            </div>

            {preferences.system.enabled && (
              <div className="flex items-center justify-between pl-4">
                <label className="text-sm">System announcement notifications</label>
                <button
                  onClick={() => handleSystemAnnouncementToggle(!preferences.system.announcements)}
                  disabled={isSaving}
                  className={`px-3 py-1 rounded text-sm ${
                    preferences.system.announcements
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-700'
                  } disabled:opacity-50`}
                >
                  {preferences.system.announcements ? 'On' : 'Off'}
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="flex gap-4">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}
