import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // MongoDB bağlantısını test et
    const db = await connectDB();
    
    if (!db) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'MongoDB connection failed',
          mongodb: 'disconnected'
        }, 
        { status: 500 }
      );
    }

    // MongoDB ping test
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    } else {
      throw new Error('MongoDB database not available');
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Server is healthy',
      mongodb: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        mongodb: 'error'
      }, 
      { status: 500 }
    );
  }
}
