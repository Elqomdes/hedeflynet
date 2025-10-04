import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Assignment, AssignmentSubmission, Goal } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { studentId } = await request.json();
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Database connection
    await connectDB();

    console.log('Test Report: Starting with student ID:', studentId);

    // Get student
    const student = await User.findById(studentId).select('firstName lastName email role isActive');
    if (!student) {
      return NextResponse.json({
        error: 'Student not found',
        studentId
      }, { status: 404 });
    }

    if (student.role !== 'student') {
      return NextResponse.json({
        error: 'User is not a student',
        studentId,
        actualRole: student.role
      }, { status: 400 });
    }

    if (!student.isActive) {
      return NextResponse.json({
        error: 'Student is not active',
        studentId
      }, { status: 400 });
    }

    console.log('Test Report: Student found', {
      name: student.firstName,
      role: student.role,
      isActive: student.isActive
    });

    // Get basic data
    const assignments = await Assignment.find({ studentId });
    const submissions = await AssignmentSubmission.find({ studentId });
    const goals = await Goal.find({ studentId });

    console.log('Test Report: Data collected', {
      assignments: assignments.length,
      submissions: submissions.length,
      goals: goals.length
    });

    // Create simple PDF
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text(`${student.firstName} ${student.lastName} - Test Raporu`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 40);
    doc.text(`Ödev Sayısı: ${assignments.length}`, 20, 60);
    doc.text(`Teslim Edilen: ${submissions.length}`, 20, 80);
    doc.text(`Hedef Sayısı: ${goals.length}`, 20, 100);

    const pdfOutput = doc.output('arraybuffer');
    const buffer = Buffer.from(pdfOutput);

    const filename = `${student.firstName}_${student.lastName}_test_raporu.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Test Report: Error', error);
    return NextResponse.json(
      { 
        error: 'Test raporu oluşturulamadı',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
