import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Report } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Allow access by database id or shareToken
    const idOrToken = params.id;
    const isHex24 = /^[a-fA-F0-9]{24}$/.test(idOrToken);

    const query = isHex24 ? { _id: idOrToken } : { shareToken: idOrToken };

    const report = await Report.findOne(query)
      .populate('studentId', 'firstName lastName')
      .populate('teacherId', 'firstName lastName');

    if (!report) {
      return NextResponse.json(
        { error: 'Rapor bulunamadı' },
        { status: 404 }
      );
    }

    if (!report.isPublic) {
      return NextResponse.json(
        { error: 'Bu rapor herkese açık değil' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      _id: report._id,
      title: report.title,
      content: report.content,
      data: report.data,
      createdAt: report.createdAt,
      student: report.studentId,
      teacher: report.teacherId
    });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
