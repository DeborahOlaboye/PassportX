import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the connection across module reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  // In production mode, avoid using a global variable
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db('passportx');
  return { client, db };
}

// Create indexes for better query performance
export async function createIndexes() {
  try {
    const { db } = await connectToDatabase();
    await db.collection('analytics_events').createIndex({ eventName: 1 });
    await db.collection('analytics_events').createIndex({ timestamp: -1 });
    await db.collection('analytics_events').createIndex({ walletAddress: 1 });
    await db.collection('analytics_events').createIndex({ sessionId: 1 });
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
}

// Call createIndexes when the module is loaded
if (process.env.NODE_ENV !== 'test') {
  createIndexes().catch(console.error);
}

export default clientPromise;
