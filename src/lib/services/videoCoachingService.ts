import { 
  VideoSession, 
  VideoRecording, 
  VideoResource, 
  VideoAnalytics,
  IVideoSession,
  IVideoRecording,
  IVideoResource,
  IVideoAnalytics
} from '@/lib/models/VideoCoaching';
import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export interface VideoSessionData {
  id: string;
  title: string;
  description: string;
  teacher: {
    id: string;
    name: string;
    avatar?: string;
  };
  student: {
    id: string;
    name: string;
    avatar?: string;
  };
  type: 'one_on_one' | 'group' | 'class' | 'consultation';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  scheduledFor: Date;
  duration: number;
  actualDuration?: number;
  meetingUrl: string;
  meetingId: string;
  platformUrl?: string;
  participants: {
    id: string;
    name: string;
    role: 'teacher' | 'student' | 'observer';
    joinedAt?: Date;
    isActive: boolean;
  }[];
  recording: {
    url?: string;
    duration?: number;
    isAvailable: boolean;
    expiresAt?: Date;
  };
  agenda: {
    topic: string;
    duration: number;
    description?: string;
    isCompleted: boolean;
  }[];
  feedback: {
    fromUser: string;
    toUser: string;
    rating: number;
    comment: string;
    createdAt: Date;
  }[];
}

export interface VideoResourceData {
  id: string;
  title: string;
  description: string;
  type: 'tutorial' | 'lecture' | 'demo' | 'review' | 'practice';
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  url: string;
  thumbnailUrl?: string;
  createdBy: {
    id: string;
    name: string;
  };
  isPublic: boolean;
  isVerified: boolean;
  tags: string[];
  rating: {
    average: number;
    count: number;
  };
  views: number;
  likes: number;
  bookmarks: number;
  comments: {
    user: string;
    content: string;
    createdAt: Date;
    likes: number;
  }[];
}

export interface VideoAnalyticsData {
  sessionId: string;
  studentId: string;
  teacherId: string;
  engagement: {
    totalWatchTime: number;
    averageWatchTime: number;
    completionRate: number;
    pauseCount: number;
    rewindCount: number;
    fastForwardCount: number;
  };
  interaction: {
    questionsAsked: number;
    answersGiven: number;
    chatMessages: number;
    screenShares: number;
    whiteboardUsage: number;
  };
  performance: {
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
    audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
    videoQuality: 'excellent' | 'good' | 'fair' | 'poor';
    technicalIssues: number;
  };
  feedback: {
    sessionRating: number;
    contentRating: number;
    teacherRating: number;
    overallSatisfaction: number;
    comments: string;
  };
}

export class VideoCoachingService {
  private static instance: VideoCoachingService;

  public static getInstance(): VideoCoachingService {
    if (!VideoCoachingService.instance) {
      VideoCoachingService.instance = new VideoCoachingService();
    }
    return VideoCoachingService.instance;
  }

  /**
   * Create a new video session
   */
  async createVideoSession(sessionData: {
    title: string;
    description: string;
    teacherId: string;
    studentId: string;
    type: 'one_on_one' | 'group' | 'class' | 'consultation';
    scheduledFor: Date;
    duration: number;
    platformUrl?: string;
    agenda?: { topic: string; duration: number; description?: string }[];
  }): Promise<IVideoSession> {
    await connectDB();

    // Use provided platform URL or generate one
    const meetingId = this.generateMeetingId();
    const meetingUrl = sessionData.platformUrl || `https://meet.hedefly.com/${meetingId}`;

    const session = await VideoSession.create({
      ...sessionData,
      meetingUrl,
      meetingId,
      participants: [
        {
          userId: sessionData.teacherId as any,
          role: 'teacher',
          isActive: false
        },
        {
          userId: sessionData.studentId as any,
          role: 'student',
          isActive: false
        }
      ],
      agenda: sessionData.agenda || []
    });

    return session;
  }

