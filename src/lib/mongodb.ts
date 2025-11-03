import mongoose, { ConnectionStates } from 'mongoose';

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

// Cache type
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

let cached: MongooseCache;

if (global.mongoose && typeof global.mongoose === 'object') {
  cached = global.mongoose as MongooseCache;
} else {
  cached = { conn: null, promise: null };
  global.mongoose = cached as any;
}

async function connectDB(retryCount = 0): Promise<typeof mongoose> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second delay between retries

  try {
    // If MONGODB_URI is not provided in production, skip to avoid leaking errors
    if (!MONGODB_URI) {
      console.warn('MONGODB_URI not provided; skipping DB connection');
      throw new Error('MONGODB_URI not provided');
    }

    // If we have a cached connection and it's ready, return it
    const cachedConn = cached.conn;
    if (cachedConn && mongoose.connection.readyState === ConnectionStates.connected) {
      console.log('Using cached MongoDB connection');
      return cachedConn;
    }

    // If the connection is in a connecting state and we have a promise, wait for it
    if (cached.promise && mongoose.connection.readyState === ConnectionStates.connecting) {
      console.log('Waiting for existing connection...');
      try {
        const result = await cached.promise;
        // If promise resolved successfully, connection is ready
        return result;
      } catch (error) {
        console.error('Waiting for connection failed, retrying...');
        cached.promise = null;
      }
    }

    // If we don't have a promise, create one
    if (!cached.promise) {
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

      cached.promise = mongoose.connect(connectionUri, opts).then((mongooseInstance) => {
        console.log(`MongoDB connected successfully (db: ${MONGODB_DB})`);
        
        // Set up connection event listeners for better error handling (only once)
        if (!mongoose.connection.listeners('error').length) {
          mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
            cached.conn = null;
            cached.promise = null;
          });
        }
        
        if (!mongoose.connection.listeners('disconnected').length) {
          mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
            // Clear cache on disconnect
            cached.conn = null;
            cached.promise = null;
          });
        }
        
        if (!mongoose.connection.listeners('reconnected').length) {
          mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
          });
        }
        
        return mongooseInstance;
      }).catch((error) => {
        console.error('MongoDB connection failed:', error);
        cached.promise = null;
        cached.conn = null;
        throw error;
      });
    }

    cached.conn = await cached.promise;
    
    // Verify connection is actually ready
    if (mongoose.connection.readyState !== ConnectionStates.connected) {
      console.warn(`MongoDB connection not ready. State: ${mongoose.connection.readyState}`);
      cached.conn = null;
      cached.promise = null;
      
      // Retry if we haven't exceeded max retries
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying connection (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return connectDB(retryCount + 1);
      }
      
      throw new Error(`MongoDB connection not ready. State: ${mongoose.connection.readyState}`);
    }
    
    console.log('MongoDB connection is ready');
    const finalConn = cached.conn;
    if (!finalConn) {
      throw new Error('Connection failed - no cached connection');
    }
    return finalConn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cached.promise = null;
    cached.conn = null;
    
    // Retry if we haven't exceeded max retries
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection after error (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    }
    
    throw new Error(`Veritabanı bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

export default connectDB;