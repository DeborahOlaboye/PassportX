'use client';

import { ActivityData } from '@/lib/api/analytics';
import { formatDistanceToNow } from 'date-fns';

const activityIcons: Record<string, string> = {
  badge_issued: '🏆',
  user_joined: '👤',
  community_created: '👥',
  badge_revoked: '❌'
};

export function RecentActivity({ activities }: { activities: ActivityData[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="text-xl flex-shrink-0">
            {activityIcons[activity.type] || '📌'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 line-clamp-2">
              {activity.message}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
