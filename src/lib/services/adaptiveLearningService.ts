import { 
  LearningPath, 
  LearningModule, 
  StudentLearningProfile, 
  AdaptiveRecommendation, 
  AdaptiveAssessment,
  ILearningPath,
  ILearningModule,
  IStudentLearningProfile,
  IAdaptiveRecommendation,
  IAdaptiveAssessment
} from '@/lib/models/AdaptiveLearning';
import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export interface AdaptiveLearningDashboard {
  studentProfile: {
    learningStyle: {
      visual: number;
      auditory: number;
      kinesthetic: number;
      reading: number;
    };
    cognitiveAbilities: {
      memory: number;
      attention: number;
      processingSpeed: number;
      reasoning: number;
    };
    performanceMetrics: {
      averageScore: number;
      completionRate: number;
      timeEfficiency: number;
      improvementRate: number;
      consistency: number;
    };
  };
  recommendations: {
    id: string;
    type: 'module' | 'path' | 'practice' | 'review' | 'challenge';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    confidence: number;
    estimatedTime: number;
    difficulty: number;
    subject: string;
    isAccepted: boolean;
  }[];
  learningPaths: {
    id: string;
    title: string;
    description: string;
    subject: string;
    level: string;
    progress: number;
    estimatedTime: number;
    difficulty: number;
    isActive: boolean;
  }[];
  recentModules: {
    id: string;
    title: string;
    subject: string;
    type: string;
    completedAt: Date;
    score: number;
    timeSpent: number;
  }[];
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
}

export interface LearningPathData {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  difficulty: number;
  prerequisites: string[];
  learningObjectives: {
    objective: string;
    description: string;
    isRequired: boolean;
  }[];
  modules: {
    id: string;
    title: string;
    order: number;
    isRequired: boolean;
    estimatedTime: number;
    completed: boolean;
    score?: number;
  }[];
  progress: number;
  isActive: boolean;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface LearningModuleData {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  type: 'video' | 'reading' | 'interactive' | 'quiz' | 'assignment' | 'project';
  content: {
    text?: string;
    videoUrl?: string;
    audioUrl?: string;
    imageUrl?: string;
    interactiveContent?: any;
    attachments?: {
      name: string;
      url: string;
      type: string;
    }[];
  };
  learningObjectives: string[];
  prerequisites: string[];
  estimatedTime: number;
  difficulty: number;
  tags: string[];
  isAdaptive: boolean;
  assessment: {
    questions: {
      id: string;
      question: string;
      type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay';
      options?: string[];
      points: number;
      difficulty: number;
    }[];
    passingScore: number;
    timeLimit?: number;
    attempts: number;
  };
  isActive: boolean;
  createdBy: {
    id: string;
    name: string;
  };
}

export class AdaptiveLearningService {
  private static instance: AdaptiveLearningService;

  public static getInstance(): AdaptiveLearningService {
    if (!AdaptiveLearningService.instance) {
      AdaptiveLearningService.instance = new AdaptiveLearningService();
    }
    return AdaptiveLearningService.instance;
  }

  /**
   * Get adaptive learning dashboard for a student
   */
  async getStudentDashboard(studentId: string): Promise<AdaptiveLearningDashboard> {
    await connectDB();

    // Get or create student learning profile
    let profile = await StudentLearningProfile.findOne({ studentId });
    if (!profile) {
      profile = await this.createStudentProfile(studentId);
    }

    // Get recommendations
    const recommendations = await AdaptiveRecommendation.find({ 
      studentId, 
      isCompleted: false 
    }).sort({ priority: 1, confidence: -1 }).limit(10);

    // Get learning paths
    const learningPaths = await LearningPath.find({ isActive: true })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent modules
    const recentModules = await this.getRecentModules(studentId);

    // Analyze strengths and weaknesses
    const strengths = this.analyzeStrengths(profile);
    const weaknesses = this.analyzeWeaknesses(profile);
    const nextSteps = this.generateNextSteps(profile, recommendations);

    return {
      studentProfile: {
        learningStyle: profile.learningStyle,
        cognitiveAbilities: profile.cognitiveAbilities,
        performanceMetrics: profile.performanceMetrics
      },
      recommendations: recommendations.map(rec => ({
        id: rec._id.toString(),
        type: rec.type,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        confidence: rec.confidence,
        estimatedTime: rec.estimatedTime,
        difficulty: rec.difficulty,
        subject: rec.subject,
        isAccepted: rec.isAccepted
      })),
      learningPaths: learningPaths.map(path => ({
        id: path._id.toString(),
        title: path.title,
        description: path.description,
        subject: path.subject,
        level: path.level,
        progress: 0, // Would be calculated based on completed modules
        estimatedTime: path.estimatedDuration,
        difficulty: path.difficulty,
        isActive: path.isActive
      })),
      recentModules,
      strengths,
      weaknesses,
      nextSteps
    };
  }

