import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Disable body parsing for this route
// This is needed to get the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const { db } = await connectToDatabase();
    const analyticsCollection = db.collection('analytics_events');
    
    // Parse the raw body
    const body = await req.json();
    
    // Basic validation
    if (!body.eventName || !body.timestamp) {
      return new NextResponse(JSON.stringify({ error: 'Invalid event data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing analytics event:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
