'use client';

interface EngagementData {
  totalInteractions: number;
  avgInteractionPerUser: number;
  peakTime: string;
}

export function EngagementMetrics({ metrics }: { metrics: EngagementData }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-gray-600">Total Interactions</p>
        <p className="text-3xl font-bold text-blue-600 mt-1">
          {metrics.totalInteractions.toLocaleString()}
        </p>
      </div>

      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <p className="text-sm text-gray-600">Avg Interaction per User</p>
        <p className="text-3xl font-bold text-green-600 mt-1">
          {metrics.avgInteractionPerUser}
        </p>
      </div>

      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <p className="text-sm text-gray-600">Peak Activity Time</p>
        <p className="text-3xl font-bold text-purple-600 mt-1">
          {metrics.peakTime}
        </p>
      </div>
    </div>
  );
}
