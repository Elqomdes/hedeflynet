import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Class from '@/lib/models/Class';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const ParentCreateSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  phone: z.string().optional(),
  children: z.array(z.string()).default([])
});

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const teacherId = authResult._id;

    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    // Get teacher's classes to filter students
    const classes = await Class.find({
      $or: [
        { teacherId },
        { coTeachers: teacherId }
      ]
    }).select('students').lean();

    // Get all student IDs from teacher's classes
    const teacherStudentIds = new Set<string>();
    for (const cls of classes) {
      if (Array.isArray((cls as any).students)) {
        for (const sid of (cls as any).students) {
          teacherStudentIds.add(String(sid));
        }
      }
    }

    // If teacher has no students, return empty list
    if (teacherStudentIds.size === 0) {
      return NextResponse.json({
        success: true,
        parents: []
      });
    }

    // Get parents who have children in teacher's classes
    const { Parent } = await import('@/lib/models/Parent');
    
    // Only get parents whose children are in this teacher's classes
    const parents = await Parent.find({
      children: { $in: Array.from(teacherStudentIds) }
    })
      .select('_id username email firstName lastName phone children isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Add children details for each parent - only show children that are in teacher's classes
    const parentsWithChildrenDetails = await Promise.all(
      parents.map(async (parent) => {
        type ChildDetail = {
          _id: any;
          firstName: string;
          lastName: string;
          email: string;
          classId?: any;
          className?: string | null;
        };
        
        let childrenDetails: ChildDetail[] = [];
        
        if (parent.children && parent.children.length > 0) {
          // Filter to only get children that are in teacher's classes
          const relevantChildren = parent.children.filter((childId: any) => 
            teacherStudentIds.has(String(childId))
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
            teacherStudentIds.has(String(childId))
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
    console.error('Get parents error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request data
    const body = await request.json();
    const parsed = ParentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { username, email, password, firstName, lastName, phone, children } = parsed.data;

    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create and save parent using Parent model
    const { Parent } = await import('@/lib/models/Parent');
    const parent = await Parent.create({
      username,
      firstName,
      lastName,
      email,
      phone: phone || '',
      password: hashedPassword,
      children: children || [],
      isActive: true
    });

    return NextResponse.json({
      success: true,
      message: 'Veli başarıyla oluşturuldu',
      parent: {
        id: parent._id,
        username: parent.username,
        email: parent.email,
        firstName: parent.firstName,
        lastName: parent.lastName,
        children: parent.children
      }
    });

  } catch (error) {
    console.error('Create parent error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
