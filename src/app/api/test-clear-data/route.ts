import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Clearing test data...');
    
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

    // Clear all data
    await User.deleteMany({});
    await Class.deleteMany({});
    
    console.log('All data cleared');
    
    return NextResponse.json({
      status: 'success',
      message: 'All test data cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Clear data failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Clear data failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
