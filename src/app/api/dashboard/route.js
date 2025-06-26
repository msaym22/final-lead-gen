import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'

export async function GET() {
  try {
    const db = await connectDB()
    
    // Get today's date for filtering
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Aggregate stats from database
    const [
      totalLeads,
      activeCampaigns, 
      todayActivity,
      recentInsights
    ] = await Promise.all([
      db.collection('leads').countDocuments(),
      db.collection('campaigns').countDocuments({ status: 'active' }),
      db.collection('leads').countDocuments({ discoveredAt: { $gte: today } }),
      db.collection('daily_insights').find().sort({ date: -1 }).limit(5).toArray()
    ])

    // Calculate response rate (mock for now - would be based on actual responses)
    const responseRate = Math.floor(Math.random() * 15) + 8 // 8-23%

    const stats = {
      totalLeads,
      responseRate,
      activeCampaigns,
      aiInsights: recentInsights.length,
      todayActivity,
      lastUpdated: new Date()
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
