import mongoose from 'mongoose';

// MongoDB connection string - MUST be provided via environment variable
// In development, fall back to provided Atlas URI if not set
const MONGODB_URI = process.env.MONGODB_URI || (process.env.NODE_ENV !== 'production'
  ? 'mongodb+srv://hedefly_db_user:emre42498*@hedeflydatas.8esydhl.mongodb.net/?retryWrites=true&w=majority&appName=hedeflydatas'
  : undefined);
// Preferred database name (defaults to 'hedeflydatas' if not provided)
const MONGODB_DB = process.env.MONGODB_DB || 'hedeflydatas';

// Don't throw error during build time
if (!process.env.MONGODB_URI && process.env.NODE_ENV !== 'production') {
  console.warn('MONGODB_URI not provided, using development fallback URI');
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
  // If MONGODB_URI is not provided, return null for build time
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not provided, skipping connection');
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
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority' as const,
      dbName: MONGODB_DB,
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log(`MongoDB connected successfully (db: ${MONGODB_DB})`);
      return mongooseInstance;
    }).catch((error) => {
      console.error('MongoDB connection failed:', error);
      cached!.promise = null;
      throw error;
    }) as any;
  }

  try {
    cached!.conn = await cached!.promise;
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`MongoDB connection not ready. State: ${mongoose.connection.readyState}`);
    }
    
    console.log('MongoDB connection is ready');
  } catch (e) {
    console.error('MongoDB connection error:', e);
    cached!.promise = null;
    cached!.conn = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;