'use client';

interface NotificationFilterProps {
  filter: 'all' | 'unread';
  onFilterChange: (filter: 'all' | 'unread') => void;
  allCount: number;
  unreadCount: number;
}

export default function NotificationFilter({
  filter,
  onFilterChange,
  allCount,
  unreadCount,
}: NotificationFilterProps) {
  return (
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => onFilterChange('all')}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          filter === 'all'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        All ({allCount})
      </button>
      <button
        onClick={() => onFilterChange('unread')}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          filter === 'unread'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Unread ({unreadCount})
      </button>
    </div>
  );
}
