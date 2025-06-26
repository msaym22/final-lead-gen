// src/lib/db.js
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
let client
let clientPromise

// Create mock database for development
const createMockDB = () => ({
  collection: (name) => ({
    find: (query = {}) => ({ 
      toArray: () => Promise.resolve([]),
      sort: (sortOptions) => ({ 
        toArray: () => Promise.resolve([]),
        limit: (limitCount) => ({ toArray: () => Promise.resolve([]) })
      }),
      limit: (limitCount) => ({ toArray: () => Promise.resolve([]) })
    }),
    findOne: (query) => Promise.resolve(null),
    insertOne: (doc) => Promise.resolve({ 
      insertedId: 'mock-id-' + Date.now(),
      acknowledged: true 
    }),
    insertMany: (docs) => Promise.resolve({ 
      insertedIds: docs.map((_, i) => `mock-id-${Date.now()}-${i}`),
      acknowledged: true 
    }),
    updateOne: (filter, update, options = {}) => Promise.resolve({ 
      modifiedCount: 1,
      matchedCount: 1,
      acknowledged: true 
    }),
    replaceOne: (filter, replacement, options = {}) => Promise.resolve({ 
      modifiedCount: options.upsert ? 1 : Math.random() > 0.5 ? 1 : 0,
      matchedCount: 1,
      upsertedCount: options.upsert ? 1 : 0,
      upsertedId: options.upsert ? 'mock-upsert-' + Date.now() : null,
      acknowledged: true 
    }),
    deleteOne: (filter) => Promise.resolve({ 
      deletedCount: Math.random() > 0.5 ? 1 : 0,
      acknowledged: true 
    }),
    deleteMany: (filter) => Promise.resolve({ 
      deletedCount: Math.floor(Math.random() * 5),
      acknowledged: true 
    }),
    countDocuments: (filter = {}) => Promise.resolve(Math.floor(Math.random() * 100)),
    createIndex: (indexSpec) => Promise.resolve('mock-index-name'),
    createCollection: (name) => Promise.resolve(),
    aggregate: (pipeline) => ({ 
      toArray: () => Promise.resolve([{ _id: null, totalSize: Math.floor(Math.random() * 10000) }]) 
    }),
    // Add bulkWrite support for localStorage sync operations
    bulkWrite: (operations, options = {}) => {
      const results = {
        acknowledged: true,
        insertedCount: 0,
        matchedCount: 0,
        modifiedCount: 0,
        deletedCount: 0,
        upsertedCount: 0,
        upsertedIds: {},
        insertedIds: {}
      };
      
      operations.forEach((op, index) => {
        if (op.insertOne) {
          results.insertedCount++;
          results.insertedIds[index] = 'mock-insert-' + Date.now() + '-' + index;
        } else if (op.replaceOne) {
          results.matchedCount++;
          if (op.replaceOne.upsert) {
            results.upsertedCount++;
            results.upsertedIds[index] = 'mock-upsert-' + Date.now() + '-' + index;
          } else {
            results.modifiedCount++;
          }
        } else if (op.updateOne) {
          results.matchedCount++;
          if (op.updateOne.upsert) {
            results.upsertedCount++;
            results.upsertedIds[index] = 'mock-upsert-' + Date.now() + '-' + index;
          } else {
            results.modifiedCount++;
          }
        } else if (op.deleteOne || op.deleteMany) {
          results.deletedCount++;
        }
      });
      
      console.log(`🔄 Mock bulkWrite: ${operations.length} operations executed`);
      return Promise.resolve(results);
    }
  })
})

// Enhanced connection with better error handling
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('dummy') || process.env.MONGODB_URI.includes('localhost')) {
  console.log('🔄 Using mock database for development')
  clientPromise = Promise.resolve({ 
    db: (dbName) => createMockDB(),
    close: () => Promise.resolve()
  })
} else {
  console.log('🔌 Connecting to MongoDB Atlas...')
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        connectTimeoutMS: 10000,
        retryWrites: true,
        w: 'majority'
      })
      global._mongoClientPromise = client.connect().catch(error => {
        console.error('❌ MongoDB connection failed, falling back to mock:', error.message)
        return { db: (dbName) => createMockDB(), close: () => Promise.resolve() }
      })
    }
    clientPromise = global._mongoClientPromise
  } else {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    })
    clientPromise = client.connect().catch(error => {
      console.error('❌ MongoDB connection failed, falling back to mock:', error.message)
      return { db: (dbName) => createMockDB(), close: () => Promise.resolve() }
    })
  }
}

export async function connectDB() {
  try {
    const client = await clientPromise
    const db = client.db('ai-lead-generator')
    console.log('✅ Database connected successfully')
    return db
  } catch (error) {
    console.error('❌ Database connection failed, using mock database:', error.message)
    return createMockDB()
  }
}

// Helper function for localStorage sync operations
export async function getLocalStorageCollection() {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'ai-lead-generator')
    return db.collection('localStorage_sync')
  } catch (error) {
    console.error('❌ Failed to get localStorage collection:', error.message)
    return createMockDB().collection('localStorage_sync')
  }
}

// Test database connection
export async function testConnection() {
  try {
    const client = await clientPromise
    await client.db('admin').command({ ping: 1 })
    console.log('✅ MongoDB connection test successful')
    return true
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message)
    return false
  }
}

// Graceful shutdown
export async function closeConnection() {
  try {
    if (client) {
      await client.close()
      console.log('✅ Database connection closed')
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message)
  }
}

// Health check function
export async function healthCheck() {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'ai-lead-generator')
    
    // Try to perform a simple operation
    const collections = await db.listCollections().toArray()
    
    return {
      status: 'healthy',
      database: process.env.MONGODB_DB || 'ai-lead-generator',
      collections: collections.length,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      usingMock: true
    }
  }
}

export default clientPromise