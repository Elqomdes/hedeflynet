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
    overallPerformance: number;
  };
  statistics: {
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    pendingAssignments: number;
  };
  recentAssignments: Array<{
    title: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded' | 'completed';
    grade?: number;
    maxGrade: number;
  }>;
  generatedAt: string;
}

export interface ReportGenerationOptions {
  includeCharts?: boolean;
  includeDetailedAssignments?: boolean;
  format?: 'pdf' | 'html' | 'json';
}
