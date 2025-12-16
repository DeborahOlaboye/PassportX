'use client'

import { use, useEffect, useState } from 'react'
import { User, Mail, Globe, Github, Twitter, Linkedin, MessageCircle, Calendar, Shield } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface UserProfile {
  id: string
  stacksAddress: string
  name?: string
  bio?: string
  avatar?: string
  customUrl?: string
  socialLinks?: {
    twitter?: string
    github?: string
    linkedin?: string
    discord?: string
    website?: string
  }
  themePreferences?: {
    mode: 'light' | 'dark' | 'system'
    accentColor?: string
  }
  isPublic: boolean
  joinDate: string
}

export default function PublicProfilePage({ params }: { params: Promise<{ customUrl: string }> }) {
  const resolvedParams = use(params)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [resolvedParams.customUrl])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/profile?customUrl=${resolvedParams.customUrl}`)
      const data = await response.json()

      if (response.ok) {
        setProfile(data)
      } else {
        setError(data.error || 'Profile not found')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This profile does not exist or is private.'}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name || 'Profile'}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-gray-400" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.name || 'Anonymous User'}
              </h1>
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(profile.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Connect</h2>
              <div className="flex flex-wrap gap-3">
                {profile.socialLinks.twitter && (
                  <a
                    href={`https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    <span className="text-sm">Twitter</span>
                  </a>
                )}
                {profile.socialLinks.github && (
                  <a
                    href={`https://github.com/${profile.socialLinks.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span className="text-sm">GitHub</span>
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                )}
                {profile.socialLinks.discord && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{profile.socialLinks.discord}</span>
                  </div>
                )}
                {profile.socialLinks.website && (
                  <a
                    href={profile.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">Website</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Badges Section - Placeholder */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Badges</h2>
          <p className="text-gray-500 text-center py-8">
            Badge collection will be displayed here
          </p>
        </div>
      </div>
    </div>
  )
}
