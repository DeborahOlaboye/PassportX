import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as TimeRange) || '7d';
    
    const { db } = await connectToDatabase();
    const analyticsCollection = db.collection('analytics_events');

    // Calculate date range based on the selected time range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Unix epoch
        break;
    }

    // Get total connections
    const totalConnections = await analyticsCollection.countDocuments({
      eventName: 'wallet_connected',
      timestamp: { $gte: startDate.toISOString() },
    });

    // Get unique wallets
    const uniqueWallets = await analyticsCollection.distinct('walletAddress', {
      eventName: 'wallet_connected',
      timestamp: { $gte: startDate.toISOString() },
      walletAddress: { $ne: null },
    });

    // Get connections by day
    const connectionsByDay = await analyticsCollection
      .aggregate([
        {
          $match: {
            eventName: 'wallet_connected',
            timestamp: { $gte: startDate.toISOString() },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$timestamp' } },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Get wallet types (simplified example)
    const walletsByType = [
      { name: 'MetaMask', value: Math.floor(Math.random() * 1000) },
      { name: 'WalletConnect', value: Math.floor(Math.random() * 800) },
      { name: 'Coinbase', value: Math.floor(Math.random() * 600) },
      { name: 'Trust', value: Math.floor(Math.random() * 400) },
      { name: 'Other', value: Math.floor(Math.random() * 200) },
    ];

    // Get transactions by method
    const transactionsByMethod = await analyticsCollection
      .aggregate([
        {
          $match: {
            eventName: 'transaction_completed',
            timestamp: { $gte: startDate.toISOString() },
            'eventData.method': { $exists: true },
          },
        },
        {
          $group: {
            _id: '$eventData.method',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // Calculate average session duration (simplified)
    const averageSessionDuration = Math.random() * 10 + 1; // 1-11 minutes
    const completionRate = Math.min(100, Math.max(70, Math.random() * 100)); // 70-100%

    const response = {
      totalConnections,
      uniqueWallets: uniqueWallets.length,
      averageSessionDuration: parseFloat(averageSessionDuration.toFixed(1)),
      completionRate: parseFloat(completionRate.toFixed(1)),
      connectionsByDay: connectionsByDay.map((item) => ({
        date: item._id,
        Connections: item.count,
      })),
      walletsByType,
      transactionsByMethod: transactionsByMethod.map((item) => ({
        name: item._id,
        Transactions: item.count,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching WalletConnect analytics:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch analytics data' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
