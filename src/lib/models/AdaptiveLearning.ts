import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningPath extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in hours
  difficulty: number; // 1-10 scale
  prerequisites: mongoose.Types.ObjectId[]; // Other learning path IDs
  learningObjectives: {
    objective: string;
    description: string;
    isRequired: boolean;
  }[];
  modules: {
    moduleId: mongoose.Types.ObjectId;
    order: number;
    isRequired: boolean;
    estimatedTime: number; // in minutes
  }[];
  assessmentCriteria: {
    type: 'quiz' | 'assignment' | 'project' | 'exam';
    weight: number; // percentage
    passingScore: number;
    isRequired: boolean;
  }[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId; // Teacher ID
  createdAt: Date;
  updatedAt: Date;
}

export interface ILearningModule extends Document {
  _id: mongoose.Types.ObjectId;
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
    interactiveContent?: any; // JSON for interactive elements
    attachments?: {
      name: string;
      url: string;
      type: string;
    }[];
  };
  learningObjectives: string[];
  prerequisites: mongoose.Types.ObjectId[]; // Other module IDs
  estimatedTime: number; // in minutes
  difficulty: number; // 1-10 scale
  tags: string[];
  isAdaptive: boolean; // Can be customized based on student performance
  adaptiveRules: {
    condition: string; // e.g., "if score < 70"
    action: string; // e.g., "show additional practice"
    parameters: any; // Additional parameters for the action
  }[];
  assessment: {
    questions: {
      id: string;
      question: string;
      type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay';
      options?: string[];
      correctAnswer: string | string[];
      explanation: string;
      points: number;
      difficulty: number; // 1-10 scale
    }[];
    passingScore: number;
    timeLimit?: number; // in minutes
    attempts: number; // -1 for unlimited
  };
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId; // Teacher ID
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentLearningProfile extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  learningStyle: {
    visual: number; // 0-100
    auditory: number; // 0-100
    kinesthetic: number; // 0-100
    reading: number; // 0-100
  };
  cognitiveAbilities: {
    memory: number; // 1-10 scale
    attention: number; // 1-10 scale
    processingSpeed: number; // 1-10 scale
    reasoning: number; // 1-10 scale
  };
  subjectPreferences: {
    subject: string;
    interest: number; // 1-10 scale
    proficiency: number; // 1-10 scale
    lastStudied: Date;
  }[];
  learningHistory: {
    moduleId: mongoose.Types.ObjectId;
    completedAt: Date;
    score: number;
    timeSpent: number; // in minutes
    attempts: number;
    difficulty: number; // 1-10 scale
  }[];
  adaptiveSettings: {
    preferredPace: 'slow' | 'normal' | 'fast';
    preferredDifficulty: 'easy' | 'medium' | 'hard';
    preferredContentType: 'video' | 'text' | 'interactive' | 'mixed';
    reminderFrequency: 'daily' | 'weekly' | 'monthly';
  };
  performanceMetrics: {
    averageScore: number;
    completionRate: number;
    timeEfficiency: number; // score per minute
    improvementRate: number; // percentage improvement over time
    consistency: number; // 1-10 scale
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdaptiveRecommendation extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: 'module' | 'path' | 'practice' | 'review' | 'challenge';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reason: string; // Why this recommendation was made
  confidence: number; // 0-100, how confident the system is
  estimatedTime: number; // in minutes
  difficulty: number; // 1-10 scale
  subject: string;
  relatedContent: {
    type: 'module' | 'path' | 'resource';
    id: mongoose.Types.ObjectId;
    title: string;
  }[];
  prerequisites: mongoose.Types.ObjectId[];
  expectedOutcome: {
    skill: string;
    improvement: number; // expected improvement percentage
  };
  isAccepted: boolean;
  acceptedAt?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  feedback?: {
    rating: number; // 1-5
    comment: string;
    wasHelpful: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdaptiveAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  type: 'diagnostic' | 'formative' | 'summative' | 'adaptive';
  questions: {
    questionId: string;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay';
    options?: string[];
    correctAnswer: string | string[];
    explanation: string;
    points: number;
    difficulty: number; // 1-10 scale
    subject: string;
    topic: string;
  }[];
  studentAnswers: {
    questionId: string;
    answer: string | string[];
    timeSpent: number; // in seconds
    isCorrect: boolean;
    confidence: number; // 1-5 scale, student's confidence in their answer
  }[];
  adaptiveAlgorithm: {
    currentDifficulty: number; // 1-10 scale
    nextDifficulty: number; // 1-10 scale
    adjustmentReason: string;
    questionsShown: number;
    totalQuestions: number;
  };
  results: {
    score: number;
    percentage: number;
    timeSpent: number; // in minutes
    correctAnswers: number;
    incorrectAnswers: number;
    skippedAnswers: number;
    difficultyProgression: number[]; // difficulty levels of questions
    strengths: string[]; // topics where student performed well
    weaknesses: string[]; // topics where student needs improvement
    recommendations: string[]; // specific recommendations based on performance
  };
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Learning Path Schema
const LearningPathSchema = new Schema<ILearningPath>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  prerequisites: [{
    type: Schema.Types.ObjectId,
    ref: 'LearningPath'
  }],
  learningObjectives: [{
    objective: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  modules: [{
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'LearningModule',
      required: true
    },
    order: {
      type: Number,
      required: true,
      min: 1
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    estimatedTime: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  assessmentCriteria: [{
    type: {
      type: String,
      enum: ['quiz', 'assignment', 'project', 'exam'],
      required: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    passingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Learning Module Schema
const LearningModuleSchema = new Schema<ILearningModule>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'reading', 'interactive', 'quiz', 'assignment', 'project'],
    required: true
  },
  content: {
    text: {
      type: String,
      trim: true
    },
    videoUrl: {
      type: String,
      trim: true
    },
    audioUrl: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    interactiveContent: {
      type: Schema.Types.Mixed
    },
    attachments: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      url: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        required: true,
        trim: true
      }
    }]
  },
  learningObjectives: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  prerequisites: [{
    type: Schema.Types.ObjectId,
    ref: 'LearningModule'
  }],
  estimatedTime: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  tags: [{
    type: String,
    trim: true
  }],
  isAdaptive: {
    type: Boolean,
    default: false
  },
  adaptiveRules: [{
    condition: {
      type: String,
      required: true,
      trim: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    parameters: {
      type: Schema.Types.Mixed
    }
  }],
  assessment: {
    questions: [{
      id: {
        type: String,
        required: true,
        trim: true
      },
      question: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
      },
      type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'fill_blank', 'essay'],
        required: true
      },
      options: [{
        type: String,
        trim: true
      }],
      correctAnswer: {
        type: Schema.Types.Mixed,
        required: true
      },
      explanation: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
      },
      points: {
        type: Number,
        required: true,
        min: 1
      },
      difficulty: {
        type: Number,
        required: true,
        min: 1,
        max: 10
      }
    }],
    passingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    timeLimit: {
      type: Number,
      min: 1
    },
    attempts: {
      type: Number,
      default: 1,
      min: -1 // -1 for unlimited
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Student Learning Profile Schema
const StudentLearningProfileSchema = new Schema<IStudentLearningProfile>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  learningStyle: {
    visual: {
      type: Number,
      default: 25,
      min: 0,
      max: 100
    },
    auditory: {
      type: Number,
      default: 25,
      min: 0,
      max: 100
    },
    kinesthetic: {
      type: Number,
      default: 25,
      min: 0,
      max: 100
    },
    reading: {
      type: Number,
      default: 25,
      min: 0,
      max: 100
    }
  },
  cognitiveAbilities: {
    memory: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    attention: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    processingSpeed: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    reasoning: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    }
  },
  subjectPreferences: [{
    subject: {
      type: String,
      required: true,
      trim: true
    },
    interest: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    proficiency: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    lastStudied: {
      type: Date,
      default: Date.now
    }
  }],
  learningHistory: [{
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'LearningModule',
      required: true
    },
    completedAt: {
      type: Date,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 0
    },
    attempts: {
      type: Number,
      required: true,
      min: 1
    },
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    }
  }],
  adaptiveSettings: {
    preferredPace: {
      type: String,
      enum: ['slow', 'normal', 'fast'],
      default: 'normal'
    },
    preferredDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    preferredContentType: {
      type: String,
      enum: ['video', 'text', 'interactive', 'mixed'],
      default: 'mixed'
    },
    reminderFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    }
  },
  performanceMetrics: {
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    timeEfficiency: {
      type: Number,
      default: 0,
      min: 0
    },
    improvementRate: {
      type: Number,
      default: 0,
      min: -100,
      max: 100
    },
    consistency: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Adaptive Recommendation Schema
const AdaptiveRecommendationSchema = new Schema<IAdaptiveRecommendation>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['module', 'path', 'practice', 'review', 'challenge'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  estimatedTime: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  relatedContent: [{
    type: {
      type: String,
      enum: ['module', 'path', 'resource'],
      required: true
    },
    id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    }
  }],
  prerequisites: [{
    type: Schema.Types.ObjectId
  }],
  expectedOutcome: {
    skill: {
      type: String,
      required: true,
      trim: true
    },
    improvement: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 300
    },
    wasHelpful: {
      type: Boolean
    }
  }
}, {
  timestamps: true
});

