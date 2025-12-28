'use client';

import { TimeSeriesData } from '@/lib/api/analytics';

export function TimeSeriesChart({ data }: { data: TimeSeriesData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const maxNewUsers = Math.max(...data.map(d => d.newUsers), 1);
  const maxActiveUsers = Math.max(...data.map(d => d.activeUsers), 1);

  return (
    <div className="w-full h-64 flex flex-col">
      <div className="flex-1 flex items-end gap-1 px-2 py-4">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            <div className="flex gap-1 w-full h-48">
              <div
                className="flex-1 bg-blue-400 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                style={{
                  height: `${(item.newUsers / Math.max(maxNewUsers, 1)) * 100}%`
                }}
                title={`New Users: ${item.newUsers}`}
              />
              <div
                className="flex-1 bg-green-400 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                style={{
                  height: `${(item.activeUsers / Math.max(maxActiveUsers, 1)) * 100}%`
                }}
                title={`Active Users: ${item.activeUsers}`}
              />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap mt-1">
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 text-sm pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-400 rounded" />
          <span>New Users</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded" />
          <span>Active Users</span>
        </div>
      </div>
    </div>
  );
}
