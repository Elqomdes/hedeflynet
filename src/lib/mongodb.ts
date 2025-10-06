import mongoose from 'mongoose';

// MongoDB connection string - MUST be provided via environment variable in production.
// In development, fall back to localhost for safety. Never embed credentials in source.
const MONGODB_URI = process.env.MONGODB_URI || (process.env.NODE_ENV !== 'production'
  ? 'mongodb://127.0.0.1:27017'
  : undefined);
// Preferred database name (defaults to 'hedeflydatas' if not provided)
const MONGODB_DB = process.env.MONGODB_DB || 'hedeflydatas';

// Don't throw error during build time; warn in dev if using fallback
if (!process.env.MONGODB_URI && process.env.NODE_ENV !== 'production') {
  console.warn('MONGODB_URI not provided, using safe localhost fallback');
}

// Global type declaration for mongoose cache
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  try {
    // If MONGODB_URI is not provided in production, skip to avoid leaking errors
    if (!MONGODB_URI) {
      console.warn('MONGODB_URI not provided; skipping DB connection');
      return null;
    }

    // If we have a cached connection and it's ready, return it
    if (cached!.conn && mongoose.connection.readyState === 1) {
      console.log('Using cached MongoDB connection');
      return cached!.conn;
    }

    // If we don't have a promise, create one
    if (!cached!.promise) {
      console.log('Creating new MongoDB connection...');
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000, // Increased timeout for better reliability
        socketTimeoutMS: 120000, // Increased timeout for long operations
        connectTimeoutMS: 30000, // Increased timeout for initial connection
        retryWrites: true,
        w: 'majority' as const,
        dbName: MONGODB_DB,
        maxIdleTimeMS: 60000, // Increased idle time
        minPoolSize: 2, // Minimum pool size for better performance
        heartbeatFrequencyMS: 10000, // Heartbeat frequency
        maxStalenessSeconds: 90, // Max staleness for secondary reads
      };

      const connectionUri = MONGODB_URI!.includes('mongodb://') && !MONGODB_URI!.includes('/')
        ? `${MONGODB_URI}/${MONGODB_DB}`
        : MONGODB_URI!;

      cached!.promise = mongoose.connect(connectionUri, opts).then((mongooseInstance) => {
        console.log(`MongoDB connected successfully (db: ${MONGODB_DB})`);
        return mongooseInstance;
      }).catch((error) => {
        console.error('MongoDB connection failed:', error);
        cached!.promise = null;
        throw new Error(`MongoDB bağlantı hatası: ${error.message}`);
      }) as any;
    }

    cached!.conn = await cached!.promise;
    
    // Verify connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`MongoDB connection not ready. State: ${mongoose.connection.readyState}`);
    }
    
    // Skip per-request ping to avoid extra latency; rely on readyState and events
    
    // Set up connection event listeners for better error handling
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      // Clear cache on disconnect
      cached!.conn = null;
      cached!.promise = null;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    console.log('MongoDB connection is ready');
    return cached!.conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cached!.promise = null;
    cached!.conn = null;
    throw new Error(`Veritabanı bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

export default connectDB;