import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Creating sample data...');
    
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

    // Create a teacher
    const teacher = new User({
      username: 'test_teacher',
      email: 'teacher@test.com',
      password: '123456', // Let the pre-save hook hash it
      role: 'teacher',
      firstName: 'Test',
      lastName: 'Teacher',
      phone: '05551234567',
      isActive: true
    });

    await teacher.save();
    console.log('Teacher created:', teacher._id);

    // Create students
    const students = [];
    for (let i = 1; i <= 5; i++) {
      const student = new User({
        username: `student${i}`,
        email: `student${i}@test.com`,
        password: '123456', // Let the pre-save hook hash it
        role: 'student',
        firstName: `Student`,
        lastName: `${i}`,
        phone: `0555123456${i}`,
        isActive: true
      });
      await student.save();
      students.push(student);
      console.log(`Student ${i} created:`, student._id);
    }

    // Create a class
    const class1 = new Class({
      name: 'Test Sınıfı',
      description: 'Test için oluşturulan sınıf',
      teacherId: teacher._id,
      students: students.map(s => s._id)
    });

    await class1.save();
    console.log('Class created:', class1._id);

    // Update students with classId
    for (const student of students) {
      student.classId = class1._id as any;
      await student.save();
    }

    // Create parents using Parent model
    const { Parent } = await import('@/lib/models/Parent');
    const parents = [];
    for (let i = 1; i <= 3; i++) {
      const parent = await Parent.create({
        firstName: `Parent`,
        lastName: `${i}`,
        email: `parent${i}@test.com`,
        phone: `0555123456${i + 10}`,
        password: '123456',
        children: i === 1 ? [students[0]._id, students[1]._id] : [students[i + 1]._id]
      });
      parents.push(parent);
      console.log(`Parent ${i} created:`, parent._id);
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Sample data created successfully',
      data: {
        teacher: {
          id: teacher._id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email
        },
        students: students.map(s => ({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email
        })),
        class: {
          id: class1._id,
          name: class1.name,
          studentCount: class1.students.length
        },
        parents: parents.map(p => ({
          id: p._id,
          name: `${p.firstName} ${p.lastName}`,
          email: p.email,
          childrenCount: p.children?.length || 0
        }))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Sample data creation failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Sample data creation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
