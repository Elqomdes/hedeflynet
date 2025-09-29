import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Class, Assignment, AssignmentSubmission } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const classId = params.id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return NextResponse.json(
        { error: 'Geçersiz sınıf ID formatı' },
        { status: 400 }
      );
    }
    
    const { name, description, coTeacherIds, studentIds } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Sınıf adı gereklidir' },
        { status: 400 }
      );
    }
    
    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Sınıf adı 100 karakterden uzun olamaz' },
        { status: 400 }
      );
    }
    
    if (description && (typeof description !== 'string' || description.trim().length > 500)) {
      return NextResponse.json(
        { error: 'Açıklama 500 karakterden uzun olamaz' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if class belongs to this teacher
    const existingClass = await Class.findOne({
      _id: classId,
      $or: [
        { teacherId: authResult._id },
        { coTeachers: authResult._id }
      ]
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Sınıf bulunamadı veya yetkiniz yok' },
        { status: 404 }
      );
    }

    // Check if another class with the same name exists (excluding current class)
    const duplicateClass = await Class.findOne({
      name,
      _id: { $ne: classId },
      teacherId: authResult._id
    });

    if (duplicateClass) {
      return NextResponse.json(
        { error: 'Bu isimde zaten bir sınıf mevcut' },
        { status: 400 }
      );
    }

    // Update the class
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      {
        name,
        description,
        coTeachers: coTeacherIds || [],
        students: studentIds || []
      },
      { new: true }
    )
      .populate('teacherId', 'firstName lastName')
      .populate('coTeachers', 'firstName lastName')
      .populate('students', 'firstName lastName');

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error('Update class error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting class with ID:', params.id);
    
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      console.log('Unauthorized access attempt for class deletion');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const classId = params.id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      console.log('Invalid ObjectId format:', classId);
      return NextResponse.json(
        { error: 'Geçersiz sınıf ID formatı' },
        { status: 400 }
      );
    }

    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully');

    // Check if class belongs to this teacher
    console.log('Checking if class belongs to teacher:', authResult._id);
    const classData = await Class.findOne({
      _id: classId,
      $or: [
        { teacherId: authResult._id },
        { coTeachers: authResult._id }
      ]
    });

    if (!classData) {
      console.log('Class not found or no permission');
      return NextResponse.json(
        { error: 'Sınıf bulunamadı veya yetkiniz yok' },
        { status: 404 }
      );
    }

    console.log('Class found, proceeding with deletion...');

    try {
      // First, find all assignments related to this class
      console.log('Finding assignments for class...');
      const classAssignments = await Assignment.find({ classId: classId });
      console.log('Found assignments:', classAssignments.length);
      
      // Delete all assignment submissions for these assignments
      if (classAssignments.length > 0) {
        const assignmentIds = classAssignments.map(assignment => assignment._id);
        console.log('Deleting assignment submissions...');
        const submissionResult = await AssignmentSubmission.deleteMany({ assignmentId: { $in: assignmentIds } });
        console.log('Deleted assignment submissions:', submissionResult.deletedCount);
      }
      
      // Delete all assignments related to this class
      console.log('Deleting assignments...');
      const assignmentResult = await Assignment.deleteMany({ classId: classId });
      console.log('Deleted assignments:', assignmentResult.deletedCount);
      
      // Finally, delete the class
      console.log('Deleting class...');
      const classResult = await Class.findByIdAndDelete(classId);
      console.log('Class deleted successfully:', classResult ? 'Yes' : 'No');
      
      return NextResponse.json({ 
        message: 'Sınıf ve ilgili tüm ödevler başarıyla silindi',
        deletedAssignments: assignmentResult.deletedCount,
        deletedSubmissions: classAssignments.length > 0 ? 'Multiple' : 0
      });
    } catch (deletionError) {
      console.error('Deletion error:', deletionError);
      throw deletionError;
    }
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json(
      { 
        error: 'Sunucu hatası',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