  /**
   * Create student learning profile
   */
  async createStudentProfile(studentId: string): Promise<IStudentLearningProfile> {
    await connectDB();

    const profile = await StudentLearningProfile.create({
      studentId: studentId as any,
      learningStyle: {
        visual: 25,
        auditory: 25,
        kinesthetic: 25,
        reading: 25
      },
      cognitiveAbilities: {
        memory: 5,
        attention: 5,
        processingSpeed: 5,
        reasoning: 5
      },
      subjectPreferences: [],
      learningHistory: [],
      adaptiveSettings: {
        preferredPace: 'normal',
        preferredDifficulty: 'medium',
        preferredContentType: 'mixed',
        reminderFrequency: 'weekly'
      },
      performanceMetrics: {
        averageScore: 0,
        completionRate: 0,
        timeEfficiency: 0,
        improvementRate: 0,
        consistency: 5
      }
    });

    return profile;
  }

  /**
   * Update student learning profile based on performance
   */
  async updateStudentProfile(studentId: string, performanceData: {
    moduleId: string;
    score: number;
    timeSpent: number;
    attempts: number;
    difficulty: number;
  }): Promise<void> {
    await connectDB();

    const profile = await StudentLearningProfile.findOne({ studentId });
    if (!profile) return;

    // Add to learning history
    profile.learningHistory.push({
      moduleId: performanceData.moduleId as any,
      completedAt: new Date(),
      score: performanceData.score,
      timeSpent: performanceData.timeSpent,
      attempts: performanceData.attempts,
      difficulty: performanceData.difficulty
    });

    // Update performance metrics
    this.updatePerformanceMetrics(profile);

    // Update learning style based on performance
    this.updateLearningStyle(profile, performanceData);

    // Update cognitive abilities
    this.updateCognitiveAbilities(profile, performanceData);

    profile.lastUpdated = new Date();
    await profile.save();

    // Generate new recommendations
    await this.generateRecommendations(studentId);
  }

  /**
   * Get personalized learning path
   */
  async getPersonalizedLearningPath(studentId: string, subject: string): Promise<LearningPathData[]> {
    await connectDB();

    const profile = await StudentLearningProfile.findOne({ studentId });
    if (!profile) return [];

    const learningPaths = await LearningPath.find({
      subject,
      isActive: true,
      level: this.getRecommendedLevel(profile)
    }).populate('createdBy', 'firstName lastName');

    return learningPaths.map(path => this.formatLearningPathData(path, studentId));
  }

  /**
   * Get adaptive learning module
   */
  async getAdaptiveModule(studentId: string, moduleId: string): Promise<LearningModuleData | null> {
    await connectDB();

    const learningModule = await LearningModule.findById(moduleId)
      .populate('createdBy', 'firstName lastName');

    if (!learningModule) return null;

    // Apply adaptive rules if module is adaptive
    if (learningModule.isAdaptive) {
      await this.applyAdaptiveRules(learningModule, studentId);
    }

    return this.formatLearningModuleData(learningModule);
  }

  /**
   * Take adaptive assessment
   */
  async takeAdaptiveAssessment(studentId: string, moduleId: string): Promise<{
    assessment: IAdaptiveAssessment;
    nextQuestion?: any;
    isComplete: boolean;
  }> {
    await connectDB();

    const learningModule = await LearningModule.findById(moduleId);
    if (!learningModule || !learningModule.assessment.questions.length) {
      throw new Error('Assessment not found');
    }

    // Get or create assessment
    let assessment = await AdaptiveAssessment.findOne({
      studentId,
      moduleId,
      isCompleted: false
    });

    if (!assessment) {
      assessment = await this.createAdaptiveAssessment(studentId, moduleId);
    }

    // Get next question based on adaptive algorithm
    const nextQuestion = this.getNextQuestion(assessment, module);

    const isComplete = assessment.adaptiveAlgorithm.questionsShown >= assessment.adaptiveAlgorithm.totalQuestions;

    return {
      assessment,
      nextQuestion,
      isComplete
    };
  }

