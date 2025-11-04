import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { Parent } from '@/lib/models/Parent';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    const teacherId = params.id;

    // Check if teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return NextResponse.json(
        { error: 'Öğretmen bulunamadı' },
        { status: 404 }
      );
    }

    if (teacher.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Bu kullanıcı bir öğretmen değil' },
        { status: 400 }
      );
    }

    // Get teacher's classes
    const classes = await Class.find({
      $or: [
        { teacherId },
        { coTeachers: teacherId }
      ]
    }).select('_id name students').lean();

    // Get all student IDs from teacher's classes
    const studentIds = new Set<string>();
    for (const cls of classes) {
      if (Array.isArray((cls as any).students)) {
        for (const studentId of (cls as any).students) {
          studentIds.add(String(studentId));
        }
      }
    }

    // If teacher has no students, return empty list
    if (studentIds.size === 0) {
      return NextResponse.json({
        success: true,
        parents: []
      });
    }

    // Get parents who have children in teacher's classes
    const parents = await Parent.find({
      children: { $in: Array.from(studentIds) }
    })
    .select('_id username email firstName lastName phone children isActive createdAt')
    .sort({ createdAt: -1 })
    .lean();

    // Add children details for each parent - only show children that are in teacher's classes
    const parentsWithChildrenDetails = await Promise.all(
      parents.map(async (parent) => {
        let childrenDetails: any[] = [];
        
        if (parent.children && parent.children.length > 0) {
          // Filter to only get children that are in teacher's classes
          const relevantChildren = parent.children.filter((childId: any) => 
            studentIds.has(String(childId))
          );

          if (relevantChildren.length > 0) {
            const allChildrenDetails = await User.find({
              _id: { $in: relevantChildren },
              role: 'student'
            })
              .select('_id firstName lastName email classId')
              .lean();

            // Add class names to children
            childrenDetails = await Promise.all(
              allChildrenDetails.map(async (child: any) => {
                if (child.classId) {
                  const classInfo = await Class.findById(child.classId).select('name').lean();
                  return {
                    ...child,
                    className: classInfo?.name || null
                  };
                }
                return child;
              })
            );
          }
        }

        return {
          ...parent,
          // Only include children that are in teacher's classes
          children: parent.children?.filter((childId: any) => 
            studentIds.has(String(childId))
          ) || [],
          childrenDetails: childrenDetails
        };
      })
    );

    return NextResponse.json({
      success: true,
      parents: parentsWithChildrenDetails
    });

  } catch (error) {
    console.error('Get teacher parents error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
