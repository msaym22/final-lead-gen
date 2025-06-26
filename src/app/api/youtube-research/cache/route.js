import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'

export async function POST(request) {
  try {
    const { videoId, transcript, method } = await request.json()
    
    if (!videoId || !transcript) {
      return NextResponse.json(
        { error: 'videoId and transcript are required' },
        { status: 400 }
      )
    }
    
    const db = await connectDB()
    
    const result = await db.collection('youtube_transcripts').updateOne(
      { videoId },
      { 
        $set: { 
          videoId, 
          transcript, 
          method: method || 'unknown', 
          cachedAt: new Date(),
          length: transcript.length
        } 
      },
      { upsert: true }
    )
    
    console.log(`💾 Cached transcript for video ${videoId} (${transcript.length} chars) via ${method}`)
    
    return NextResponse.json({ 
      success: true, 
      cached: true,
      operation: result.upsertedId ? 'inserted' : 'updated',
      length: transcript.length
    })
  } catch (error) {
    console.error('Cache save error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const db = await connectDB()
    
    const stats = await db.collection('youtube_transcripts').aggregate([
      {
        $group: {
          _id: null,
          totalCached: { $sum: 1 },
          totalLength: { $sum: '$length' },
          avgLength: { $avg: '$length' },
          methods: { $addToSet: '$method' }
        }
      }
    ]).toArray()
    
    const methodCounts = await db.collection('youtube_transcripts').aggregate([
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 }
        }
      }
    ]).toArray()
    
    return NextResponse.json({ 
      success: true, 
      stats: {
        ...stats[0] || { totalCached: 0, totalLength: 0, avgLength: 0, methods: [] },
        methodBreakdown: methodCounts.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {})
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}