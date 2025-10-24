import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ParentService } from '@/lib/services/parentService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ParentRegisterSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır').max(30),
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır').max(50),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır').max(50),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Telefon numarası en az 10 karakter olmalıdır'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  children: z.array(z.string()).optional().default([])
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ParentRegisterSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { username, firstName, lastName, email, phone, password, children } = parsed.data;

    await connectDB();

    const parentService = ParentService.getInstance();
    
    // Check if parent already exists
    const existingParent = await parentService.findParentByEmail(email);
    if (existingParent) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Create new parent
    const parent = await parentService.createParent({
      username,
      firstName,
      lastName,
      email,
      phone,
      password,
      children
    });

    return NextResponse.json({
      success: true,
      message: 'Veli hesabı başarıyla oluşturuldu',
      parent: {
        id: parent._id.toString(),
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        children: parent.children
      }
    });

  } catch (error) {
    console.error('Parent registration error:', error);
    return NextResponse.json(
      { 
        error: 'Veli kaydı oluşturulamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
