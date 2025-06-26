import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGODB_URI)

export async function POST(request) {
  try {
    const { videoId, transcript, method } = await request.json()
    
    await client.connect()
    const db = client.db('youtube_research')
    
    await db.collection('transcripts').updateOne(
      { videoId },
      { 
        $set: { 
          videoId, 
          transcript, 
          method, 
          cachedAt: new Date() 
        } 
      },
      { upsert: true }
    )
    
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  try {
    const { videoId } = params
    
    await client.connect()
    const db = client.db('youtube_research')
    
    const cached = await db.collection('transcripts').findOne({ videoId })
    
    if (cached) {
      return Response.json({ transcript: cached.transcript })
    }
    
    return Response.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}