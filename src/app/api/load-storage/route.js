// src/app/api/load-storage/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'lead-software');
    const collection = db.collection('localStorage_sync');

    // Get all localStorage data for user
    const documents = await collection.find({ userId }).sort({ updatedAt: -1 }).toArray();

    // Convert to key-value pairs
    const data = {};
    documents.forEach(doc => {
      data[doc.key] = doc.value;
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error loading storage:', error);
    return NextResponse.json({ 
      error: 'Failed to load storage' 
    }, { status: 500 });
  }
}