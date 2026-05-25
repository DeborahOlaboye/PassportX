import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createErrorResponse } from '@/lib/error-response';
import { isValidTimeRange, VALID_TIME_RANGES } from '@/lib/api-validation';

// Configure route behavior
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rangeRaw = searchParams.get('range');

    if (rangeRaw !== null && !isValidTimeRange(rangeRaw)) {
      return createErrorResponse(
        `Invalid range parameter: must be one of ${VALID_TIME_RANGES.join(
          ', '
        )}`,
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

    const range = isValidTimeRange(rangeRaw) ? rangeRaw : '7d';

    const { db } = await connectToDatabase();
    const analyticsCollection = db.collection('analytics_events');

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
        startDate = new Date(0);
        break;
    }

    const totalConnections = await analyticsCollection.countDocuments({
      eventName: 'wallet_connected',
      timestamp: { $gte: startDate.toISOString() },
    });

    const uniqueWallets = await analyticsCollection.distinct('walletAddress', {
      eventName: 'wallet_connected',
      timestamp: { $gte: startDate.toISOString() },
      walletAddress: { $ne: null },
    });

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
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $toDate: '$timestamp' },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const walletsByType = [
      { name: 'MetaMask', value: Math.floor(Math.random() * 1000) },
      { name: 'WalletConnect', value: Math.floor(Math.random() * 800) },
      { name: 'Coinbase', value: Math.floor(Math.random() * 600) },
      { name: 'Trust', value: Math.floor(Math.random() * 400) },
      { name: 'Other', value: Math.floor(Math.random() * 200) },
    ];

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

    const averageSessionDuration = Math.random() * 10 + 1;
    const completionRate = Math.min(100, Math.max(70, Math.random() * 100));

    const responseData = {
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

    return NextResponse.json(responseData);
  } catch (error) {
    return createErrorResponse('Failed to fetch analytics data', error);
  }
}
