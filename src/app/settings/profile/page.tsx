'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload'
import { useTheme } from '@/contexts/ThemeContext'
import { validateProfileData, sanitizeCustomUrl } from '@/utils/profileValidation'
import { User, Link, Palette, Globe, Save, AlertCircle, CheckCircle } from 'lucide-react'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { theme, accentColor, updateThemePreferences } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [customUrlAvailable, setCustomUrlAvailable] = useState<boolean | null>(null)
  const [checkingUrl, setCheckingUrl] = useState(false)

  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    avatar: '',
    customUrl: '',
    socialLinks: {
      twitter: '',
      github: '',
      linkedin: '',
      discord: '',
      website: ''
    },
    themePreferences: {
      mode: theme as 'light' | 'dark' | 'system',
      accentColor: accentColor
    },
    isPublic: true
  })

  // Load existing profile data
  useEffect(() => {
    fetchProfile()
  }, [])

  // Check custom URL availability
  useEffect(() => {
    if (!profileData.customUrl || profileData.customUrl.length < 3) {
      setCustomUrlAvailable(null)
      return
    }

    const timer = setTimeout(() => {
      checkCustomUrl(profileData.customUrl)
    }, 500)

    return () => clearTimeout(timer)
  }, [profileData.customUrl])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData(prev => ({
          ...prev,
          ...data,
          socialLinks: data.socialLinks || prev.socialLinks,
          themePreferences: data.themePreferences || prev.themePreferences
        }))
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const checkCustomUrl = async (url: string) => {
    try {
      setCheckingUrl(true)
      const response = await fetch(`/api/users/profile/check-url/${url}`)
      const data = await response.json()
      setCustomUrlAvailable(data.available)
    } catch (error) {
      console.error('Error checking URL:', error)
    } finally {
      setCheckingUrl(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validate
    const validation = validateProfileData(profileData)
    if (!validation.isValid) {
      setError(validation.error || 'Validation failed')
      return
    }

    if (profileData.customUrl && customUrlAvailable === false) {
      setError('Custom URL is not available')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Update theme context
        if (profileData.themePreferences) {
          updateThemePreferences(profileData.themePreferences)
        }
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setError('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Customize your PassportX profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Picture
            </h2>
            <ProfilePictureUpload
              currentAvatar={profileData.avatar}
              onUpload={(avatar) => setProfileData(prev => ({ ...prev, avatar }))}
            />
          </section>

          {/* Basic Information */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your display name"
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <p className="mt-1 text-sm text-gray-500">{profileData.bio.length}/500 characters</p>
              </div>

              <div>
                <label htmlFor="customUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="customUrl"
                    value={profileData.customUrl}
                    onChange={(e) => setProfileData(prev => ({ ...prev, customUrl: sanitizeCustomUrl(e.target.value) }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your-custom-url"
                    minLength={3}
                    maxLength={30}
                  />
                </div>
                {profileData.customUrl && (
                  <p className={`mt-1 text-sm ${customUrlAvailable ? 'text-green-600' : customUrlAvailable === false ? 'text-red-600' : 'text-gray-500'}`}>
                    {checkingUrl ? 'Checking...' : customUrlAvailable ? '✓ URL is available' : customUrlAvailable === false ? '✗ URL is already taken' : ''}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  passportx.app/u/{profileData.customUrl || 'your-url'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={profileData.isPublic}
                  onChange={(e) => setProfileData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make my profile public
                </label>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Link className="w-5 h-5" />
              Social Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(profileData.socialLinks).map((platform) => (
                <div key={platform}>
                  <label htmlFor={platform} className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {platform}
                  </label>
                  <input
                    type="text"
                    id={platform}
                    value={profileData.socialLinks[platform as keyof typeof profileData.socialLinks]}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, [platform]: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Your ${platform} ${platform === 'website' ? 'URL' : 'username'}`}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Theme Preferences */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Theme Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color Mode</label>
                <div className="flex gap-4">
                  {(['light', 'dark', 'system'] as const).map((mode) => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="themeMode"
                        value={mode}
                        checked={profileData.themePreferences.mode === mode}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          themePreferences: { ...prev.themePreferences, mode: e.target.value as any }
                        }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 mb-1">
                  Accent Color
                </label>
                <input
                  type="color"
                  id="accentColor"
                  value={profileData.themePreferences.accentColor}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    themePreferences: { ...prev.themePreferences, accentColor: e.target.value }
                  }))}
                  className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
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
              <p className="text-sm text-green-700">Profile updated successfully!</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || (profileData.customUrl.length >= 3 && customUrlAvailable === false)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
