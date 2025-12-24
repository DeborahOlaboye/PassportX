'use client';

interface BadgeDistributionItem {
  name: string;
  value: number;
  category: string;
}

export function BadgeDistributionChart({ data }: { data: BadgeDistributionItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 8);

  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316'
  ];

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-3">
        {sortedData.map((item, idx) => {
          const percentage = Math.round((item.value / total) * 100);
          const color = colors[idx % colors.length];

          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-600">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">{percentage}% of total</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
