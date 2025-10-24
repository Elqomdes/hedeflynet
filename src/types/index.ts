export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeacherApplication {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience: string;
  subjects: string[];
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface Class {
  _id: string;
  name: string;
  description?: string;
  teacherId: string;
  coTeachers: string[]; // Max 3
  students: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  type: 'individual' | 'class';
  teacherId: string;
  classId?: string; // Optional for individual assignments
  studentId?: string; // For individual assignments
  attachments: {
    type: 'pdf' | 'video' | 'link';
    url: string;
    name: string;
  }[];
  dueDate: Date;
  maxGrade?: number;
  publishAt?: Date;
  closeAt?: Date;
  allowLate?: {
    policy: 'no' | 'untilClose' | 'always';
    penaltyPercent?: number;
  };
  maxAttempts?: number;
  tags?: string[];
  rubricId?: string;
  // Goal-like properties
  category?: 'academic' | 'behavioral' | 'skill' | 'personal' | 'other';
  priority?: 'low' | 'medium' | 'high';
  successCriteria?: string;
  progress?: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSubmission {
  _id: string;
  assignmentId: string;
  studentId: string;
  status: 'completed' | 'incomplete' | 'not_started' | 'submitted' | 'graded' | 'late';
  grade?: number;
  maxGrade?: number;
  feedback?: string;
  teacherFeedback?: string;
  submittedAt?: Date;
  gradedAt?: Date;
  content?: string;
  attachments?: {
    type: 'pdf' | 'video' | 'link' | 'image';
    url: string;
    name: string;
  }[];
  attempt?: number;
  versions?: {
    attempt: number;
    submittedAt: Date;
    content?: string;
    attachments?: { type: 'pdf' | 'video' | 'link' | 'image'; url: string; name: string }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  teacherId: string;
  classId?: string;
  studentId?: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  timeLimit?: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizResult {
  _id: string;
  quizId: string;
  studentId: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  completedAt: Date;
}



export interface Report {
  _id: string;
  studentId: string;
  teacherId: string;
  title: string;
  content: string;
  data: {
    assignmentCompletion: number;
    subjectStats: { [key: string]: number };
    overallPerformance: number;
  };
  createdAt: Date;
  isPublic: boolean;
  shareToken?: string;
}