  /**
   * Get video sessions for a user
   */
  async getUserVideoSessions(userId: string, role: 'teacher' | 'student'): Promise<VideoSessionData[]> {
    await connectDB();

    const query = role === 'teacher' 
      ? { teacherId: userId }
      : { studentId: userId };

    const sessions = await VideoSession.find(query)
      .populate('teacherId', 'firstName lastName')
      .populate('studentId', 'firstName lastName')
      .populate('participants.userId', 'firstName lastName')
      .sort({ scheduledFor: -1 });

    return sessions.map(session => this.formatVideoSessionData(session));
  }

  /**
   * Get upcoming video sessions
   */
  async getUpcomingSessions(userId: string, role: 'teacher' | 'student'): Promise<VideoSessionData[]> {
    await connectDB();

    const query = role === 'teacher' 
      ? { teacherId: userId, status: 'scheduled', scheduledFor: { $gte: new Date() } }
      : { studentId: userId, status: 'scheduled', scheduledFor: { $gte: new Date() } };

    const sessions = await VideoSession.find(query)
      .populate('teacherId', 'firstName lastName')
      .populate('studentId', 'firstName lastName')
      .populate('participants.userId', 'firstName lastName')
      .sort({ scheduledFor: 1 })
      .limit(10);

    return sessions.map(session => this.formatVideoSessionData(session));
  }

  /**
   * Join a video session
   */
  async joinVideoSession(sessionId: string, userId: string): Promise<{ success: boolean; message: string; meetingUrl?: string }> {
    await connectDB();

    const session = await VideoSession.findById(sessionId);
    if (!session) {
      return { success: false, message: 'Oturum bulunamadı' };
    }

    if (session.status !== 'scheduled' && session.status !== 'in_progress') {
      return { success: false, message: 'Oturum aktif değil' };
    }

    // Check if user is a participant
    const participant = session.participants?.find((p: any) => p.userId?.toString() === userId);
    if (!participant) {
      return { success: false, message: 'Bu oturuma katılma yetkiniz yok' };
    }

    // Update participant status
    participant.isActive = true;
    participant.joinedAt = new Date();

    // Update session status if it's the first participant
    if (session.status === 'scheduled') {
      session.status = 'in_progress';
    }

    await session.save();

    return { 
      success: true, 
      message: 'Oturuma katıldınız',
      meetingUrl: session.meetingUrl
    };
  }

  /**
   * Leave a video session
   */
  async leaveVideoSession(sessionId: string, userId: string): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const session = await VideoSession.findById(sessionId);
    if (!session) {
      return { success: false, message: 'Oturum bulunamadı' };
    }

    const participant = session.participants?.find((p: any) => p.userId?.toString() === userId);
    if (!participant) {
      return { success: false, message: 'Bu oturumda değilsiniz' };
    }

    participant.isActive = false;
    participant.leftAt = new Date();

    // Check if all participants have left
    const activeParticipants = (session.participants || []).filter((p: any) => p.isActive);
    if (activeParticipants.length === 0) {
      session.status = 'completed';
      session.actualDuration = this.calculateSessionDuration(session);
    }

    await session.save();

