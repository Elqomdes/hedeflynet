import { User, Assignment, Goal, AssignmentSubmission } from '@/lib/models';

export interface AIRecommendation {
  id: string;
  type: 'study_plan' | 'assignment_focus' | 'goal_adjustment' | 'motivation' | 'skill_development';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  estimatedImpact: number; // 1-10 scale
  category: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface StudentProfile {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  strengths: string[];
  weaknesses: string[];
  interests: string[];
  motivationLevel: number; // 1-10 scale
  studyHabits: {
    preferredTime: string;
    sessionLength: number;
    breakFrequency: number;
  };
  performancePatterns: {
    bestSubjects: string[];
    challengingSubjects: string[];
    improvementAreas: string[];
  };
}

export interface AICoachingData {
  studentId: string;
  assignments: any[];
  submissions: any[];
  goals: any[];
  performanceHistory: {
    subject: string;
    averageScore: number;
    trend: 'improving' | 'stable' | 'declining';
    lastUpdated: Date;
  }[];
  studyTime: {
    totalHours: number;
    weeklyAverage: number;
    consistency: number; // 1-10 scale
  };
}

export class AICoachingService {
  private static instance: AICoachingService;

  public static getInstance(): AICoachingService {
    if (!AICoachingService.instance) {
      AICoachingService.instance = new AICoachingService();
    }
    return AICoachingService.instance;
  }

  /**
   * Analyze student performance and generate personalized recommendations
   */
  async generateRecommendations(data: AICoachingData): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    
    // Analyze performance patterns
    const performanceAnalysis = this.analyzePerformance(data);
    
    // Generate study plan recommendations
    if (performanceAnalysis.needsStudyPlan) {
      recommendations.push(this.createStudyPlanRecommendation(data));
    }
    
    // Generate assignment focus recommendations
    if (performanceAnalysis.needsAssignmentFocus) {
      recommendations.push(this.createAssignmentFocusRecommendation(data));
    }
    
    // Generate goal adjustment recommendations
    if (performanceAnalysis.needsGoalAdjustment) {
      recommendations.push(this.createGoalAdjustmentRecommendation(data));
    }
    
    // Generate motivation recommendations
    if (performanceAnalysis.needsMotivation) {
      recommendations.push(this.createMotivationRecommendation(data));
    }
    