  /**
   * Submit assessment answer
   */
  async submitAssessmentAnswer(assessmentId: string, questionId: string, answer: string | string[], confidence: number): Promise<{
    isCorrect: boolean;
    explanation: string;
    nextQuestion?: any;
    isComplete: boolean;
  }> {
    await connectDB();

    const assessment = await AdaptiveAssessment.findById(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const question = assessment.questions.find((q: any) => q.questionId === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const isCorrect = this.checkAnswer(question, answer);
    const timeSpent = 0; // Would be calculated based on actual time

    // Add student answer
    assessment.studentAnswers.push({
      questionId,
      answer,
      timeSpent,
      isCorrect,
      confidence
    });

    // Update adaptive algorithm
    this.updateAdaptiveAlgorithm(assessment, isCorrect, question.difficulty);

    // Check if assessment is complete
    const isComplete = assessment.adaptiveAlgorithm.questionsShown >= assessment.adaptiveAlgorithm.totalQuestions;

    if (isComplete) {
      assessment.isCompleted = true;
      assessment.completedAt = new Date();
      this.calculateAssessmentResults(assessment);
    }

    await assessment.save();

    // Get next question if not complete
    let nextQuestion = null;
    if (!isComplete) {
      const learningModule = await LearningModule.findById(assessment.moduleId);
      if (learningModule) {
        nextQuestion = this.getNextQuestion(assessment, learningModule);
      }
    }

    return {
      isCorrect,
      explanation: question.explanation,
      nextQuestion,
      isComplete
    };
  }

  /**
   * Accept recommendation
   */
  async acceptRecommendation(recommendationId: string): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const recommendation = await AdaptiveRecommendation.findById(recommendationId);
    if (!recommendation) {
      return { success: false, message: 'Recommendation not found' };
    }

    recommendation.isAccepted = true;
    recommendation.acceptedAt = new Date();
    await recommendation.save();

    return { success: true, message: 'Recommendation accepted' };
  }

  /**
   * Get recent modules for student
   */
  private async getRecentModules(studentId: string): Promise<AdaptiveLearningDashboard['recentModules']> {
    const profile = await StudentLearningProfile.findOne({ studentId });
    if (!profile) return [];

    const recentHistory = profile.learningHistory
      .sort((a: any, b: any) => b.completedAt.getTime() - a.completedAt.getTime())
      .slice(0, 5);

    const moduleIds = recentHistory.map((h: any) => h.moduleId);
    const modules = await LearningModule.find({ _id: { $in: moduleIds } });

    return recentHistory.map((history: any) => {
      const learningModule = modules.find(m => m._id.toString() === history.moduleId.toString());
      return {
        id: history.moduleId.toString(),
        title: learningModule?.title || 'Unknown Module',
        subject: learningModule?.subject || 'Unknown',
        type: learningModule?.type || 'unknown',
        completedAt: history.completedAt,
        score: history.score,
        timeSpent: history.timeSpent
      };
    });
  }

  /**
   * Analyze student strengths
   */
  private analyzeStrengths(profile: IStudentLearningProfile): string[] {
    const strengths: string[] = [];

    if (profile.performanceMetrics.averageScore >= 80) {
      strengths.push('High academic performance');
    }

    if (profile.performanceMetrics.completionRate >= 85) {
      strengths.push('Excellent completion rate');
    }

    if (profile.performanceMetrics.consistency >= 8) {
      strengths.push('Consistent learning habits');
    }

    if (profile.cognitiveAbilities.memory >= 8) {
      strengths.push('Strong memory skills');
    }

    if (profile.cognitiveAbilities.reasoning >= 8) {
      strengths.push('Strong reasoning abilities');
    }

    return strengths;
  }

  /**
   * Analyze student weaknesses
   */
  private analyzeWeaknesses(profile: IStudentLearningProfile): string[] {
    const weaknesses: string[] = [];

    if (profile.performanceMetrics.averageScore < 60) {
      weaknesses.push('Low academic performance');
    }

    if (profile.performanceMetrics.completionRate < 70) {
      weaknesses.push('Low completion rate');
    }

    if (profile.performanceMetrics.consistency < 5) {
      weaknesses.push('Inconsistent learning habits');
    }

    if (profile.cognitiveAbilities.attention < 5) {
      weaknesses.push('Attention difficulties');
    }

    if (profile.cognitiveAbilities.processingSpeed < 5) {
      weaknesses.push('Slow processing speed');
    }

    return weaknesses;
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(profile: IStudentLearningProfile, recommendations: IAdaptiveRecommendation[]): string[] {
    const nextSteps: string[] = [];

    if (recommendations.length > 0) {
      nextSteps.push('Review and accept recommended learning content');
    }

    if (profile.performanceMetrics.averageScore < 70) {
      nextSteps.push('Focus on foundational concepts');
    }

    if (profile.performanceMetrics.completionRate < 80) {
      nextSteps.push('Improve study consistency');
    }

    if (profile.learningHistory.length < 5) {
      nextSteps.push('Complete more learning modules');
    }

    return nextSteps;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(profile: IStudentLearningProfile): void {
    const history = profile.learningHistory;
    if (history.length === 0) return;

    const totalScore = history.reduce((sum, h) => sum + h.score, 0);
    const completedModules = history.length;
    const totalTime = history.reduce((sum, h) => sum + h.timeSpent, 0);

    profile.performanceMetrics.averageScore = Math.round(totalScore / completedModules);
    profile.performanceMetrics.completionRate = Math.min(100, completedModules * 10); // Simplified
    profile.performanceMetrics.timeEfficiency = totalTime > 0 ? totalScore / totalTime : 0;

    // Calculate improvement rate
    if (history.length >= 5) {
      const recent = history.slice(-5);
      const older = history.slice(-10, -5);
      const recentAvg = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
      const olderAvg = older.reduce((sum, h) => sum + h.score, 0) / older.length;
      profile.performanceMetrics.improvementRate = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
    }

    // Calculate consistency
    const scores = history.map(h => h.score);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    profile.performanceMetrics.consistency = Math.max(1, Math.min(10, 10 - (variance / 100)));
  }

  /**
   * Update learning style based on performance
   */
  private updateLearningStyle(profile: IStudentLearningProfile, performanceData: any): void {
    // This is a simplified implementation
    // In reality, this would be based on detailed analysis of how the student performed
    // with different types of content (video, text, interactive, etc.)
  }

  /**
   * Update cognitive abilities
   */
  private updateCognitiveAbilities(profile: IStudentLearningProfile, performanceData: any): void {
    // This is a simplified implementation
    // In reality, this would be based on detailed analysis of student performance patterns
  }

  /**
   * Get recommended level for student
   */
  private getRecommendedLevel(profile: IStudentLearningProfile): 'beginner' | 'intermediate' | 'advanced' {
    const avgScore = profile.performanceMetrics.averageScore;
    
    if (avgScore >= 80) return 'advanced';
    if (avgScore >= 60) return 'intermediate';
    return 'beginner';
  }

  /**
   * Format learning path data
   */
  private formatLearningPathData(path: any, studentId: string): LearningPathData {
    return {
      id: path._id.toString(),
      title: path.title,
      description: path.description,
      subject: path.subject,
      level: path.level,
      estimatedDuration: path.estimatedDuration,
      difficulty: path.difficulty,
      prerequisites: path.prerequisites.map((p: any) => p.toString()),
      learningObjectives: path.learningObjectives,
      modules: path.modules.map((m: any) => ({
        id: m.moduleId.toString(),
        title: 'Module Title', // Would be populated from module data
        order: m.order,
        isRequired: m.isRequired,
        estimatedTime: m.estimatedTime,
        completed: false, // Would be calculated based on student progress
        score: undefined
      })),
      progress: 0, // Would be calculated based on completed modules
      isActive: path.isActive,
      createdBy: {
        id: path.createdBy._id.toString(),
        name: `${path.createdBy.firstName} ${path.createdBy.lastName}`
      }
    };
  }

  /**
   * Format learning module data
   */
  private formatLearningModuleData(learningModule: any): LearningModuleData {
    return {
      id: learningModule._id.toString(),
      title: learningModule.title,
      description: learningModule.description,
      subject: learningModule.subject,
      level: learningModule.level,
      type: learningModule.type,
      content: learningModule.content,
      learningObjectives: learningModule.learningObjectives,
      prerequisites: learningModule.prerequisites.map((p: any) => p.toString()),
      estimatedTime: learningModule.estimatedTime,
      difficulty: learningModule.difficulty,
      tags: learningModule.tags,
      isAdaptive: learningModule.isAdaptive,
      assessment: {
        questions: learningModule.assessment.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
          points: q.points,
          difficulty: q.difficulty
        })),
        passingScore: learningModule.assessment.passingScore,
        timeLimit: learningModule.assessment.timeLimit,
        attempts: learningModule.assessment.attempts
      },
      isActive: learningModule.isActive,
      createdBy: {
        id: learningModule.createdBy._id.toString(),
        name: `${learningModule.createdBy.firstName} ${learningModule.createdBy.lastName}`
      }
    };
  }

