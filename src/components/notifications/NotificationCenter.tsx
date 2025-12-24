'use client'

import { useNotifications } from '@/contexts/NotificationContext'
import { Bell, Check, CheckCheck, Trash2, X, RefreshCw, Wifi, WifiOff, Gift, Users, Megaphone, Award } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchNotifications()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'badge_received':
      case 'badge_issued':
      case 'badge_verified':
        return <Award className="w-5 h-5 text-blue-600" />
      case 'community_update':
      case 'community_invite':
        return <Users className="w-5 h-5 text-purple-600" />
      case 'system_announcement':
        return <Megaphone className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className="flex items-center gap-1">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-600" title="Connected" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-400" title="Disconnected" />
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Bell className="w-12 h-12 mb-2 text-gray-300" />
            <p className="text-sm">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
