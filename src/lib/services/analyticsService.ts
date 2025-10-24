import { User, Assignment, AssignmentSubmission, Class, Goal } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export interface PerformanceMetrics {
  studentId: string;
  period: {
    start: Date;
    end: Date;
  };
  academicPerformance: {
    averageGrade: number;
    gradeTrend: 'improving' | 'stable' | 'declining';
    completionRate: number;
    submissionRate: number;
    gradingRate: number;
  };
  subjectAnalysis: {
    subject: string;
    averageGrade: number;
    trend: 'improving' | 'stable' | 'declining';
    strength: number; // 1-10 scale
    weakness: number; // 1-10 scale
    recommendations: string[];
  }[];
  behavioralInsights: {
    studyConsistency: number; // 1-10 scale
    assignmentPunctuality: number; // 1-10 scale
    goalOrientation: number; // 1-10 scale
    engagementLevel: number; // 1-10 scale
  };
  predictions: {
    nextMonthGrade: number;
    graduationProbability: number;
    riskFactors: string[];
    opportunities: string[];
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: 'academic' | 'behavioral' | 'social' | 'motivational';
    title: string;
    description: string;
    expectedImpact: number; // 1-10 scale
    timeframe: string;
  }[];
}

export interface ClassAnalytics {
  classId: string;
  className: string;
  period: {
    start: Date;
    end: Date;
  };
  overallPerformance: {
    averageGrade: number;
    completionRate: number;
    engagementScore: number;
  };
  studentRankings: {
    studentId: string;
    studentName: string;
    rank: number;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  subjectBreakdown: {
    subject: string;
    averageGrade: number;
    difficulty: 'easy' | 'medium' | 'hard';
    studentPerformance: {
      excellent: number; // count
      good: number;
      average: number;
      belowAverage: number;
    };
  }[];
  insights: {
    topPerformers: string[];
    strugglingStudents: string[];
    improvementAreas: string[];
    strengths: string[];
  };
}

export interface TeacherAnalytics {
  teacherId: string;
  period: {
    start: Date;
    end: Date;
  };
  teachingEffectiveness: {
    overallScore: number; // 1-10 scale
    studentSatisfaction: number;
    assignmentQuality: number;
    feedbackTimeliness: number;
    engagementLevel: number;
  };
  studentOutcomes: {
    totalStudents: number;
    highPerformers: number;
    averagePerformers: number;
    strugglingStudents: number;
    improvementRate: number;
  };
  workloadAnalysis: {
    totalAssignments: number;
    averageGradingTime: number; // in hours
    pendingGradings: number;
    workloadScore: number; // 1-10 scale
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: 'teaching' | 'assessment' | 'engagement' | 'workload';
    title: string;
    description: string;
    expectedImpact: number;
  }[];
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get comprehensive performance metrics for a student
   */
  async getStudentPerformanceMetrics(studentId: string, period?: { start: Date; end: Date }): Promise<PerformanceMetrics> {
    await connectDB();

    const endDate = period?.end || new Date();
    const startDate = period?.start || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

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

    const goals = await Goal.find({
      studentId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calculate academic performance
    const academicPerformance = this.calculateAcademicPerformance(assignments, submissions);

    // Analyze subjects
    const subjectAnalysis = this.analyzeSubjects(assignments, submissions);

    // Get behavioral insights
    const behavioralInsights = this.calculateBehavioralInsights(assignments, submissions, goals);

    // Generate predictions
    const predictions = this.generatePredictions(academicPerformance, behavioralInsights, submissions);

    // Generate recommendations
    const recommendations = this.generateRecommendations(academicPerformance, behavioralInsights, subjectAnalysis);

    return {
      studentId,
      period: { start: startDate, end: endDate },
      academicPerformance,
      subjectAnalysis,
      behavioralInsights,
      predictions,
      recommendations
    };
  }

  /**
   * Get class-level analytics
   */
  async getClassAnalytics(classId: string, period?: { start: Date; end: Date }): Promise<ClassAnalytics> {
    await connectDB();

    const endDate = period?.end || new Date();
    const startDate = period?.start || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get class assignments
    const assignments = await Assignment.find({
      classId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get all submissions for these assignments
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignmentIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get class students
    const students = await User.find({ classId, role: 'student' });

    // Calculate overall performance
    const overallPerformance = this.calculateClassOverallPerformance(assignments, submissions);

    // Calculate student rankings
    const studentRankings = this.calculateStudentRankings(students, submissions);

    // Analyze subjects
    const subjectBreakdown = this.analyzeClassSubjects(assignments, submissions);

    // Generate insights
    const insights = this.generateClassInsights(studentRankings, subjectBreakdown);

    return {
      classId,
      className: 'Sınıf', // Would be fetched from class data
      period: { start: startDate, end: endDate },
      overallPerformance,
      studentRankings,
      subjectBreakdown,
      insights
    };
  }

  /**
   * Get teacher analytics
   */
  async getTeacherAnalytics(teacherId: string, period?: { start: Date; end: Date }): Promise<TeacherAnalytics> {
    await connectDB();

    const endDate = period?.end || new Date();
    const startDate = period?.start || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get teacher's assignments
    const assignments = await Assignment.find({
      teacherId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get submissions
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignmentIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get students
    const students = await User.find({ teacherId, role: 'student' });

    // Calculate teaching effectiveness
    const teachingEffectiveness = this.calculateTeachingEffectiveness(assignments, submissions, students);

    // Calculate student outcomes
    const studentOutcomes = this.calculateStudentOutcomes(students, submissions);

    // Analyze workload
    const workloadAnalysis = this.analyzeWorkload(assignments, submissions);

    // Generate recommendations
    const recommendations = this.generateTeacherRecommendations(teachingEffectiveness, studentOutcomes, workloadAnalysis);

    return {
      teacherId,
      period: { start: startDate, end: endDate },
      teachingEffectiveness,
      studentOutcomes,
      workloadAnalysis,
      recommendations
    };
  }

  /**
   * Calculate academic performance metrics
   */
  private calculateAcademicPerformance(assignments: any[], submissions: any[]): PerformanceMetrics['academicPerformance'] {
    const totalAssignments = assignments.length;
    const submittedAssignments = submissions.filter(s => s.status === 'submitted').length;
    const gradedAssignments = submissions.filter(s => s.grade !== undefined).length;

    const averageGrade = submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.length 
      : 0;

    const completionRate = totalAssignments > 0 ? (submittedAssignments / totalAssignments) * 100 : 0;
    const submissionRate = totalAssignments > 0 ? (submittedAssignments / totalAssignments) * 100 : 0;
    const gradingRate = submittedAssignments > 0 ? (gradedAssignments / submittedAssignments) * 100 : 0;

    // Calculate trend (simplified)
    const recentSubmissions = submissions.slice(-5);
    const olderSubmissions = submissions.slice(-10, -5);
    const recentAvg = recentSubmissions.length > 0 
      ? recentSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / recentSubmissions.length 
      : 0;
    const olderAvg = olderSubmissions.length > 0 
      ? olderSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / olderSubmissions.length 
      : 0;

    let gradeTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAvg > olderAvg + 5) gradeTrend = 'improving';
    else if (recentAvg < olderAvg - 5) gradeTrend = 'declining';

    return {
      averageGrade: Math.round(averageGrade),
      gradeTrend,
      completionRate: Math.round(completionRate),
      submissionRate: Math.round(submissionRate),
      gradingRate: Math.round(gradingRate)
    };
  }

  /**
   * Analyze subject performance
   */
  private analyzeSubjects(assignments: any[], submissions: any[]): PerformanceMetrics['subjectAnalysis'] {
    const subjectStats: { [key: string]: { grades: number[], assignments: number } } = {};

    // Group by subject
    assignments.forEach(assignment => {
      const subject = assignment.subject || 'Genel';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { grades: [], assignments: 0 };
      }
      subjectStats[subject].assignments++;
    });

    submissions.forEach(submission => {
      const subject = submission.subject || 'Genel';
      if (subjectStats[subject] && submission.grade !== undefined) {
        subjectStats[subject].grades.push(submission.grade);
      }
    });

    return Object.entries(subjectStats).map(([subject, stats]) => {
      const averageGrade = stats.grades.length > 0 
        ? stats.grades.reduce((sum, grade) => sum + grade, 0) / stats.grades.length 
        : 0;

      // Calculate trend (simplified)
      const recentGrades = stats.grades.slice(-3);
      const olderGrades = stats.grades.slice(-6, -3);
      const recentAvg = recentGrades.length > 0 
        ? recentGrades.reduce((sum, g) => sum + g, 0) / recentGrades.length 
        : 0;
      const olderAvg = olderGrades.length > 0 
        ? olderGrades.reduce((sum, g) => sum + g, 0) / olderGrades.length 
        : 0;

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentAvg > olderAvg + 5) trend = 'improving';
      else if (recentAvg < olderAvg - 5) trend = 'declining';

      const strength = Math.min(10, Math.max(1, Math.round(averageGrade / 10)));
      const weakness = 11 - strength;

      const recommendations = this.generateSubjectRecommendations(subject, averageGrade, trend);

      return {
        subject,
        averageGrade: Math.round(averageGrade),
        trend,
        strength,
        weakness,
        recommendations
      };
    });
  }

  /**
   * Calculate behavioral insights
   */
  private calculateBehavioralInsights(assignments: any[], submissions: any[], goals: any[]): PerformanceMetrics['behavioralInsights'] {
    // Study consistency (based on submission patterns)
    const submissionDates = submissions.map(s => new Date(s.createdAt));
    const studyConsistency = this.calculateConsistency(submissionDates);

    // Assignment punctuality (based on on-time submissions)
    const onTimeSubmissions = submissions.filter(s => {
      const assignment = assignments.find(a => a._id.toString() === s.assignmentId.toString());
      if (!assignment) return false;
      return new Date(s.createdAt) <= new Date(assignment.dueDate);
    }).length;
    const assignmentPunctuality = assignments.length > 0 ? (onTimeSubmissions / assignments.length) * 10 : 5;

    // Goal orientation (based on goal completion)
    const completedGoals = goals.filter(g => g.completed).length;
    const goalOrientation = goals.length > 0 ? (completedGoals / goals.length) * 10 : 5;

    // Engagement level (based on submission quality and frequency)
    const avgGrade = submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.length 
      : 0;
    const engagementLevel = Math.min(10, Math.max(1, (avgGrade / 10) + (submissions.length / assignments.length) * 5));

    return {
      studyConsistency: Math.round(studyConsistency),
      assignmentPunctuality: Math.round(assignmentPunctuality),
      goalOrientation: Math.round(goalOrientation),
      engagementLevel: Math.round(engagementLevel)
    };
  }

  /**
   * Generate predictions
   */
  private generatePredictions(academicPerformance: any, behavioralInsights: any, submissions: any[]): PerformanceMetrics['predictions'] {
    const currentGrade = academicPerformance.averageGrade;
    const trend = academicPerformance.gradeTrend;
    const consistency = behavioralInsights.studyConsistency;

    // Simple prediction algorithm
    let nextMonthGrade = currentGrade;
    if (trend === 'improving') nextMonthGrade += 5;
    else if (trend === 'declining') nextMonthGrade -= 5;

    // Graduation probability based on current performance and consistency
    const graduationProbability = Math.min(100, Math.max(0, 
      (currentGrade * 0.4) + (consistency * 6) + 20
    ));

    const riskFactors: string[] = [];
    const opportunities: string[] = [];

    if (currentGrade < 60) riskFactors.push('Düşük not ortalaması');
    if (consistency < 5) riskFactors.push('Düzensiz çalışma alışkanlığı');
    if (academicPerformance.completionRate < 70) riskFactors.push('Düşük ödev tamamlama oranı');

    if (trend === 'improving') opportunities.push('Pozitif performans trendi');
    if (consistency > 7) opportunities.push('Yüksek çalışma tutarlılığı');
    if (academicPerformance.completionRate > 85) opportunities.push('Yüksek ödev tamamlama oranı');

    return {
      nextMonthGrade: Math.round(Math.max(0, Math.min(100, nextMonthGrade))),
      graduationProbability: Math.round(graduationProbability),
      riskFactors,
      opportunities
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(academicPerformance: any, behavioralInsights: any, subjectAnalysis: any[]): PerformanceMetrics['recommendations'] {
    const recommendations: PerformanceMetrics['recommendations'] = [];

    // Academic recommendations
    if (academicPerformance.averageGrade < 60) {
      recommendations.push({
        priority: 'high',
        category: 'academic',
        title: 'Akademik Destek Gerekli',
        description: 'Not ortalamasını artırmak için ek ders desteği alınması önerilir.',
        expectedImpact: 8,
        timeframe: '2-4 hafta'
      });
    }

    if (academicPerformance.completionRate < 70) {
      recommendations.push({
        priority: 'high',
        category: 'academic',
        title: 'Ödev Takibi Artırılmalı',
        description: 'Ödev tamamlama oranını artırmak için düzenli takip yapılmalı.',
        expectedImpact: 7,
        timeframe: '1-2 hafta'
      });
    }

    // Behavioral recommendations
    if (behavioralInsights.studyConsistency < 5) {
      recommendations.push({
        priority: 'medium',
        category: 'behavioral',
        title: 'Çalışma Rutini Oluşturulmalı',
        description: 'Düzenli çalışma alışkanlığı geliştirmek için günlük rutin oluşturun.',
        expectedImpact: 6,
        timeframe: '3-4 hafta'
      });
    }

    if (behavioralInsights.engagementLevel < 6) {
      recommendations.push({
        priority: 'medium',
        category: 'motivational',
        title: 'Motivasyon Artırılmalı',
        description: 'Öğrenme motivasyonunu artırmak için ilgi çekici aktiviteler planlayın.',
        expectedImpact: 7,
        timeframe: '2-3 hafta'
      });
    }

    // Subject-specific recommendations
    const weakSubjects = subjectAnalysis.filter(s => s.averageGrade < 60);
    if (weakSubjects.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'academic',
        title: 'Zayıf Konulara Odaklanma',
        description: `${weakSubjects.map(s => s.subject).join(', ')} konularında ekstra çalışma yapılmalı.`,
        expectedImpact: 8,
        timeframe: '4-6 hafta'
      });
    }

    return recommendations;
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistency(dates: Date[]): number {
    if (dates.length < 2) return 5;

    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const intervals: number[] = [];

    for (let i = 1; i < sortedDates.length; i++) {
      const interval = (sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(interval);
    }

    if (intervals.length === 0) return 5;

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const consistency = Math.max(1, Math.min(10, 10 - (variance / 7)));

    return consistency;
  }

  /**
   * Generate subject-specific recommendations
   */
  private generateSubjectRecommendations(subject: string, averageGrade: number, trend: string): string[] {
    const recommendations: string[] = [];

    if (averageGrade < 60) {
      recommendations.push(`${subject} konusunda temel bilgileri tekrar edin`);
      recommendations.push(`${subject} için ek kaynaklar kullanın`);
    } else if (averageGrade < 80) {
      recommendations.push(`${subject} konusunda pratik yapmaya devam edin`);
    } else {
      recommendations.push(`${subject} konusunda başarılısınız, diğer konulara odaklanabilirsiniz`);
    }

    if (trend === 'declining') {
      recommendations.push(`${subject} konusunda performans düşüyor, dikkat edin`);
    }

    return recommendations;
  }

  /**
   * Calculate class overall performance
   */
  private calculateClassOverallPerformance(assignments: any[], submissions: any[]): ClassAnalytics['overallPerformance'] {
    const totalAssignments = assignments.length;
    const submittedAssignments = submissions.filter(s => s.status === 'submitted').length;
    const averageGrade = submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.length 
      : 0;

    const completionRate = totalAssignments > 0 ? (submittedAssignments / totalAssignments) * 100 : 0;
    const engagementScore = Math.min(10, (averageGrade / 10) + (completionRate / 10));

    return {
      averageGrade: Math.round(averageGrade),
      completionRate: Math.round(completionRate),
      engagementScore: Math.round(engagementScore)
    };
  }

  /**
   * Calculate student rankings
   */
  private calculateStudentRankings(students: any[], submissions: any[]): ClassAnalytics['studentRankings'] {
    const studentScores: { [key: string]: { name: string, score: number, grades: number[] } } = {};

    students.forEach(student => {
      studentScores[student._id.toString()] = {
        name: `${student.firstName} ${student.lastName}`,
        score: 0,
        grades: []
      };
    });

    submissions.forEach(submission => {
      if (studentScores[submission.studentId] && submission.grade !== undefined) {
        studentScores[submission.studentId].grades.push(submission.grade);
      }
    });

    const rankings = Object.entries(studentScores).map(([studentId, data]) => {
      const avgGrade = data.grades.length > 0 
        ? data.grades.reduce((sum, grade) => sum + grade, 0) / data.grades.length 
        : 0;
      
      return {
        studentId,
        studentName: data.name,
        rank: 0, // Will be set after sorting
        score: Math.round(avgGrade),
        trend: 'stable' as const // Would be calculated based on recent vs older performance
      };
    });

    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return rankings;
  }

  /**
   * Analyze class subjects
   */
  private analyzeClassSubjects(assignments: any[], submissions: any[]): ClassAnalytics['subjectBreakdown'] {
    const subjectStats: { [key: string]: { grades: number[], assignments: number } } = {};

    assignments.forEach(assignment => {
      const subject = assignment.subject || 'Genel';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { grades: [], assignments: 0 };
      }
      subjectStats[subject].assignments++;
    });

    submissions.forEach(submission => {
      const subject = submission.subject || 'Genel';
      if (subjectStats[subject] && submission.grade !== undefined) {
        subjectStats[subject].grades.push(submission.grade);
      }
    });

    return Object.entries(subjectStats).map(([subject, stats]) => {
      const averageGrade = stats.grades.length > 0 
        ? stats.grades.reduce((sum, grade) => sum + grade, 0) / stats.grades.length 
        : 0;

      const difficulty = averageGrade >= 80 ? 'easy' : averageGrade >= 60 ? 'medium' : 'hard';

      const studentPerformance = {
        excellent: stats.grades.filter(g => g >= 90).length,
        good: stats.grades.filter(g => g >= 70 && g < 90).length,
        average: stats.grades.filter(g => g >= 50 && g < 70).length,
        belowAverage: stats.grades.filter(g => g < 50).length
      };

      return {
        subject,
        averageGrade: Math.round(averageGrade),
        difficulty,
        studentPerformance
      };
    });
  }

  /**
   * Generate class insights
   */
  private generateClassInsights(rankings: any[], subjectBreakdown: any[]): ClassAnalytics['insights'] {
    const topPerformers = rankings.slice(0, 3).map(r => r.studentName);
    const strugglingStudents = rankings.slice(-3).map(r => r.studentName);
    
    const improvementAreas = subjectBreakdown
      .filter(s => s.averageGrade < 70)
      .map(s => s.subject);

    const strengths = subjectBreakdown
      .filter(s => s.averageGrade >= 80)
      .map(s => s.subject);

    return {
      topPerformers,
      strugglingStudents,
      improvementAreas,
      strengths
    };
  }

  /**
   * Calculate teaching effectiveness
   */
  private calculateTeachingEffectiveness(assignments: any[], submissions: any[], students: any[]): TeacherAnalytics['teachingEffectiveness'] {
    const totalAssignments = assignments.length;
    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter(s => s.grade !== undefined).length;

    const assignmentQuality = Math.min(10, (totalAssignments / students.length) * 2);
    const feedbackTimeliness = totalSubmissions > 0 ? (gradedSubmissions / totalSubmissions) * 10 : 5;
    const engagementLevel = students.length > 0 ? (totalSubmissions / (totalAssignments * students.length)) * 10 : 5;

    const overallScore = (assignmentQuality + feedbackTimeliness + engagementLevel) / 3;
    const studentSatisfaction = Math.min(10, overallScore + 2); // Simplified

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      studentSatisfaction: Math.round(studentSatisfaction * 10) / 10,
      assignmentQuality: Math.round(assignmentQuality * 10) / 10,
      feedbackTimeliness: Math.round(feedbackTimeliness * 10) / 10,
      engagementLevel: Math.round(engagementLevel * 10) / 10
    };
  }

  /**
   * Calculate student outcomes
   */
  private calculateStudentOutcomes(students: any[], submissions: any[]): TeacherAnalytics['studentOutcomes'] {
    const totalStudents = students.length;
    
    // Calculate average grades per student
    const studentGrades: { [key: string]: number[] } = {};
    submissions.forEach(submission => {
      if (submission.grade !== undefined) {
        if (!studentGrades[submission.studentId]) {
          studentGrades[submission.studentId] = [];
        }
        studentGrades[submission.studentId].push(submission.grade);
      }
    });

    let highPerformers = 0;
    let averagePerformers = 0;
    let strugglingStudents = 0;

    Object.values(studentGrades).forEach(grades => {
      const avgGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      if (avgGrade >= 80) highPerformers++;
      else if (avgGrade >= 60) averagePerformers++;
      else strugglingStudents++;
    });

    const improvementRate = totalStudents > 0 ? ((highPerformers + averagePerformers) / totalStudents) * 100 : 0;

    return {
      totalStudents,
      highPerformers,
      averagePerformers,
      strugglingStudents,
      improvementRate: Math.round(improvementRate)
    };
  }

  /**
   * Analyze workload
   */
  private analyzeWorkload(assignments: any[], submissions: any[]): TeacherAnalytics['workloadAnalysis'] {
    const totalAssignments = assignments.length;
    const pendingGradings = submissions.filter(s => s.status === 'submitted' && s.grade === undefined).length;
    
    // Simplified calculation - in reality would track actual grading time
    const averageGradingTime = totalAssignments > 0 ? (totalAssignments * 0.5) : 0;
    
    const workloadScore = Math.max(1, Math.min(10, 10 - (pendingGradings / totalAssignments) * 5));

    return {
      totalAssignments,
      averageGradingTime,
      pendingGradings,
      workloadScore: Math.round(workloadScore * 10) / 10
    };
  }

  /**
   * Generate teacher recommendations
   */
  private generateTeacherRecommendations(effectiveness: any, outcomes: any, workload: any): TeacherAnalytics['recommendations'] {
    const recommendations: TeacherAnalytics['recommendations'] = [];

    if (effectiveness.feedbackTimeliness < 7) {
      recommendations.push({
        priority: 'high',
        category: 'assessment',
        title: 'Geri Bildirim Hızını Artırın',
        description: 'Ödev değerlendirme süresini kısaltarak öğrenci memnuniyetini artırın.',
        expectedImpact: 8
      });
    }

    if (workload.pendingGradings > 10) {
      recommendations.push({
        priority: 'high',
        category: 'workload',
        title: 'Bekleyen Değerlendirmeleri Tamamlayın',
        description: 'Bekleyen değerlendirmeleri öncelik sırasına göre tamamlayın.',
        expectedImpact: 7
      });
    }

    if (outcomes.strugglingStudents > outcomes.totalStudents * 0.3) {
      recommendations.push({
        priority: 'medium',
        category: 'teaching',
        title: 'Zayıf Öğrencilere Ek Destek Sağlayın',
        description: 'Struggling öğrenciler için ek ders veya bireysel destek planlayın.',
        expectedImpact: 8
      });
    }

    if (effectiveness.engagementLevel < 6) {
      recommendations.push({
        priority: 'medium',
        category: 'engagement',
        title: 'Öğrenci Katılımını Artırın',
        description: 'Daha interaktif öğretim yöntemleri kullanarak katılımı artırın.',
        expectedImpact: 6
      });
    }

    return recommendations;
  }
}
