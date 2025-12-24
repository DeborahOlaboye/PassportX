'use client';

interface GrowthData {
  weeklyGrowth: number;
  monthlyGrowth: number;
  retentionRate: number;
}

export function GrowthMetrics({ metrics }: { metrics: GrowthData }) {
  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return '📈';
    if (value < 0) return '📉';
    return '➡️';
  };

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <p className="text-sm text-gray-600">Weekly Growth</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-3xl font-bold ${getGrowthColor(metrics.weeklyGrowth)}`}>
            {Math.abs(metrics.weeklyGrowth)}%
          </span>
          <span className="text-2xl">{getGrowthIcon(metrics.weeklyGrowth)}</span>
        </div>
      </div>

      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <p className="text-sm text-gray-600">Monthly Growth</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-3xl font-bold ${getGrowthColor(metrics.monthlyGrowth)}`}>
            {Math.abs(metrics.monthlyGrowth)}%
          </span>
          <span className="text-2xl">{getGrowthIcon(metrics.monthlyGrowth)}</span>
        </div>
      </div>

      <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
        <p className="text-sm text-gray-600">User Retention Rate</p>
        <p className="text-3xl font-bold text-teal-600 mt-1">
          {metrics.retentionRate}%
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div
            className="h-2 rounded-full bg-teal-500 transition-all"
            style={{
              width: `${metrics.retentionRate}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}
