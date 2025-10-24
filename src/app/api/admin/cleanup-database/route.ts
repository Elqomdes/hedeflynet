import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Admin authentication
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sadece adminler bu işlemi yapabilir' },
        { status: 403 }
      );
    }

    await connectDB();

    const results = {
      deletedCollections: [] as string[],
      errors: [] as string[]
    };

    try {
      // MongoDB connection
      const mongoose = await import('mongoose');
      const db = mongoose.connection.db;

      if (db) {
        // Check if reports collection exists and delete it
        const collections = await db.listCollections().toArray();
        const reportCollection = collections.find(col => col.name === 'reports');
        
        if (reportCollection) {
          await db.collection('reports').drop();
          results.deletedCollections.push('reports');
        }
      }

      // Check for any documents with role: 'parent' in users collection
      const { User } = await import('@/lib/models');
      const parentUsers = await User.find({ role: 'parent' });
      
      if (parentUsers.length > 0) {
        // Log the users that will be affected
        console.log('Found users with parent role:', parentUsers.map(u => ({
          id: u._id,
          username: u.username,
          email: u.email
        })));

        // Delete users with parent role (they should use Parent model instead)
        const deleteResult = await User.deleteMany({ role: 'parent' });
        results.deletedCollections.push(`${deleteResult.deletedCount} users with parent role`);
      }

      return NextResponse.json({
        success: true,
        message: 'Database temizleme tamamlandı',
        results
      });

    } catch (error) {
      console.error('Database cleanup error:', error);
      results.errors.push(error instanceof Error ? error.message : 'Bilinmeyen hata');
      
      return NextResponse.json({
        success: false,
        message: 'Database temizleme sırasında hata oluştu',
        results
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Cleanup endpoint error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
