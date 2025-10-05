import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing MongoDB connection...');
    
    // Test connection
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json({
        status: 'error',
        message: 'MongoDB connection failed',
        details: 'Connection returned null'
      }, { status: 500 });
    }

    // Test database operations
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({
        status: 'error',
        message: 'Database instance not available',
        details: 'mongoose.connection.db is null'
      }, { status: 500 });
    }

    // Test ping
    let pingResult;
    try {
      pingResult = await db.admin().ping();
    } catch (pingError) {
      return NextResponse.json({
        status: 'error',
        message: 'MongoDB ping failed',
        details: pingError instanceof Error ? pingError.message : 'Unknown ping error'
      }, { status: 500 });
    }

    // Test collection access
    let collections;
    try {
      collections = await db.listCollections().toArray();
    } catch (collectionsError) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to list collections',
        details: collectionsError instanceof Error ? collectionsError.message : 'Unknown collections error'
      }, { status: 500 });
    }

    // Get connection info
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return NextResponse.json({
      status: 'success',
      message: 'MongoDB connection test successful',
      details: {
        connectionState: connectionStates[connectionState as keyof typeof connectionStates],
        readyState: connectionState,
        ping: pingResult,
        database: db.databaseName,
        collections: collections.map(col => col.name),
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('MongoDB connection test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'MongoDB connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
