import React, { useState, useEffect, useCallback } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronDown, Trash2, Check } from 'lucide-react'
import { useActivityFeed } from '@/hooks/useActivityFeed'

export interface ActivityItem {
  _id: string
  userId: string
  eventType: 'badge_received' | 'badge_revoked' | 'community_joined' | 'community_created' | 'badge_metadata_updated' | 'passport_created'
  title: string
  description: string
  icon?: string
  metadata: {
    badgeId?: string
    badgeName?: string
    communityId?: string
    communityName?: string
    level?: number
    category?: string
    revocationType?: 'soft' | 'hard'
    blockHeight?: number
    transactionHash?: string
    contractAddress?: string
  }
  isRead: boolean
  createdAt: string
  updatedAt: string
}

interface ActivityFeedProps {
  userId: string
  initialPageSize?: number
}

const eventTypeColors: Record<string, string> = {
  badge_received: 'bg-green-100 text-green-800',
  badge_revoked: 'bg-red-100 text-red-800',
  community_joined: 'bg-blue-100 text-blue-800',
  community_created: 'bg-purple-100 text-purple-800',
  badge_metadata_updated: 'bg-yellow-100 text-yellow-800',
  passport_created: 'bg-indigo-100 text-indigo-800'
}

const eventTypeLabels: Record<string, string> = {
  badge_received: 'Badge Received',
  badge_revoked: 'Badge Revoked',
  community_joined: 'Community Joined',
  community_created: 'Community Created',
  badge_metadata_updated: 'Badge Updated',
  passport_created: 'Passport Created'
}

export function ActivityFeed({ userId, initialPageSize = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { socket, isConnected } = useActivityFeed(userId)

  const fetchActivities = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        userId,
        page: pageNum.toString(),
        limit: initialPageSize.toString()
      })

      const response = await fetch(`/api/activity/feed?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch activities')
      }

      if (pageNum === 1) {
        setActivities(result.data.activities)
      } else {
        setActivities(prev => [...prev, ...result.data.activities])
      }

      setHasMore(result.data.pagination.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [userId, initialPageSize])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const params = new URLSearchParams({ userId })
      const response = await fetch(`/api/activity/unread-count?${params}`)

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUnreadCount(result.data.unreadCount)
        }
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }, [userId])

  useEffect(() => {
    fetchActivities(1)
    fetchUnreadCount()
  }, [userId, fetchActivities, fetchUnreadCount])

  useEffect(() => {
    if (socket) {
      socket.on('activity:new', (data: any) => {
        const newActivity = data.activity
        setActivities(prev => [newActivity, ...prev])
        setUnreadCount(prev => prev + 1)
      })

      socket.on('activity:marked-read', (data: any) => {
        setActivities(prev =>
          prev.map(activity =>
            activity._id === data.activityId
              ? { ...activity, isRead: true }
              : activity
          )
        )
      })

      socket.on('activity:marked-read-all', () => {
        setActivities(prev => prev.map(activity => ({ ...activity, isRead: true })))
        setUnreadCount(0)
      })

      socket.on('activity:deleted', (data: any) => {
        setActivities(prev => prev.filter(activity => activity._id !== data.activityId))
      })

      return () => {
        socket.off('activity:new')
        socket.off('activity:marked-read')
        socket.off('activity:marked-read-all')
        socket.off('activity:deleted')
      }
    }
  }, [socket])

  const handleMarkAsRead = async (activityId: string) => {
    try {
      const response = await fetch('/api/activity/mark-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId })
      })

      if (response.ok) {
        setActivities(prev =>
          prev.map(activity =>
            activity._id === activityId
              ? { ...activity, isRead: true }
              : activity
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error marking activity as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/activity/mark-all-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setActivities(prev => prev.map(activity => ({ ...activity, isRead: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Error marking all activities as read:', err)
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/activity/${activityId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setActivities(prev => prev.filter(activity => activity._id !== activityId))
      }
    } catch (err) {
      console.error('Error deleting activity:', err)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchActivities(nextPage)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                Your recent actions and achievements {unreadCount > 0 && `(${unreadCount} unread)`}
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
              {error}
            </div>
          )}

          {activities.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <p>No activities yet</p>
            </div>
          )}

          <div className="space-y-3">
            {activities.map(activity => (
              <div
                key={activity._id}
                className={`p-4 border rounded-lg transition-colors ${
                  !activity.isRead
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{activity.icon}</span>
                      <Badge variant="secondary" className={eventTypeColors[activity.eventType]}>
                        {eventTypeLabels[activity.eventType]}
                      </Badge>
                      {!activity.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!activity.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(activity._id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteActivity(activity._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {activity.metadata.badgeId && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                    Badge ID: <code className="bg-gray-100 px-1 rounded">{activity.metadata.badgeId.substring(0, 8)}...</code>
                  </div>
                )}

                {activity.metadata.communityId && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                    Community ID: <code className="bg-gray-100 px-1 rounded">{activity.metadata.communityId.substring(0, 8)}...</code>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={isLoading}
                variant="outline"
                className="gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Load More
              </Button>
            </div>
          )}

          {isLoading && activities.length === 0 && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          )}

          {!isConnected && (
            <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md text-xs">
              Offline - Activity feed may not update in real-time
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
