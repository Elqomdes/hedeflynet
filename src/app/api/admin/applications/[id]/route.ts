import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TeacherApplication } from '@/lib/models';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(['admin'])(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const app = await TeacherApplication.findById(params.id).lean();
    if (!app) return NextResponse.json({ error: 'Başvuru bulunamadı' }, { status: 404 });
    return NextResponse.json(app);
  } catch (error) {
    console.error('Application fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(['admin'])(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, experience, subjects, message, status } = body;

    await connectDB();
    const app = await TeacherApplication.findById(params.id);
    if (!app) return NextResponse.json({ error: 'Başvuru bulunamadı' }, { status: 404 });

    if (firstName !== undefined) app.firstName = firstName;
    if (lastName !== undefined) app.lastName = lastName;
    if (email !== undefined) app.email = email;
    if (phone !== undefined) app.phone = phone;
    if (experience !== undefined) app.experience = experience;
    if (subjects !== undefined) app.subjects = Array.isArray(subjects) ? subjects : String(subjects).split(',').map((s: string) => s.trim());
    if (message !== undefined) app.message = message;
    if (status !== undefined) app.status = status;

    await app.save();
    return NextResponse.json(app.toObject());
  } catch (error) {
    console.error('Application update error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(['admin'])(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const app = await TeacherApplication.findById(params.id);
    if (!app) return NextResponse.json({ error: 'Başvuru bulunamadı' }, { status: 404 });
    await app.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Application delete error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}