    // Generate skill development recommendations
    if (performanceAnalysis.needsSkillDevelopment) {
      recommendations.push(this.createSkillDevelopmentRecommendation(data));
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Analyze student performance patterns
   */
  private analyzePerformance(data: AICoachingData): {
    needsStudyPlan: boolean;
    needsAssignmentFocus: boolean;
    needsGoalAdjustment: boolean;
    needsMotivation: boolean;
    needsSkillDevelopment: boolean;
  } {
    const avgScore = this.calculateAverageScore(data.submissions);
    const completionRate = this.calculateCompletionRate(data.assignments, data.submissions);
    const goalProgress = this.calculateGoalProgress(data.goals);
    
    return {
      needsStudyPlan: avgScore < 70 || completionRate < 0.8,
      needsAssignmentFocus: data.submissions.some(s => s.status === 'submitted' && !s.grade),
      needsGoalAdjustment: goalProgress < 0.5,
      needsMotivation: completionRate < 0.6 || avgScore < 60,
      needsSkillDevelopment: data.performanceHistory.some(p => p.trend === 'declining')
    };
  }

  /**
   * Create study plan recommendation
   */
  private createStudyPlanRecommendation(data: AICoachingData): AIRecommendation {
    const weakSubjects = data.performanceHistory
      .filter(p => p.averageScore < 70)
      .map(p => p.subject);
    
    return {
      id: `study_plan_${Date.now()}`,
      type: 'study_plan',
      title: 'Kişiselleştirilmiş Çalışma Planı',
      description: `Performansınızı artırmak için ${weakSubjects.join(', ')} konularında daha fazla zaman ayırmanızı öneriyoruz. Günlük 2 saat çalışma planı oluşturalım.`,
      priority: 'high',
      actionRequired: true,
      estimatedImpact: 8,
      category: 'Çalışma Planı',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }

  /**
   * Create assignment focus recommendation
   */
  private createAssignmentFocusRecommendation(data: AICoachingData): AIRecommendation {
    const pendingAssignments = data.assignments.filter(a => 
      data.submissions.some(s => s.assignmentId.toString() === a._id.toString() && s.status === 'submitted' && !s.grade)
    );
    
    return {
      id: `assignment_focus_${Date.now()}`,
      type: 'assignment_focus',
      title: 'Ödev Odaklı Çalışma',
      description: `${pendingAssignments.length} ödeviniz değerlendirme bekliyor. Bu ödevler üzerinde çalışarak notlarınızı yükseltebilirsiniz.`,
      priority: 'medium',
      actionRequired: true,
      estimatedImpact: 6,
      category: 'Ödev Yönetimi',
      createdAt: new Date()
    };
  }

  /**
   * Create goal adjustment recommendation
   */
  private createGoalAdjustmentRecommendation(data: AICoachingData): AIRecommendation {
    const incompleteGoals = data.goals.filter(g => !g.completed);
    
    return {
      id: `goal_adjustment_${Date.now()}`,
      type: 'goal_adjustment',
      title: 'Hedef Revizyonu',
      description: `${incompleteGoals.length} hedefiniz tamamlanmadı. Hedeflerinizi daha gerçekçi hale getirerek motivasyonunuzu artıralım.`,
      priority: 'medium',
      actionRequired: true,
      estimatedImpact: 7,
      category: 'Hedef Yönetimi',
      createdAt: new Date()
    };
  }

  /**
   * Create motivation recommendation
   */
  private createMotivationRecommendation(data: AICoachingData): AIRecommendation {
    return {
      id: `motivation_${Date.now()}`,
      type: 'motivation',
      title: 'Motivasyon Artırma',
      description: 'Performansınızı artırmak için küçük hedefler belirleyerek ilerleme kaydedin. Her başarıda kendinizi ödüllendirin!',
      priority: 'high',
      actionRequired: false,
      estimatedImpact: 9,
      category: 'Motivasyon',
      createdAt: new Date()
    };
  }

  /**
   * Create skill development recommendation
   */
  private createSkillDevelopmentRecommendation(data: AICoachingData): AIRecommendation {
    const decliningSubjects = data.performanceHistory
      .filter(p => p.trend === 'declining')
      .map(p => p.subject);
    
    return {
      id: `skill_development_${Date.now()}`,
      type: 'skill_development',
      title: 'Beceri Geliştirme',
      description: `${decliningSubjects.join(', ')} konularında ekstra çalışma yaparak becerilerinizi geliştirin.`,
      priority: 'high',
      actionRequired: true,
      estimatedImpact: 8,
      category: 'Beceri Geliştirme',
      createdAt: new Date()
    };
  }

  /**
   * Calculate average score from submissions
   */
  private calculateAverageScore(submissions: any[]): number {
    const gradedSubmissions = submissions.filter(s => s.grade !== undefined);
    if (gradedSubmissions.length === 0) return 0;
    
    const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
    return totalScore / gradedSubmissions.length;
  }

  /**
   * Calculate assignment completion rate
   */
  private calculateCompletionRate(assignments: any[], submissions: any[]): number {
    if (assignments.length === 0) return 0;
    
    const completedAssignments = assignments.filter(a => 
      submissions.some(s => s.assignmentId.toString() === a._id.toString() && s.status === 'submitted')
    );
    
    return completedAssignments.length / assignments.length;
  }

  /**
   * Calculate goal progress
   */
  private calculateGoalProgress(goals: any[]): number {
    if (goals.length === 0) return 0;
    
    const completedGoals = goals.filter(g => g.status === 'completed');
    return completedGoals.length / goals.length;
  }

  /**
   * Generate personalized study schedule
   */
  async generateStudySchedule(data: AICoachingData): Promise<{
    dailySchedule: {
      time: string;
      subject: string;
      duration: number;
      activity: string;
    }[];
    weeklyGoals: string[];
    tips: string[];
  }> {
    const weakSubjects = data.performanceHistory
      .filter(p => p.averageScore < 70)
      .map(p => p.subject);
    
    const dailySchedule = [
      {
        time: '09:00-10:00',
        subject: weakSubjects[0] || 'Matematik',
        duration: 60,
        activity: 'Konu tekrarı ve problem çözme'
      },
      {
        time: '14:00-15:00',
        subject: weakSubjects[1] || 'Fen Bilimleri',
        duration: 60,
        activity: 'Deney ve gözlem çalışması'
      },
      {
        time: '19:00-20:00',
        subject: 'Genel Tekrar',
        duration: 60,
        activity: 'Günlük ödevler ve tekrar'
      }
    ];

    const weeklyGoals = [
      'Haftalık hedeflerin %80\'ini tamamla',
      'En az 3 farklı konuda çalış',
      'Günlük 2 saat düzenli çalışma yap'
    ];

    const tips = [
      'Çalışma sırasında 25 dakika çalış, 5 dakika mola ver',
      'Zor konuları sabah saatlerinde çalış',
      'Her gün aynı saatte çalışmaya başla',
      'Çalışma sonrası kendini ödüllendir'
    ];

    return {
      dailySchedule,
      weeklyGoals,
      tips
    };
  }

  /**
   * Predict student success probability
   */
  async predictSuccess(data: AICoachingData): Promise<{
    successProbability: number;
    keyFactors: string[];
    recommendations: string[];
  }> {
    const avgScore = this.calculateAverageScore(data.submissions);
    const completionRate = this.calculateCompletionRate(data.assignments, data.submissions);
    const studyConsistency = data.studyTime.consistency;
    
    // Simple prediction algorithm (can be enhanced with ML)
    let successProbability = 0;
    const keyFactors: string[] = [];
    const recommendations: string[] = [];
    
    if (avgScore >= 80) {
      successProbability += 30;
      keyFactors.push('Yüksek not ortalaması');
    } else if (avgScore >= 60) {
      successProbability += 20;
      keyFactors.push('Orta seviye not ortalaması');
      recommendations.push('Not ortalamasını artırmak için daha fazla çalışın');
    } else {
      successProbability += 10;
      keyFactors.push('Düşük not ortalaması');
      recommendations.push('Temel konuları tekrar edin ve öğretmeninizden yardım alın');
    }
    
    if (completionRate >= 0.8) {
      successProbability += 25;
      keyFactors.push('Yüksek ödev tamamlama oranı');
    } else if (completionRate >= 0.6) {
      successProbability += 15;
      keyFactors.push('Orta seviye ödev tamamlama oranı');
      recommendations.push('Ödevlerinizi zamanında teslim etmeye odaklanın');
    } else {
      successProbability += 5;
      keyFactors.push('Düşük ödev tamamlama oranı');
      recommendations.push('Ödev takvimini düzenleyin ve öncelik sırası belirleyin');
    }
    
    if (studyConsistency >= 7) {
      successProbability += 25;
      keyFactors.push('Düzenli çalışma alışkanlığı');
    } else if (studyConsistency >= 5) {
      successProbability += 15;
      keyFactors.push('Orta seviye çalışma düzeni');
      recommendations.push('Çalışma rutininizi daha düzenli hale getirin');
    } else {
      successProbability += 5;
      keyFactors.push('Düzensiz çalışma alışkanlığı');
      recommendations.push('Günlük çalışma planı oluşturun ve buna uyun');
    }
    
    if (data.goals.length > 0) {
      const goalProgress = this.calculateGoalProgress(data.goals);
      if (goalProgress >= 0.7) {
        successProbability += 20;
        keyFactors.push('Hedef odaklı yaklaşım');
      } else {
        successProbability += 10;
        keyFactors.push('Hedef belirleme ihtiyacı');
        recommendations.push('Daha gerçekçi ve ölçülebilir hedefler belirleyin');
      }
    }
    
    return {
      successProbability: Math.min(successProbability, 100),
      keyFactors,
      recommendations
    };
  }
}
