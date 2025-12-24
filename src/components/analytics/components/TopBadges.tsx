'use client';

interface BadgeItem {
  badgeId: string;
  name: string;
  count: number;
  category?: string;
}

export function TopBadges({ badges }: { badges: BadgeItem[] }) {
  if (!badges || badges.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        No badge data available
      </div>
    );
  }

  const maxCount = Math.max(...badges.map(b => b.count), 1);

  return (
    <div className="space-y-3">
      {badges.slice(0, 5).map((badge, idx) => (
        <div key={badge.badgeId} className="space-y-1">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-sm">{idx + 1}. {badge.name}</span>
              {badge.category && (
                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                  {badge.category}
                </span>
              )}
            </div>
            <span className="font-bold text-indigo-600">{badge.count}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all"
              style={{
                width: `${(badge.count / maxCount) * 100}%`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
