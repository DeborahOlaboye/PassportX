'use client';

import { Bell, CheckCheck, RefreshCw } from 'lucide-react';

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function NotificationHeader({
  unreadCount,
  onMarkAllAsRead,
  onRefresh,
  isRefreshing = false,
}: NotificationHeaderProps) {
  return (
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
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 text-gray-600 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
        </button>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
}
