import { 
  Parent, 
  ParentNotification, 
  ParentReport,
  IParent,
  IParentNotification,
  IParentReport
} from '@/lib/models/Parent';
import { User, Assignment, AssignmentSubmission, Goal } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export interface ParentDashboardData {
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    children: {
      id: string;
      firstName: string;
      lastName: string;
      class?: string;
      teacher?: string;
    }[];
  };
  notifications: {
    unread: number;
    recent: IParentNotification[];
  };
  childrenStats: {
    studentId: string;
    studentName: string;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    averageGrade: number;
    goalsAchieved: number;
    goalsTotal: number;
    lastActivity: Date;
    performanceTrend: 'improving' | 'stable' | 'declining';
  }[];
  recentReports: IParentReport[];
  upcomingEvents: {
    type: 'assignment_due' | 'parent_meeting' | 'exam' | 'holiday';
    title: string;
    date: Date;
    studentId: string;
    studentName: string;
  }[];
}

export interface ParentReportData {
  studentId: string;
  period: {
    start: Date;
    end: Date;
  };
  reportType: 'daily' | 'weekly' | 'monthly';
  summary: {
    assignmentsCompleted: number;
    assignmentsTotal: number;
    averageGrade: number;
    goalsAchieved: number;
    goalsTotal: number;
    studyTime: number;
    attendanceRate: number;
    behaviorScore: number;
  };
  subjects: {
    name: string;
    averageGrade: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  recommendations: string[];
  achievements: {
    name: string;
    description: string;
    earnedAt: Date;
  }[];
  concerns: {
    type: 'academic' | 'behavioral' | 'attendance' | 'social';
    description: string;
    severity: 'low' | 'medium' | 'high';
    suggestedActions: string[];
  }[];
}

export class ParentService {
  private static instance: ParentService;

  public static getInstance(): ParentService {
    if (!ParentService.instance) {
      ParentService.instance = new ParentService();
    }
    return ParentService.instance;
  }

  /**
   * Create new parent account
   */
  async createParent(parentData: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    children: string[];
  }): Promise<IParent> {
    await connectDB();

    const hashedPassword = await bcrypt.hash(parentData.password, 12);

    const parent = await Parent.create({
      username: parentData.username,
      firstName: parentData.firstName,
      lastName: parentData.lastName,
      email: parentData.email,
      phone: parentData.phone,
      password: hashedPassword,
      children: parentData.children
    });

    return parent;
  }

  /**
   * Authenticate parent
   */
  async authenticateParent(email: string, password: string): Promise<IParent | null> {
    await connectDB();

    const parent = await Parent.findOne({ email, isActive: true });
    if (!parent) return null;

    const isValidPassword = await bcrypt.compare(password, parent.password);
    if (!isValidPassword) return null;

    // Update last login
    parent.lastLogin = new Date();
    await parent.save();

    return parent;
  }

  /**
   * Check if parent exists by email
   */
  async findParentByEmail(email: string): Promise<IParent | null> {
    await connectDB();
    return await Parent.findOne({ email, isActive: true });
  }

