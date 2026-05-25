'use client';

import { Notification, NotificationStatus } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationList({
  notifications,
  onMarkAsRead,
  onDelete,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500">
        <p className="text-sm">No notifications</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 hover:bg-gray-50 transition-colors ${
            notification.status === NotificationStatus.UNREAD
              ? 'bg-blue-50'
              : ''
          }`}
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm">
                {notification.title}
              </h4>
              <p className="text-gray-600 text-sm mt-1">
                {notification.message}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {notification.status === NotificationStatus.UNREAD && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
