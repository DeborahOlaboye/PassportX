import { useEffect, useState } from 'react';
import {
  Card,
  Title,
  Text,
  AreaChart,
  BarChart,
  DonutChart,
} from '@tremor/react';

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

const timeRanges = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

type WalletConnectStats = {
  totalConnections: number;
  uniqueWallets: number;
  averageSessionDuration: number;
  completionRate: number;
  connectionsByDay: Array<{ date: string; count: number }>;
  walletsByType: Array<{ name: string; value: number }>;
  transactionsByMethod: Array<{ name: string; value: number }>;
};

const EMPTY_STATS: WalletConnectStats = {
  totalConnections: 0,
  uniqueWallets: 0,
  averageSessionDuration: 0,
  completionRate: 0,
  connectionsByDay: [],
  walletsByType: [],
  transactionsByMethod: [],
};

export function WalletConnectAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WalletConnectStats>(EMPTY_STATS);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/analytics/walletconnect?range=${timeRange}`
        );
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        const data = (await response.json()) as WalletConnectStats;
        setStats(data);
      } catch (err: unknown) {
        console.error('Error fetching WalletConnect analytics:', err);
        setError(
          'Failed to load WalletConnect analytics. Please try again later.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  if (isLoading) {
    return <div>Loading WalletConnect analytics...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title>WalletConnect Analytics</Title>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {timeRanges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Text>Total Connections</Text>
          <Title className="text-2xl font-bold">
            {stats.totalConnections.toLocaleString()}
          </Title>
        </Card>
        <Card>
          <Text>Unique Wallets</Text>
          <Title className="text-2xl font-bold">
            {stats.uniqueWallets.toLocaleString()}
          </Title>
        </Card>
        <Card>
          <Text>Avg. Session</Text>
          <Title className="text-2xl font-bold">
            {stats.averageSessionDuration.toFixed(1)} min
          </Title>
        </Card>
        <Card>
          <Text>Completion Rate</Text>
          <Title className="text-2xl font-bold">{stats.completionRate}%</Title>
        </Card>
      </div>

      <Card>
        <Title>Connections Over Time</Title>
        <AreaChart
          className="mt-4 h-80"
          data={stats.connectionsByDay}
          index="date"
          categories={['Connections']}
          colors={['indigo']}
          valueFormatter={(value) => value.toLocaleString()}
          yAxisWidth={60}
        />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Title>Wallet Types</Title>
          <DonutChart
            className="mt-6"
            data={stats.walletsByType}
            category="value"
            index="name"
            valueFormatter={(value) => `${value} wallets`}
            colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia']}
          />
        </Card>

        <Card>
          <Title>Transactions by Method</Title>
          <BarChart
            className="mt-6"
            data={stats.transactionsByMethod}
            index="name"
            categories={['Transactions']}
            colors={['blue']}
            valueFormatter={(value) => value.toLocaleString()}
            yAxisWidth={48}
          />
        </Card>
      </div>
    </div>
  );
}

export default WalletConnectAnalytics;