  /**
   * Get parent dashboard data
   */
  async getParentDashboard(parentId: string): Promise<ParentDashboardData> {
    await connectDB();

    const parent = await Parent.findById(parentId).populate('children', 'firstName lastName class teacher');
    if (!parent) throw new Error('Parent not found');

    // Get notifications
    const notifications = await ParentNotification.find({ parentId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('studentId', 'firstName lastName');

    const unreadCount = await ParentNotification.countDocuments({ parentId, isRead: false });

    // Get children stats
    const childrenStats = await this.getChildrenStats(parent.children.map((child: any) => child._id.toString()));

    // Get recent reports
    const recentReports = await ParentReport.find({ parentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentId', 'firstName lastName');

    // Get upcoming events (simplified)
    const upcomingEvents = await this.getUpcomingEvents(parent.children.map((child: any) => child._id.toString()));

    return {
      parent: {
        id: parent._id.toString(),
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        children: parent.children.map((child: any) => ({
          id: child._id.toString(),
          firstName: child.firstName,
          lastName: child.lastName,
          class: child.class,
          teacher: child.teacher
        }))
      },
      notifications: {
        unread: unreadCount,
        recent: notifications
      },
      childrenStats,
      recentReports,
      upcomingEvents
    };
  }

  /**
   * Generate parent report
   */
  async generateParentReport(parentId: string, studentId: string, reportType: 'daily' | 'weekly' | 'monthly'): Promise<IParentReport> {
    await connectDB();

    const reportData = await this.collectReportData(studentId, reportType);
    
    const report = await ParentReport.create({
      parentId,
      studentId,
      period: reportData.period,
      reportType,
      summary: reportData.summary,
      subjects: reportData.subjects,
      recommendations: reportData.recommendations,
      achievements: reportData.achievements,
      concerns: reportData.concerns,
      isGenerated: true,
      generatedAt: new Date()
    });

    return report;
  }

  /**
   * Send notification to parent
   */
  async sendNotification(parentId: string, studentId: string, notification: {
    type: 'assignment_completed' | 'assignment_graded' | 'goal_achieved' | 'low_performance' | 'attendance' | 'general';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    data?: any;
  }): Promise<IParentNotification> {
    await connectDB();

    const parentNotification = await ParentNotification.create({
      parentId,
      studentId,
      ...notification
    });

    return parentNotification;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await connectDB();

    await ParentNotification.findByIdAndUpdate(notificationId, { isRead: true });
  }

  /**
   * Get children statistics
   */
  private async getChildrenStats(childrenIds: string[]): Promise<ParentDashboardData['childrenStats']> {
    const stats = [];

    for (const studentId of childrenIds) {
      const student = await User.findById(studentId);
      if (!student) continue;

      // Get assignments
      const assignments = await Assignment.find({
        $or: [
          { studentId },
          { 'students': studentId }
        ]
      });

      const submissions = await AssignmentSubmission.find({ studentId });

      // Get goals
      const goals = await Goal.find({ studentId });

      // Calculate stats
      const assignmentsCompleted = submissions.filter(s => s.status === 'submitted').length;
      const assignmentsTotal = assignments.length;
      const averageGrade = submissions.length > 0 
        ? submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.length 
        : 0;
      const goalsAchieved = goals.filter(g => g.status === 'completed').length;
      const goalsTotal = goals.length;

      // Calculate performance trend (simplified)
      const performanceTrend = (averageGrade >= 80 ? 'improving' : 
                              averageGrade >= 60 ? 'stable' : 'declining') as 'improving' | 'stable' | 'declining';

      stats.push({
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        assignmentsCompleted,
        assignmentsTotal,
        averageGrade: Math.round(averageGrade),
        goalsAchieved,
        goalsTotal,
        lastActivity: student.updatedAt || student.createdAt,
        performanceTrend
      });
    }

    return stats;
  }

  /**
   * Get upcoming events
   */
  private async getUpcomingEvents(childrenIds: string[]): Promise<ParentDashboardData['upcomingEvents']> {
    // This is a simplified implementation
    // In a real application, you would query actual events from a calendar system
    const events = [];

    for (const studentId of childrenIds) {
      const student = await User.findById(studentId);
      if (!student) continue;

      // Add some sample events
      events.push({
        type: 'assignment_due' as const,
        title: 'Matematik Ödevi',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        studentId,
        studentName: `${student.firstName} ${student.lastName}`
      });
    }

    return events;
  }

  /**
   * Collect report data for a student
   */
  private async collectReportData(studentId: string, reportType: string): Promise<ParentReportData> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    // Calculate period based on report type
    switch (reportType) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get assignments and submissions
    const assignments = await Assignment.find({
      $or: [
        { studentId },
        { 'students': studentId }
      ],
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const submissions = await AssignmentSubmission.find({
      studentId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get goals
    const goals = await Goal.find({
      studentId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calculate summary
    const assignmentsCompleted = submissions.filter(s => s.status === 'submitted').length;
    const assignmentsTotal = assignments.length;
    const averageGrade = submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.length 
      : 0;
    const goalsAchieved = goals.filter(g => g.status === 'completed').length;
    const goalsTotal = goals.length;

    // Calculate subjects performance
    const subjects: ParentReportData['subjects'] = [];
    const subjectStats: { [key: string]: { grades: number[], completed: number, total: number } } = {};

    submissions.forEach(submission => {
      const subject = 'Genel'; // AssignmentSubmission doesn't have subject field
      if (!subjectStats[subject]) {
        subjectStats[subject] = { grades: [], completed: 0, total: 0 };
      }
      if (submission.grade !== undefined) {
        subjectStats[subject].grades.push(submission.grade);
      }
      if (submission.status === 'submitted') {
        subjectStats[subject].completed++;
      }
    });

    assignments.forEach(assignment => {
      const subject = 'Genel'; // Assignment doesn't have subject field
      if (!subjectStats[subject]) {
        subjectStats[subject] = { grades: [], completed: 0, total: 0 };
      }
      subjectStats[subject].total++;
    });

    Object.entries(subjectStats).forEach(([subject, stats]) => {
      const avgGrade = stats.grades.length > 0 
        ? stats.grades.reduce((sum, grade) => sum + grade, 0) / stats.grades.length 
        : 0;
      
      subjects.push({
        name: subject,
        averageGrade: Math.round(avgGrade),
        assignmentsCompleted: stats.completed,
        assignmentsTotal: stats.total,
        trend: avgGrade >= 80 ? 'improving' : avgGrade >= 60 ? 'stable' : 'declining'
      });
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(averageGrade, assignmentsCompleted, assignmentsTotal);

    // Generate concerns
    const concerns = this.generateConcerns(averageGrade, assignmentsCompleted, assignmentsTotal);

    return {
      studentId,
      period: { start: startDate, end: endDate },
      reportType: reportType as 'daily' | 'weekly' | 'monthly',
      summary: {
        assignmentsCompleted,
        assignmentsTotal,
        averageGrade: Math.round(averageGrade),
        goalsAchieved,
        goalsTotal,
        studyTime: Math.floor(Math.random() * 20), // Placeholder
        attendanceRate: 95, // Placeholder
        behaviorScore: Math.floor(Math.random() * 4) + 6 // 6-10 range
      },
      subjects,
      recommendations,
      achievements: [],
      concerns
    };
  }

  /**
   * Generate recommendations based on performance
   */
  private generateRecommendations(averageGrade: number, completed: number, total: number): string[] {
    const recommendations = [];

    if (averageGrade < 60) {
      recommendations.push('Öğrencinin akademik performansını artırmak için ek destek önerilir');
    }

    if (completed / total < 0.7) {
      recommendations.push('Ödev tamamlama oranını artırmak için düzenli takip yapılmalı');
    }

    if (averageGrade >= 80) {
      recommendations.push('Mükemmel performans! Bu başarıyı sürdürmek için teşvik edin');
    }

    return recommendations;
  }

  /**
   * Generate concerns based on performance
   */
  private generateConcerns(averageGrade: number, completed: number, total: number): ParentReportData['concerns'] {
    const concerns = [];

    if (averageGrade < 50) {
      concerns.push({
        type: 'academic' as const,
        description: 'Düşük not ortalaması tespit edildi',
        severity: 'high' as const,
        suggestedActions: ['Öğretmenle görüşme yapın', 'Ek ders desteği alın', 'Çalışma planı oluşturun']
      });
    }

    if (completed / total < 0.5) {
      concerns.push({
        type: 'academic' as const,
        description: 'Ödev tamamlama oranı düşük',
        severity: 'medium' as const,
        suggestedActions: ['Ödev takibi yapın', 'Çalışma ortamını düzenleyin', 'Motivasyon sağlayın']
      });
    }

    return concerns;
  }
}
