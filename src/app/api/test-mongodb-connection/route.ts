import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    
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

    console.log('MongoDB connected, testing collections...');

    // Test User collection
    const userCount = await User.countDocuments();
    console.log('User count:', userCount);

    // Test Class collection
    const classCount = await Class.countDocuments();
    console.log('Class count:', classCount);

    // Test students
    const students = await User.find({ role: 'student' }).limit(5).lean();
    console.log('Sample students:', students);

    // Test classes
    const classes = await Class.find().limit(5).lean();
    console.log('Sample classes:', classes);
    
    return NextResponse.json({
      status: 'success',
      message: 'MongoDB connection successful',
      mongodb: 'connected',
      collections: {
        users: userCount,
        classes: classCount
      },
      sampleData: {
        students: students.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}`, email: s.email })),
        classes: classes.map(c => ({ id: c._id, name: c.name, studentCount: c.students?.length || 0 }))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MongoDB test failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'MongoDB test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        mongodb: 'error',
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