    return { success: true, message: 'Oturumdan ayrıldınız' };
  }

  /**
   * Add note to video session
   */
  async addSessionNote(sessionId: string, authorId: string, content: string, timestamp: number, isPrivate: boolean = false): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const session = await VideoSession.findById(sessionId);
    if (!session) {
      return { success: false, message: 'Oturum bulunamadı' };
    }

    if (!session.notes) {
      session.notes = [];
    }
    session.notes.push({
      authorId: authorId as any,
      content,
      timestamp,
      isPrivate,
      createdAt: new Date()
    });

    await session.save();

    return { success: true, message: 'Not eklendi' };
  }

  /**
   * Add feedback to video session
   */
  async addSessionFeedback(sessionId: string, fromUserId: string, toUserId: string, rating: number, comment: string): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const session = await VideoSession.findById(sessionId);
    if (!session) {
      return { success: false, message: 'Oturum bulunamadı' };
    }

    // Check if feedback already exists
    const existingFeedback = (session.feedback || []).find((f: any) => 
      f.fromUserId?.toString() === fromUserId && f.toUserId?.toString() === toUserId
    );

    if (existingFeedback) {
      existingFeedback.rating = rating;
      existingFeedback.comment = comment;
    } else {
      if (!session.feedback) {
        session.feedback = [];
      }
      session.feedback.push({
        fromUserId: fromUserId as any,
        toUserId: toUserId as any,
        rating,
        comment,
        createdAt: new Date()
      });
    }

    await session.save();

    return { success: true, message: 'Geri bildirim eklendi' };
  }

  /**
   * Create video resource
   */
  async createVideoResource(resourceData: {
    title: string;
    description: string;
    type: 'tutorial' | 'lecture' | 'demo' | 'review' | 'practice';
    subject: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    url: string;
    thumbnailUrl?: string;
    createdBy: string;
    isPublic: boolean;
    tags: string[];
  }): Promise<IVideoResource> {
    await connectDB();

    const resource = await VideoResource.create(resourceData);
    return resource;
  }

  /**
   * Get video resources
   */
  async getVideoResources(filters?: {
    subject?: string;
    level?: string;
    type?: string;
    isPublic?: boolean;
    createdBy?: string;
  }): Promise<VideoResourceData[]> {
    await connectDB();

    const query: any = {};
    if (filters?.subject) query.subject = filters.subject;
    if (filters?.level) query.level = filters.level;
    if (filters?.type) query.type = filters.type;
    if (filters?.isPublic !== undefined) query.isPublic = filters.isPublic;
    if (filters?.createdBy) query.createdBy = filters.createdBy;

    const resources = await VideoResource.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('comments.userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    return resources.map(resource => this.formatVideoResourceData(resource));
  }

  /**
   * Record video session analytics
   */
  async recordSessionAnalytics(sessionId: string, analyticsData: {
    studentId: string;
    teacherId: string;
    engagement: {
      totalWatchTime: number;
      averageWatchTime: number;
      completionRate: number;
      pauseCount: number;
      rewindCount: number;
      fastForwardCount: number;
    };
    interaction: {
      questionsAsked: number;
      answersGiven: number;
      chatMessages: number;
      screenShares: number;
      whiteboardUsage: number;
    };
    performance: {
      connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
      audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
      videoQuality: 'excellent' | 'good' | 'fair' | 'poor';
      technicalIssues: number;
    };
    feedback: {
      sessionRating: number;
      contentRating: number;
      teacherRating: number;
      overallSatisfaction: number;
      comments: string;
    };
  }): Promise<IVideoAnalytics> {
    await connectDB();

    const analytics = await VideoAnalytics.create({
      sessionId: sessionId as any,
      ...analyticsData
    });

    return analytics;
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<VideoAnalyticsData[]> {
    await connectDB();

    const analytics = await VideoAnalytics.find({ sessionId })
      .populate('studentId', 'firstName lastName')
      .populate('teacherId', 'firstName lastName');

    return analytics.map(analytics => this.formatVideoAnalyticsData(analytics));
  }

  /**
   * Get video coaching statistics for a teacher
   */
  async getTeacherVideoStats(teacherId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    totalParticipants: number;
    averageDuration: number;
    totalRecordings: number;
    thisWeekSessions: number;
    thisMonthSessions: number;
    averageParticipantsPerSession: number;
    totalHours: number;
    attendanceRate: number;
  }> {
    await connectDB();

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all sessions for this teacher
    const allSessions = await VideoSession.find({ teacherId });
    
    // Calculate statistics
    const totalSessions = allSessions.length;
    const completedSessions = allSessions.filter(s => s.status === 'completed').length;
    const upcomingSessions = allSessions.filter(s => s.status === 'scheduled' && s.scheduledFor > now).length;
    
    // Calculate total participants (unique students)
    const uniqueStudents = new Set<string>();
    allSessions.forEach(session => {
      if (session.participants && Array.isArray(session.participants)) {
        session.participants.forEach((participant: any) => {
          if (participant.role === 'student') {
            uniqueStudents.add(participant.userId.toString());
          }
        });
      }
    });
    const totalParticipants = uniqueStudents.size;

    // Calculate average duration
    const completedSessionsWithDuration = allSessions.filter(s => s.status === 'completed' && s.actualDuration);
    const averageDuration = completedSessionsWithDuration.length > 0 
      ? Math.round(completedSessionsWithDuration.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0) / completedSessionsWithDuration.length)
      : 0;

    // Count recordings
    const totalRecordings = allSessions.filter(s => s.recording?.isAvailable).length;

    // This week and month sessions
    const thisWeekSessions = allSessions.filter(s => s.scheduledFor >= startOfWeek).length;
    const thisMonthSessions = allSessions.filter(s => s.scheduledFor >= startOfMonth).length;

    // Average participants per session
    const averageParticipantsPerSession = totalSessions > 0 
      ? Math.round(allSessions.reduce((sum, s) => sum + (s.participants?.length || 0), 0) / totalSessions)
      : 0;

    // Total hours
    const totalHours = Math.round(allSessions.reduce((sum, s) => sum + s.duration, 0) / 60);

    // Attendance rate (simplified calculation)
    const attendanceRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    return {
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalParticipants,
      averageDuration,
      totalRecordings,
      thisWeekSessions,
      thisMonthSessions,
      averageParticipantsPerSession,
      totalHours,
      attendanceRate
    };
  }

  /**
   * Get video coaching statistics for a student
   */
  async getStudentVideoStats(studentId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    totalHours: number;
    averageDuration: number;
    attendanceRate: number;
    teacherCount: number;
  }> {
    await connectDB();

    const now = new Date();

    // Get all sessions for this student
    const allSessions = await VideoSession.find({ 
      'participants.userId': studentId,
      'participants.role': 'student'
    });
    
    // Calculate statistics
    const totalSessions = allSessions.length;
    const completedSessions = allSessions.filter(s => s.status === 'completed').length;
    const upcomingSessions = allSessions.filter(s => s.status === 'scheduled' && s.scheduledFor > now).length;
    
    // Calculate total hours
    const totalHours = Math.round(allSessions.reduce((sum, s) => sum + s.duration, 0) / 60);

    // Calculate average duration
    const averageDuration = totalSessions > 0 
      ? Math.round(allSessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions)
      : 0;

    // Attendance rate
    const attendanceRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    // Count unique teachers
    const uniqueTeachers = new Set<string>();
    allSessions.forEach(session => {
      if (session.teacherId) {
        const teacherIdStr = typeof session.teacherId === 'object'
          ? session.teacherId._id?.toString() || session.teacherId.toString()
          : session.teacherId.toString();
        uniqueTeachers.add(teacherIdStr);
      }
    });
    const teacherCount = uniqueTeachers.size;

    return {
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalHours,
      averageDuration,
      attendanceRate,
      teacherCount
    };
  }

  /**
   * Generate meeting ID
   */
  private generateMeetingId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Calculate session duration
   */
  private calculateSessionDuration(session: IVideoSession): number {
    if (!session.participants || session.participants.length === 0) return 0;

    const participantsWithJoinTime = session.participants.filter(p => p.joinedAt);
    const participantsWithLeaveTime = session.participants.filter(p => p.leftAt);

    if (participantsWithJoinTime.length === 0 || participantsWithLeaveTime.length === 0) return 0;

    const firstJoin = Math.min(
      ...participantsWithJoinTime.map(p => p.joinedAt!.getTime())
    );

    const lastLeave = Math.max(
      ...participantsWithLeaveTime.map(p => p.leftAt!.getTime())
    );

    return Math.round((lastLeave - firstJoin) / (1000 * 60)); // in minutes
  }

  /**
   * Format video session data
   */
  private formatVideoSessionData(session: any): VideoSessionData {
    const teacherId = typeof session.teacherId === 'object' && session.teacherId._id
      ? session.teacherId._id.toString()
      : session.teacherId?.toString() || '';
    
    const teacherName = typeof session.teacherId === 'object' && session.teacherId.firstName
      ? `${session.teacherId.firstName} ${session.teacherId.lastName}`
      : 'Bilinmeyen';
    
    const studentId = typeof session.studentId === 'object' && session.studentId._id
      ? session.studentId._id.toString()
      : session.studentId?.toString() || '';
    
    const studentName = typeof session.studentId === 'object' && session.studentId.firstName
      ? `${session.studentId.firstName} ${session.studentId.lastName}`
      : 'Bilinmeyen';

    return {
      id: session._id.toString(),
      title: session.title,
      description: session.description,
      teacher: {
        id: teacherId,
        name: teacherName
      },
      student: {
        id: studentId,
        name: studentName
      },
      type: session.type,
      status: session.status,
      scheduledFor: session.scheduledFor,
      duration: session.duration,
      actualDuration: session.actualDuration,
      meetingUrl: session.meetingUrl,
      meetingId: session.meetingId,
      platformUrl: session.platformUrl,
      participants: (session.participants || []).map((p: any) => ({
        id: p.userId?._id?.toString() || p.userId?.toString() || '',
        name: p.userId ? `${p.userId.firstName || ''} ${p.userId.lastName || ''}`.trim() : 'Bilinmeyen',
        role: p.role || 'student',
        joinedAt: p.joinedAt,
        isActive: p.isActive || false
      })),
      recording: session.recording,
      agenda: session.agenda,
      feedback: (session.feedback || []).map((f: any) => ({
        fromUser: f.fromUserId?.toString() || '',
        toUser: f.toUserId?.toString() || '',
        rating: f.rating || 0,
        comment: f.comment || '',
        createdAt: f.createdAt || new Date()
      }))
    };
  }

  /**
   * Format video resource data
   */
  private formatVideoResourceData(resource: any): VideoResourceData {
    const createdById = typeof resource.createdBy === 'object' && resource.createdBy._id
      ? resource.createdBy._id.toString()
      : resource.createdBy?.toString() || '';
    
    const createdByName = typeof resource.createdBy === 'object' && resource.createdBy.firstName
      ? `${resource.createdBy.firstName} ${resource.createdBy.lastName}`
      : 'Bilinmeyen';

    return {
      id: resource._id.toString(),
      title: resource.title,
      description: resource.description,
      type: resource.type,
      subject: resource.subject,
      level: resource.level,
      duration: resource.duration,
      url: resource.url,
      thumbnailUrl: resource.thumbnailUrl,
      createdBy: {
        id: createdById,
        name: createdByName
      },
      isPublic: resource.isPublic,
      isVerified: resource.isVerified,
      tags: resource.tags,
      rating: resource.rating,
      views: resource.views,
      likes: (resource.likes || []).length,
      bookmarks: (resource.bookmarks || []).length,
      comments: (resource.comments || []).map((c: any) => ({
        user: c.userId ? `${c.userId.firstName || ''} ${c.userId.lastName || ''}`.trim() : 'Bilinmeyen',
        content: c.content || '',
        createdAt: c.createdAt || new Date(),
        likes: (c.likes || []).length
      }))
    };
  }

  /**
   * Format video analytics data
   */
  private formatVideoAnalyticsData(analytics: any): VideoAnalyticsData {
    return {
      sessionId: analytics.sessionId?.toString() || '',
      studentId: analytics.studentId?.toString() || '',
      teacherId: analytics.teacherId?.toString() || '',
      engagement: analytics.engagement || {
        totalWatchTime: 0,
        averageWatchTime: 0,
        completionRate: 0,
        pauseCount: 0,
        rewindCount: 0,
        fastForwardCount: 0
      },
      interaction: analytics.interaction || {
        questionsAsked: 0,
        answersGiven: 0,
        chatMessages: 0,
        screenShares: 0,
        whiteboardUsage: 0
      },
      performance: analytics.performance || {
        connectionQuality: 'good',
        audioQuality: 'good',
        videoQuality: 'good',
        technicalIssues: 0
      },
      feedback: analytics.feedback || {
        sessionRating: 0,
        contentRating: 0,
        teacherRating: 0,
        overallSatisfaction: 0,
        comments: ''
      }
    };
  }
}
