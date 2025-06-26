import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'

export async function GET(request, { params }) {
  try {
    const { videoId } = params
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      )
    }
    
    const db = await connectDB()
    
    const cached = await db.collection('youtube_transcripts').findOne({ videoId })
    
    if (cached && cached.transcript) {
      console.log(`✅ Retrieved cached transcript for ${videoId} (${cached.length} chars, method: ${cached.method})`)
      
      return NextResponse.json({ 
        success: true,
        transcript: cached.transcript,
        method: cached.method,
        cachedAt: cached.cachedAt,
        fromCache: true,
        length: cached.length
      })
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Transcript not found in cache',
      fromCache: false
    }, { status: 404 })
  } catch (error) {
    console.error('Cache fetch error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { videoId } = params
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      )
    }
    
    const db = await connectDB()
    
    const result = await db.collection('youtube_transcripts').deleteOne({ videoId })
    
    console.log(`🗑️ Deleted cached transcript for ${videoId}`)
    
    return NextResponse.json({ 
      success: true,
      deleted: result.deletedCount > 0,
      message: result.deletedCount > 0 ? 'Transcript deleted from cache' : 'Transcript not found in cache'
    })
  } catch (error) {
    console.error('Cache delete error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}