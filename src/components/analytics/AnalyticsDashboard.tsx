'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { 
  fetchAnalyticsData, 
  AnalyticsData, 
  TimeRange 
} from '@/lib/api/analytics';
import { 
  BadgeDistributionChart, 
  EngagementMetrics, 
  GrowthMetrics,
  TimeSeriesChart,
  TopBadges,
  RecentActivity
} from './components';

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const analyticsData = await fetchAnalyticsData({
          startDate: dateRange.from || new Date(),
          endDate: dateRange.to || new Date(),
          timeRange,
        });
        setData(analyticsData);
        setError(null);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dateRange, timeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-lg font-medium">Analytics Overview</h2>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Badges</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalBadges.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.badgesChange >= 0 ? '+' : ''}{data.metrics.badgesChange}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.activeUsersChange >= 0 ? '+' : ''}{data.metrics.activeUsersChange}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.engagementRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.engagementChange >= 0 ? '+' : ''}{data.metrics.engagementChange}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.avgSessionDuration}m</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.sessionDurationChange >= 0 ? '+' : ''}{data.metrics.sessionDurationChange}% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              New users and active users over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <TimeSeriesChart data={data.timeSeries} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Badges</CardTitle>
            <CardDescription>Most awarded badges this period</CardDescription>
          </CardHeader>
          <CardContent>
            <TopBadges badges={data.topBadges} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Badge Distribution</CardTitle>
            <CardDescription>Breakdown of badges by category</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <BadgeDistributionChart data={data.badgeDistribution} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest badge awards and events</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity activities={data.recentActivities} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>How users are interacting with badges</CardDescription>
          </CardHeader>
          <CardContent>
            <EngagementMetrics metrics={data.engagementMetrics} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
            <CardDescription>Platform growth statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <GrowthMetrics metrics={data.growthMetrics} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
