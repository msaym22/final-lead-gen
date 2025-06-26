export async function POST(request) {
  try {
    const { industry, results } = await request.json()
    
    await client.connect()
    const db = client.db('youtube_research')
    
    await db.collection('research_results').updateOne(
      { industry },
      { 
        $set: { 
          industry,
          results,
          lastUpdated: new Date(),
          transcriptionStats: results.transcriptionStats
        } 
      },
      { upsert: true }
    )
    
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}