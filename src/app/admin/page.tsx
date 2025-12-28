'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import CommunityCard from '@/components/CommunityCard'
import { Plus, BarChart3, Users, Award, Loader, Gift } from 'lucide-react'
import Link from 'next/link'

interface BadgeStats {
  totalIssued: number
  recentBadges: any[]
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [communities, setCommunities] = useState<any[]>([])
  const [badgeStats, setBadgeStats] = useState<BadgeStats>({ totalIssued: 0, recentBadges: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.stacksAddress) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const [communitiesRes, badgesRes] = await Promise.all([
          fetch(`/api/communities?admin=${encodeURIComponent(user.stacksAddress)}`),
          fetch(`/api/badges/issued-by/${user.stacksAddress}`)
        ])

        if (communitiesRes.ok) {
          const data = await communitiesRes.json()
          setCommunities(data.data || [])
        } else {
          console.error('Failed to fetch communities')
          setCommunities([])
        }

        if (badgesRes.ok) {
          const badgeData = await badgesRes.json()
          setBadgeStats({
            totalIssued: badgeData.count || 0,
            recentBadges: badgeData.badges?.slice(0, 5) || []
          })
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load admin data')
        setCommunities([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
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
        
        <div className="flex gap-3">
          <Link href="/admin/issue-badge" className="btn-secondary flex items-center space-x-2">
            <Gift className="w-4 h-4" />
            <span>Issue Badge</span>
          </Link>
          <Link href="/admin/create-community" className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Community</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        <div className="card text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{badgeStats.totalIssued}</h3>
          <p className="text-gray-600">Badges Issued</p>
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

      {badgeStats.recentBadges.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Badge Issuance</h2>
            <Link href="/admin/issue-badge" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Issue More →
            </Link>
          </div>
          
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Recipient</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Template</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Level</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Community</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {badgeStats.recentBadges.map((badge: any) => (
                    <tr key={badge.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{badge.recipient?.slice(0, 10)}...</td>
                      <td className="py-3 px-4">{badge.template}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          Level {badge.level}
                        </span>
                      </td>
                      <td className="py-3 px-4">{badge.community}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(badge.issuedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}