'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import CommunityCard from '@/components/CommunityCard'
import { Plus, BarChart3, Users, Award, Loader } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [communities, setCommunities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user?.stacksAddress) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch(
          `/api/communities?admin=${encodeURIComponent(user.stacksAddress)}`
        )

        if (response.ok) {
          const data = await response.json()
          setCommunities(data.data || [])
        } else {
          console.error('Failed to fetch communities')
          setCommunities([])
        }
      } catch (err) {
        console.error('Error fetching communities:', err)
        setError('Failed to load communities')
        setCommunities([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommunities()
  }, [user?.stacksAddress])
  
  const totalMembers = communities.reduce((sum, community) => sum + community.memberCount, 0)
  const totalBadges = communities.reduce((sum, community) => sum + community.badgeCount, 0)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mr-3" />
          <p className="text-gray-600">Loading your communities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your communities and badge programs</p>
        </div>
        
        <Link href="/admin/create-community" className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Community</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{communities.length}</h3>
          <p className="text-gray-600">Communities</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalMembers.toLocaleString()}</h3>
          <p className="text-gray-600">Total Members</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalBadges}</h3>
          <p className="text-gray-600">Badge Templates</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Communities</h2>
          <Link href="/admin/analytics" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
            <BarChart3 className="w-4 h-4" />
            <span>View Analytics</span>
          </Link>
        </div>
        
        {communities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No communities yet</h3>
            <p className="text-gray-600 mb-4">Create your first community to start issuing badges</p>
            <Link href="/admin/create-community" className="btn-primary">
              Create Community
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map(community => (
              <CommunityCard key={community._id || community.id} community={community} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}