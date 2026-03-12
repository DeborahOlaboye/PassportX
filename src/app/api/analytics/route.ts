import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createErrorResponse } from '@/lib/error-response';

// Disable body parsing for this route
// This is needed to get the raw body for signature verification
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { db } = await connectToDatabase();
    const analyticsCollection = db.collection('analytics_events');

    // Parse the raw body
    const body = await req.json();

    // Basic validation
    if (!body.eventName || !body.timestamp) {
      return createErrorResponse('Invalid event data', null, { status: 400 });
    }

    // Prepare the document to be inserted
    const eventDocument = {
      ...body,
      receivedAt: new Date(),
      userAgent: req.headers.get('user-agent') || '',
      ipAddress: req.headers.get('x-forwarded-for') || '',
    };

    // Insert the event into MongoDB
    await analyticsCollection.insertOne(eventDocument);

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse('Error processing analytics event', error);
  }
}
