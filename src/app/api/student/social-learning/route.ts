import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { SocialLearningService } from '@/lib/services/socialLearningService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Sadece öğrenciler sosyal öğrenme verilerini alabilir' },
        { status: 401 }
      );
    }

    await connectDB();

    const studentId = (authResult._id as any).toString();
    const socialLearningService = SocialLearningService.getInstance();

    const dashboardData = await socialLearningService.getDashboardData(studentId);

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Social Learning API Error:', error);
    return NextResponse.json(
      { 
        error: 'Sosyal öğrenme verileri alınamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Sadece öğrenciler sosyal öğrenme işlemleri yapabilir' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    await connectDB();
    const socialLearningService = SocialLearningService.getInstance();
    const studentId = (authResult._id as any).toString();

    switch (action) {
      case 'create_group':
        const group = await socialLearningService.createStudyGroup(studentId, data);
        return NextResponse.json({
          success: true,
          data: group
        });

      case 'join_group':
        const joinResult = await socialLearningService.joinStudyGroup(studentId, data.groupId);
        return NextResponse.json({
          success: joinResult.success,
          message: joinResult.message
        });

      case 'leave_group':
        const leaveResult = await socialLearningService.leaveStudyGroup(studentId, data.groupId);
        return NextResponse.json({
          success: leaveResult.success,
          message: leaveResult.message
        });

      case 'create_session':
        const session = await socialLearningService.createStudySession(data.groupId, studentId, data.sessionData);
        return NextResponse.json({
          success: true,
          data: session
        });

      case 'join_session':
        const joinSessionResult = await socialLearningService.joinStudySession(studentId, data.sessionId);
        return NextResponse.json({
          success: joinSessionResult.success,
          message: joinSessionResult.message
        });

      case 'create_post':
        const post = await socialLearningService.createStudyPost(studentId, data);
        return NextResponse.json({
          success: true,
          data: post
        });

      case 'like_post':
        const likeResult = await socialLearningService.likePost(studentId, data.postId);
        return NextResponse.json({
          success: likeResult.success,
          message: likeResult.message
        });

      case 'comment_post':
        const commentResult = await socialLearningService.commentOnPost(studentId, data.postId, data.content);
        return NextResponse.json({
          success: commentResult.success,
          message: commentResult.message
        });

      case 'share_resource':
        const resource = await socialLearningService.shareResource(studentId, data);
        return NextResponse.json({
          success: true,
          data: resource
        });

      case 'join_challenge':
        const challengeResult = await socialLearningService.joinChallenge(studentId, data.challengeId);
        return NextResponse.json({
          success: challengeResult.success,
          message: challengeResult.message
        });

      default:
        return NextResponse.json(
          { error: 'Geçersiz işlem' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Social Learning POST Error:', error);
    return NextResponse.json(
      { 
        error: 'İşlem gerçekleştirilemedi',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
