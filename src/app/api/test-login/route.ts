import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { generateToken } from '@/lib/auth';
import { safeIdToString } from '@/lib/utils/idHelper';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing login...');
    
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

    // Find test teacher
    const teacher = await User.findOne({ username: 'test_teacher' });
    console.log('Found teacher:', teacher ? 'Yes' : 'No');
    
    if (!teacher) {
      return NextResponse.json({
        status: 'error',
        message: 'Test teacher not found',
        suggestion: 'Run test-create-sample-data first'
      });
    }

    // Test password comparison
    const isPasswordValid = await teacher.comparePassword('123456');
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json({
        status: 'error',
        message: 'Password comparison failed',
        teacher: {
          id: teacher._id,
          username: teacher.username,
          email: teacher.email,
          role: teacher.role
        }
      });
    }

    // Generate token
    if (!teacher._id) {
      return NextResponse.json({
        status: 'error',
        message: 'Teacher ID is missing'
      }, { status: 500 });
    }
    const token = generateToken(safeIdToString(teacher._id), teacher.username, teacher.role);
    console.log('Token generated successfully');

    return NextResponse.json({
      status: 'success',
      message: 'Login test successful',
      teacher: {
        id: teacher._id,
        username: teacher.username,
        email: teacher.email,
        role: teacher.role,
        firstName: teacher.firstName,
        lastName: teacher.lastName
      },
      token: token.substring(0, 20) + '...' // Show only first 20 chars for security
    });
    
  } catch (error) {
    console.error('Login test failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Login test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
