// STEP 1: Create API Routes for Extension Communication

// File: src/app/api/extension/data/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function POST(request) {
  try {
    const { 
      type, 
      data, 
      campaignId, 
      extensionId, 
      source,
      timestamp = new Date().toISOString() 
    } = await request.json();

    console.log('📨 Extension data received:', { type, extensionId, source });

    // Validate request
    if (!type || !data) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, data' 
      }, { status: 400 });
    }

    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB || 'ai-lead-generator');
      const collection = db.collection('localStorage_sync');
      
      // Store extension data
      const extensionData = {
        key: `extension_${type}_${Date.now()}`,
        value: {
          type,
          data,
          campaignId: campaignId || 'default',
          extensionId: extensionId || 'unknown',
          source: source || 'browser_extension',
          timestamp,
          processed: false
        },
        userId: 'current_user', // Replace with actual user ID
        timestamp: new Date(),
        type: 'extension_data'
      };

      await collection.insertOne(extensionData);

      console.log('✅ Extension data saved to database');

      return NextResponse.json({ 
        success: true, 
        message: 'Extension data received successfully',
        dataId: extensionData.key
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue with mock response if DB fails
      return NextResponse.json({ 
        success: true, 
        message: 'Extension data received (mock mode)',
        note: 'Database connection failed, using fallback'
      });
    }

  } catch (error) {
    console.error('Extension API error:', error);
    return NextResponse.json({ 
      error: 'Failed to process extension data',
      details: error.message 
    }, { status: 500 });
  }
}

// Get extension data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const type = searchParams.get('type');

    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB || 'ai-lead-generator');
      const collection = db.collection('localStorage_sync');
      
      const query = {
        userId: 'current_user',
        type: 'extension_data'
      };

      const documents = await collection.find(query).sort({ timestamp: -1 }).toArray();
      
      // Filter extension data
      let extensionData = documents
        .map(doc => doc.value)
        .filter(data => {
          if (campaignId && campaignId !== 'all' && data.campaignId !== campaignId) return false;
          if (type && data.type !== type) return false;
          return true;
        });

      return NextResponse.json({ 
        success: true, 
        data: extensionData,
        count: extensionData.length
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return mock data if DB fails
      return NextResponse.json({ 
        success: true, 
        data: [],
        count: 0,
        note: 'Database connection failed, returning empty data'
      });
    }

  } catch (error) {
    console.error('Get extension data error:', error);
    return NextResponse.json({ 
      error: 'Failed to get extension data' 
    }, { status: 500 });
  }
}

// File: src/app/api/extension/status/route.js
export async function GET() {
  try {
    // Check which extensions are connected and their status
    const extensionStatus = {
      wappalyzer: {
        connected: false,
        lastActivity: null,
        version: null,
        permissions: ['Website technology detection']
      },
      hunter: {
        connected: false,
        lastActivity: null,
        version: null,
        permissions: ['Email finding and verification']
      },
      linkedin: {
        connected: false,
        lastActivity: null,
        version: null,
        permissions: ['LinkedIn profile extraction']
      },
      instagram: {
        connected: false,
        lastActivity: null,
        version: null,
        permissions: ['Instagram lead discovery']
      }
    };

    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB || 'ai-lead-generator');
      const collection = db.collection('localStorage_sync');
      
      // Check for recent extension activity (last 5 minutes)
      const recentActivity = await collection.find({
        type: 'extension_data',
        timestamp: { 
          $gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      }).toArray();

      // Update status based on recent activity
      recentActivity.forEach(activity => {
        const data = activity.value;
        if (data.source === 'wappalyzer') {
          extensionStatus.wappalyzer.connected = true;
          extensionStatus.wappalyzer.lastActivity = data.timestamp;
        }
        if (data.source === 'hunter') {
          extensionStatus.hunter.connected = true;
          extensionStatus.hunter.lastActivity = data.timestamp;
        }
        if (data.source === 'linkedin_extension') {
          extensionStatus.linkedin.connected = true;
          extensionStatus.linkedin.lastActivity = data.timestamp;
        }
        if (data.source === 'instagram_extension') {
          extensionStatus.instagram.connected = true;
          extensionStatus.instagram.lastActivity = data.timestamp;
        }
      });

    } catch (dbError) {
      console.log('Database connection failed, returning default status');
    }

    return NextResponse.json({ 
      success: true, 
      extensions: extensionStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Extension status error:', error);
    return NextResponse.json({ 
      error: 'Failed to get extension status' 
    }, { status: 500 });
  }
}