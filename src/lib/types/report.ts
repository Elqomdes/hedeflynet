export interface StudentReportData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    class?: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  performance: {
    assignmentCompletion: number;
    averageGrade: number;
    gradingRate: number;
    goalsProgress: number;
    overallPerformance: number;
  };
  statistics: {
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    pendingAssignments: number;
    totalGoals: number;
    completedGoals: number;
  };
  subjects: Array<{
    name: string;
    averageGrade: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  monthlyProgress: Array<{
    month: string;
    assignmentsCompleted: number;
    averageGrade: number;
    goalsAchieved: number;
  }>;
  recentAssignments: Array<{
    title: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded' | 'completed';
    grade?: number;
    maxGrade: number;
  }>;
  goals: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    progress: number;
  }>;
  insights: {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
  generatedAt: string;
}

export interface ReportGenerationOptions {
  includeCharts?: boolean;
  includeDetailedAssignments?: boolean;
  format?: 'pdf' | 'html' | 'json';
}