// Adaptive Assessment Schema
const AdaptiveAssessmentSchema = new Schema<IAdaptiveAssessment>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moduleId: {
    type: Schema.Types.ObjectId,
    ref: 'LearningModule',
    required: true
  },
  type: {
    type: String,
    enum: ['diagnostic', 'formative', 'summative', 'adaptive'],
    required: true
  },
  questions: [{
    questionId: {
      type: String,
      required: true,
      trim: true
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'fill_blank', 'essay'],
      required: true
    },
    options: [{
      type: String,
      trim: true
    }],
    correctAnswer: {
      type: Schema.Types.Mixed,
      required: true
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    points: {
      type: Number,
      required: true,
      min: 1
    },
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    topic: {
      type: String,
      required: true,
      trim: true
    }
  }],
  studentAnswers: [{
    questionId: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: Schema.Types.Mixed,
      required: true
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 0
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  }],
  adaptiveAlgorithm: {
    currentDifficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    nextDifficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    adjustmentReason: {
      type: String,
      required: true,
      trim: true
    },
    questionsShown: {
      type: Number,
      required: true,
      min: 0
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1
    }
  },
  results: {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 0
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0
    },
    incorrectAnswers: {
      type: Number,
      required: true,
      min: 0
    },
    skippedAnswers: {
      type: Number,
      required: true,
      min: 0
    },
    difficultyProgression: [{
      type: Number,
      min: 1,
      max: 10
    }],
    strengths: [{
      type: String,
      trim: true
    }],
    weaknesses: [{
      type: String,
      trim: true
    }],
    recommendations: [{
      type: String,
      trim: true
    }]
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
LearningPathSchema.index({ subject: 1, level: 1, isActive: 1 });
LearningPathSchema.index({ createdBy: 1 });
LearningModuleSchema.index({ subject: 1, level: 1, type: 1 });
LearningModuleSchema.index({ createdBy: 1 });
LearningModuleSchema.index({ isAdaptive: 1 });
StudentLearningProfileSchema.index({ studentId: 1 });
AdaptiveRecommendationSchema.index({ studentId: 1, isAccepted: 1 });
AdaptiveRecommendationSchema.index({ type: 1, priority: 1 });
AdaptiveAssessmentSchema.index({ studentId: 1, moduleId: 1 });
AdaptiveAssessmentSchema.index({ type: 1, isCompleted: 1 });

export const LearningPath = mongoose.models.LearningPath || mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);
export const LearningModule = mongoose.models.LearningModule || mongoose.model<ILearningModule>('LearningModule', LearningModuleSchema);
export const StudentLearningProfile = mongoose.models.StudentLearningProfile || mongoose.model<IStudentLearningProfile>('StudentLearningProfile', StudentLearningProfileSchema);
export const AdaptiveRecommendation = mongoose.models.AdaptiveRecommendation || mongoose.model<IAdaptiveRecommendation>('AdaptiveRecommendation', AdaptiveRecommendationSchema);
export const AdaptiveAssessment = mongoose.models.AdaptiveAssessment || mongoose.model<IAdaptiveAssessment>('AdaptiveAssessment', AdaptiveAssessmentSchema);