  /**
   * Apply adaptive rules to module
   */
  private async applyAdaptiveRules(learningModule: ILearningModule, studentId: string): Promise<void> {
    // This would implement the adaptive rules based on student profile
    // For now, it's a placeholder
  }

  /**
   * Create adaptive assessment
   */
  private async createAdaptiveAssessment(studentId: string, moduleId: string): Promise<IAdaptiveAssessment> {
    const learningModule = await LearningModule.findById(moduleId);
    if (!learningModule) {
      throw new Error('Module not found');
    }

    const assessment = await AdaptiveAssessment.create({
      studentId: studentId as any,
      moduleId: moduleId as any,
      type: 'adaptive',
      questions: learningModule.assessment.questions,
      studentAnswers: [],
      adaptiveAlgorithm: {
        currentDifficulty: 5,
        nextDifficulty: 5,
        adjustmentReason: 'Initial assessment',
        questionsShown: 0,
        totalQuestions: Math.min(learningModule.assessment.questions.length, 10)
      },
      results: {
        score: 0,
        percentage: 0,
        timeSpent: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        skippedAnswers: 0,
        difficultyProgression: [],
        strengths: [],
        weaknesses: [],
        recommendations: []
      },
      isCompleted: false
    });

    return assessment;
  }

  /**
   * Get next question for adaptive assessment
   */
  private getNextQuestion(assessment: IAdaptiveAssessment, learningModule: ILearningModule): any {
    const shownQuestions = assessment.studentAnswers.map(a => a.questionId);
    const availableQuestions = learningModule.assessment.questions.filter(q => !shownQuestions.includes(q.id));
    
    if (availableQuestions.length === 0) return null;

    // Select question based on current difficulty
    const targetDifficulty = assessment.adaptiveAlgorithm.nextDifficulty;
    const suitableQuestions = availableQuestions.filter(q => 
      Math.abs(q.difficulty - targetDifficulty) <= 1
    );

    const question = suitableQuestions.length > 0 
      ? suitableQuestions[Math.floor(Math.random() * suitableQuestions.length)]
      : availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    return {
      id: question.id,
      question: question.question,
      type: question.type,
      options: question.options,
      points: question.points,
      difficulty: question.difficulty
    };
  }

