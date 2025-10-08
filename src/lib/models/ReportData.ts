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
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    averageGrade: number;
    completionRate: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    assignments: number;
    goalsCompleted: number;
    averageGrade: number;
  }>;
  recentAssignments: Array<{
    title: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded' | 'completed';
    grade?: number;
    maxGrade: number;
  }>;
  goals: Array<{
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    createdAt: string;
    completedAt?: string;
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
  includeGoals?: boolean;
  includeInsights?: boolean;
  format?: 'pdf' | 'html' | 'json';
}
