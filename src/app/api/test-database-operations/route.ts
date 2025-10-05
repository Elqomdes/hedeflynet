import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class, Assignment } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database operations...');
    
    // Test connection
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json({
        status: 'error',
        message: 'MongoDB connection failed',
        details: 'Connection returned null'
      }, { status: 500 });
    }

    const results = {
      connection: 'success',
      userOperations: {},
      classOperations: {},
      assignmentOperations: {},
      errors: []
    };

    // Test User operations
    try {
      const userCount = await User.countDocuments();
      const studentCount = await User.countDocuments({ role: 'student' });
      const teacherCount = await User.countDocuments({ role: 'teacher' });
      
      results.userOperations = {
        totalUsers: userCount,
        students: studentCount,
        teachers: teacherCount,
        status: 'success'
      };
    } catch (error) {
      results.userOperations = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.errors.push(`User operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test Class operations
    try {
      const classCount = await Class.countDocuments();
      const activeClasses = await Class.countDocuments({ isActive: true });
      
      results.classOperations = {
        totalClasses: classCount,
        activeClasses: activeClasses,
        status: 'success'
      };
    } catch (error) {
      results.classOperations = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.errors.push(`Class operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test Assignment operations
    try {
      const assignmentCount = await Assignment.countDocuments();
      const activeAssignments = await Assignment.countDocuments({ isActive: true });
      
      results.assignmentOperations = {
        totalAssignments: assignmentCount,
        activeAssignments: activeAssignments,
        status: 'success'
      };
    } catch (error) {
      results.assignmentOperations = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.errors.push(`Assignment operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test complex query
    try {
      const recentUsers = await User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username email role firstName lastName createdAt')
        .lean();
      
      results.recentUsers = recentUsers;
    } catch (error) {
      results.errors.push(`Recent users query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const hasErrors = results.errors.length > 0;
    
    return NextResponse.json({
      status: hasErrors ? 'partial_success' : 'success',
      message: hasErrors ? 'Some database operations failed' : 'All database operations successful',
      results,
      timestamp: new Date().toISOString()
    }, { status: hasErrors ? 207 : 200 });

  } catch (error) {
    console.error('Database operations test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database operations test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
