// src/app/api/sync-storage/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function POST(request) {
  try {
    const { items } = await request.json();
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items data' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'lead-software');
    const collection = db.collection('localStorage_sync');

    // Process each item
    const operations = items.map(item => {
      const { key, value, operation, timestamp, userId } = item;

      if (operation === 'remove') {
        return {
          deleteOne: {
            filter: { userId, key }
          }
        };
      } else {
        return {
          replaceOne: {
            filter: { userId, key },
            replacement: {
              userId,
              key,
              value,
              timestamp: new Date(timestamp),
              updatedAt: new Date()
            },
            upsert: true
          }
        };
      }
    });

    // Execute bulk operations
    if (operations.length > 0) {
      await collection.bulkWrite(operations);
    }

    return NextResponse.json({ 
      success: true, 
      synced: operations.length 
    });

  } catch (error) {
    console.error('Error syncing storage:', error);
    return NextResponse.json({ 
      error: 'Failed to sync storage' 
    }, { status: 500 });
  }
}