import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createErrorResponse } from '@/lib/error-response';
import {
  isAllowedAnalyticsEventName,
  isNonEmptyString,
  ALLOWED_ANALYTICS_EVENT_NAMES,
} from '@/lib/api-validation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { db } = await connectToDatabase();
    const analyticsCollection = db.collection('analytics_events');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Request body must be valid JSON', null, {
        status: 400,
      });
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return createErrorResponse('Request body must be a JSON object', null, {
        status: 400,
      });
    }

    const event = body as Record<string, unknown>;

    if (!isNonEmptyString(event.eventName)) {
      return createErrorResponse(
        'eventName is required and must be a non-empty string',
        null,
        { status: 400 }
      );
    }

    if (!isAllowedAnalyticsEventName(event.eventName)) {
      return createErrorResponse(
        `eventName must be one of: ${ALLOWED_ANALYTICS_EVENT_NAMES.join(', ')}`,
        null,
        { status: 400 }
      );
    }

    if (!isNonEmptyString(event.timestamp)) {
      return createErrorResponse(
        'timestamp is required and must be a non-empty ISO 8601 string',
        null,
        { status: 400 }
      );
    }

    const ts = Date.parse(event.timestamp as string);
    if (Number.isNaN(ts)) {
      return createErrorResponse(
        'timestamp must be a valid ISO 8601 date string',
        null,
        { status: 400 }
      );
    }

    const eventDocument = {
      ...event,
      receivedAt: new Date(),
      userAgent: req.headers.get('user-agent') || '',
      ipAddress: req.headers.get('x-forwarded-for') || '',
    };

    await analyticsCollection.insertOne(eventDocument);

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse('Error processing analytics event', error);
  }
}
