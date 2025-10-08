import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, TeacherApplication, Class, Subscription, FreeTeacherSlot } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const connection = await connectDB();
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    const [
      totalTeachers, 
      totalStudents, 
      pendingApplications, 
      totalClasses,
      totalParents,
      videoSessions,
      activeSubscriptions,
      freeTrialTeachers,
      expiredSubscriptions,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'teacher', isActive: true }),
      User.countDocuments({ role: 'student', isActive: true }),
      TeacherApplication.countDocuments({ status: 'pending' }),
      Class.countDocuments(),
      // Placeholder values for now - these would come from actual data
      0, // totalParents
      0, // videoSessions
      Subscription.countDocuments({ isActive: true, isFreeTrial: false, endDate: { $gt: new Date() } }),
      Subscription.countDocuments({ isActive: true, isFreeTrial: true }),
      Subscription.countDocuments({ isActive: false, endDate: { $lte: new Date() } }),
      // Calculate total revenue from paid subscriptions
      Subscription.aggregate([
        { $match: { isFreeTrial: false, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$originalPrice' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    return NextResponse.json({
      totalTeachers,
      totalStudents,
      pendingApplications,
      totalClasses,
      totalParents,
      videoSessions,
      systemHealth: 'excellent',
      activeSubscriptions,
      freeTrialTeachers,
      expiredSubscriptions,
      totalRevenue
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
