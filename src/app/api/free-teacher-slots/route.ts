import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { FreeTeacherSlot } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Toplam slot sayısını ve kullanılan slot sayısını al
    const totalSlots = 20;
    const usedSlots = await FreeTeacherSlot.countDocuments({ isActive: true });
    const availableSlots = totalSlots - usedSlots;
    
    // Son 5 atanan öğretmeni al
    const recentAssignments = await FreeTeacherSlot.find({ isActive: true })
      .populate('teacherId', 'firstName lastName')
      .sort({ assignedAt: -1 })
      .limit(5);
    
    return NextResponse.json({
      success: true,
      data: {
        totalSlots,
        usedSlots,
        availableSlots,
        recentAssignments: recentAssignments.map(slot => ({
          slotNumber: slot.slotNumber,
          teacherName: slot.teacherId && typeof slot.teacherId === 'object' && 'firstName' in slot.teacherId 
            ? `${(slot.teacherId as any).firstName} ${(slot.teacherId as any).lastName}`
            : 'Bilinmeyen Öğretmen',
          assignedAt: slot.assignedAt
        }))
      }
    });
  } catch (error) {
    console.error('Free teacher slots fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Ücretsiz öğretmen slotları alınamadı' },
      { status: 500 }
    );
  }
}
