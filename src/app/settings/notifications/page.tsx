'use client'

import { useState, useEffect } from 'react'
import { Save, Bell, Award, Users, Megaphone, Mail, Smartphone, CheckCircle, AlertCircle } from 'lucide-react'

interface NotificationPreferences {
  badgeReceived: boolean
  communityUpdates: boolean
  systemAnnouncements: boolean
  badgeIssued: boolean
  communityInvite: boolean
  badgeVerified: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

export default function NotificationPreferencesPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    badgeReceived: true,
    communityUpdates: true,
    systemAnnouncements: true,
    badgeIssued: true,
    communityInvite: true,
    badgeVerified: true,
    emailNotifications: false,
    pushNotifications: true
  })

  // Load existing preferences
  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.notificationPreferences) {
          setPreferences(data.notificationPreferences)
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      setLoading(true)

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          notificationPreferences: preferences
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Failed to update preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      setError('Failed to save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const notificationTypes = [
    {
      key: 'badgeReceived' as keyof NotificationPreferences,
      label: 'Badge Received',
      description: 'When you receive a new badge',
      icon: <Award className="w-5 h-5 text-blue-600" />
    },
    {
      key: 'badgeIssued' as keyof NotificationPreferences,
      label: 'Badge Issued',
      description: 'When you issue a badge to someone else',
      icon: <Award className="w-5 h-5 text-green-600" />
    },
    {
      key: 'badgeVerified' as keyof NotificationPreferences,
      label: 'Badge Verified',
      description: 'When a badge is verified on the blockchain',
      icon: <Award className="w-5 h-5 text-purple-600" />
    },
    {
      key: 'communityUpdates' as keyof NotificationPreferences,
      label: 'Community Updates',
      description: 'Updates from communities you belong to',
      icon: <Users className="w-5 h-5 text-indigo-600" />
    },
    {
      key: 'communityInvite' as keyof NotificationPreferences,
      label: 'Community Invites',
      description: 'When you are invited to join a community',
      icon: <Users className="w-5 h-5 text-pink-600" />
    },
    {
      key: 'systemAnnouncements' as keyof NotificationPreferences,
      label: 'System Announcements',
      description: 'Important announcements from PassportX',
      icon: <Megaphone className="w-5 h-5 text-orange-600" />
    }
  ]

  const deliveryMethods = [
    {
      key: 'pushNotifications' as keyof NotificationPreferences,
      label: 'Push Notifications',
      description: 'Receive notifications in your browser',
      icon: <Smartphone className="w-5 h-5 text-blue-600" />
    },
    {
      key: 'emailNotifications' as keyof NotificationPreferences,
      label: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: <Mail className="w-5 h-5 text-red-600" />
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-600 mt-2">
            Manage how you receive notifications from PassportX
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notification Types */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Types
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose which types of notifications you want to receive
            </p>

            <div className="space-y-4">
              {notificationTypes.map((type) => (
                <div
                  key={type.key}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor={type.key}
                        className="block text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {type.label}
                      </label>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {type.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id={type.key}
                        checked={preferences[type.key]}
                        onChange={(e) => setPreferences(prev => ({ ...prev, [type.key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Methods */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Methods</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose how you want to receive notifications
            </p>

            <div className="space-y-4">
              {deliveryMethods.map((method) => (
                <div
                  key={method.key}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor={method.key}
                        className="block text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {method.label}
                      </label>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {method.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id={method.key}
                        checked={preferences[method.key]}
                        onChange={(e) => setPreferences(prev => ({ ...prev, [method.key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">Preferences saved successfully!</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