  /**
   * Check if answer is correct
   */
  private checkAnswer(question: any, answer: string | string[]): boolean {
    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      return question.correctAnswer === answer;
    } else if (question.type === 'fill_blank') {
      return Array.isArray(question.correctAnswer) 
        ? question.correctAnswer.includes(answer as string)
        : question.correctAnswer === answer;
    } else if (question.type === 'essay') {
      // For essay questions, this would be more complex
      return true; // Simplified
    }
    return false;
  }

  /**
   * Update adaptive algorithm
   */
  private updateAdaptiveAlgorithm(assessment: IAdaptiveAssessment, isCorrect: boolean, questionDifficulty: number): void {
    assessment.adaptiveAlgorithm.questionsShown++;
    (assessment.adaptiveAlgorithm as any).difficultyProgression.push(questionDifficulty);

    // Adjust difficulty based on performance
    if (isCorrect) {
      assessment.adaptiveAlgorithm.nextDifficulty = Math.min(10, assessment.adaptiveAlgorithm.nextDifficulty + 0.5);
      assessment.adaptiveAlgorithm.adjustmentReason = 'Correct answer - increasing difficulty';
    } else {
      assessment.adaptiveAlgorithm.nextDifficulty = Math.max(1, assessment.adaptiveAlgorithm.nextDifficulty - 0.5);
      assessment.adaptiveAlgorithm.adjustmentReason = 'Incorrect answer - decreasing difficulty';
    }
  }

