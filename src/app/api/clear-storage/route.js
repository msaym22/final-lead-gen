// src/app/api/clear-storage/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'lead-software');
    const collection = db.collection('localStorage_sync');

    // Delete all localStorage data for user
    const result = await collection.deleteMany({ userId });

    return NextResponse.json({ 
      success: true, 
      deleted: result.deletedCount 
    });

  } catch (error) {
    console.error('Error clearing storage:', error);
    return NextResponse.json({ 
      error: 'Failed to clear storage' 
    }, { status: 500 });
  }
}

// Optional: Get storage stats
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

    // Get storage statistics
    const count = await collection.countDocuments({ userId });
    const totalSize = await collection.aggregate([
      { $match: { userId } },
      { $project: { size: { $bsonSize: "$$ROOT" } } },
      { $group: { _id: null, totalSize: { $sum: "$size" } } }
    ]).toArray();

    const recentItems = await collection.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .project({ key: 1, updatedAt: 1 })
      .toArray();

    return NextResponse.json({
      count,
      totalSize: totalSize[0]?.totalSize || 0,
      recentItems
    });

  } catch (error) {
    console.error('Error getting storage stats:', error);
    return NextResponse.json({ 
      error: 'Failed to get storage stats' 
    }, { status: 500 });
  }
}