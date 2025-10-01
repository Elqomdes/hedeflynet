import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing PDF generation...');
    
    // Create a simple test PDF
    const doc = new jsPDF();
    
    // Basic document setup
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('Test PDF - Hedefly Rapor Sistemi', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 40);
    doc.text('Bu bir test PDF dosyasıdır.', 20, 60);
    doc.text('Rapor sistemi çalışıyor!', 20, 80);
    
    // Generate PDF buffer
    const pdfOutput = doc.output('arraybuffer');
    const buffer = Buffer.from(pdfOutput);
    
    console.log('Test PDF generated successfully, size:', buffer.length);
    
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test_rapor.pdf"',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Test PDF generation failed:', error);
    return NextResponse.json(
      { 
        error: 'Test PDF oluşturulamadı',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