  /**
   * Calculate assessment results
   */
  private calculateAssessmentResults(assessment: IAdaptiveAssessment): void {
    const answers = assessment.studentAnswers;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalAnswers = answers.length;
    const totalPoints = answers.reduce((sum, a) => {
      const question = assessment.questions.find(q => q.questionId === a.questionId);
      return sum + (a.isCorrect ? (question?.points || 0) : 0);
    }, 0);

    const maxPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);

    assessment.results.score = totalPoints;
    assessment.results.percentage = Math.round((totalPoints / maxPoints) * 100);
    assessment.results.correctAnswers = correctAnswers;
    assessment.results.incorrectAnswers = totalAnswers - correctAnswers;
    assessment.results.skippedAnswers = 0; // Would be calculated based on actual data
    assessment.results.timeSpent = answers.reduce((sum, a) => sum + a.timeSpent, 0) / 60; // Convert to minutes

    // Analyze strengths and weaknesses
    const subjectPerformance: { [key: string]: { correct: number; total: number } } = {};
    answers.forEach(answer => {
      const question = assessment.questions.find(q => q.questionId === answer.questionId);
      if (question) {
        if (!subjectPerformance[question.subject]) {
          subjectPerformance[question.subject] = { correct: 0, total: 0 };
        }
        subjectPerformance[question.subject].total++;
        if (answer.isCorrect) {
          subjectPerformance[question.subject].correct++;
        }
      }
    });

    assessment.results.strengths = Object.entries(subjectPerformance)
      .filter(([_, perf]) => (perf.correct / perf.total) >= 0.8)
      .map(([subject, _]) => subject);

    assessment.results.weaknesses = Object.entries(subjectPerformance)
      .filter(([_, perf]) => (perf.correct / perf.total) < 0.6)
      .map(([subject, _]) => subject);

    // Generate recommendations
    assessment.results.recommendations = [];
    if (assessment.results.percentage < 60) {
      assessment.results.recommendations.push('Review fundamental concepts');
    }
    if (assessment.results.weaknesses.length > 0) {
      assessment.results.recommendations.push(`Focus on: ${assessment.results.weaknesses.join(', ')}`);
    }
  }

  /**
   * Generate recommendations for student
   */
  private async generateRecommendations(studentId: string): Promise<void> {
    const profile = await StudentLearningProfile.findOne({ studentId });
    if (!profile) return;

    // This is a simplified recommendation generation
    // In reality, this would use machine learning algorithms

    const recommendations = [];

    if (profile.performanceMetrics.averageScore < 70) {
      recommendations.push({
        studentId: studentId as any,
        type: 'practice',
        title: 'Practice Basic Concepts',
        description: 'Focus on fundamental concepts to improve your understanding',
        priority: 'high',
        reason: 'Low average score indicates need for foundational review',
        confidence: 85,
        estimatedTime: 60,
        difficulty: 3,
        subject: 'General',
        relatedContent: [],
        prerequisites: [],
        expectedOutcome: {
          skill: 'Basic understanding',
          improvement: 20
        }
      });
    }

    if (profile.performanceMetrics.completionRate < 80) {
      recommendations.push({
        studentId: studentId as any,
        type: 'module',
        title: 'Complete More Modules',
        description: 'Increase your completion rate by finishing more learning modules',
        priority: 'medium',
        reason: 'Low completion rate affects overall progress',
        confidence: 75,
        estimatedTime: 120,
        difficulty: 5,
        subject: 'General',
        relatedContent: [],
        prerequisites: [],
        expectedOutcome: {
          skill: 'Consistency',
          improvement: 15
        }
      });
    }

    // Save recommendations
    for (const rec of recommendations) {
      await AdaptiveRecommendation.create(rec);
    }
  }
}
