import mongoose, { Document, Schema } from 'mongoose';

export interface IParent extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
  children: mongoose.Types.ObjectId[]; // Array of student IDs
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  preferences: {
    reportFrequency: 'daily' | 'weekly' | 'monthly';
    language: 'tr' | 'en';
    timezone: string;
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IParentNotification extends Document {
  _id: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: 'assignment_completed' | 'assignment_graded' | 'goal_achieved' | 'low_performance' | 'attendance' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any; // Additional data related to the notification
  createdAt: Date;
  updatedAt: Date;
}

export interface IParentReport extends Document {
  _id: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
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
    studyTime: number; // in hours
    attendanceRate: number;
    behaviorScore: number; // 1-10 scale
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
  isGenerated: boolean;
  generatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Parent Schema
const ParentSchema = new Schema<IParent>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir e-posta adresi giriniz']
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    match: [/^[0-9+\-\s()]*$/, 'Geçerli bir telefon numarası giriniz']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isActive: {
    type: Boolean,
    default: true
  },
  children: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  preferences: {
    reportFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    language: {
      type: String,
      enum: ['tr', 'en'],
      default: 'tr'
    },
    timezone: {
      type: String,
      default: 'Europe/Istanbul'
    }
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Parent Notification Schema
const ParentNotificationSchema = new Schema<IParentNotification>({
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['assignment_completed', 'assignment_graded', 'goal_achieved', 'low_performance', 'attendance', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Parent Report Schema
const ParentReportSchema = new Schema<IParentReport>({
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  summary: {
    assignmentsCompleted: {
      type: Number,
      default: 0
    },
    assignmentsTotal: {
      type: Number,
      default: 0
    },
    averageGrade: {
      type: Number,
      default: 0
    },
    goalsAchieved: {
      type: Number,
      default: 0
    },
    goalsTotal: {
      type: Number,
      default: 0
    },
    studyTime: {
      type: Number,
      default: 0
    },
    attendanceRate: {
      type: Number,
      default: 0
    },
    behaviorScore: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    }
  },
  subjects: [{
    name: {
      type: String,
      required: true
    },
    averageGrade: {
      type: Number,
      default: 0
    },
    assignmentsCompleted: {
      type: Number,
      default: 0
    },
    assignmentsTotal: {
      type: Number,
      default: 0
    },
    trend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable'
    }
  }],
  recommendations: [{
    type: String,
    trim: true
  }],
  achievements: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    earnedAt: {
      type: Date,
      required: true
    }
  }],
  concerns: [{
    type: {
      type: String,
      enum: ['academic', 'behavioral', 'attendance', 'social'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    suggestedActions: [{
      type: String,
      trim: true
    }]
  }],
  isGenerated: {
    type: Boolean,
    default: false
  },
  generatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Add comparePassword method to Parent schema
ParentSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for better performance
// Note: 'email' already has a unique index via schema definition; avoid duplicate index declarations
ParentSchema.index({ children: 1 });
ParentNotificationSchema.index({ parentId: 1, isRead: 1 });
ParentNotificationSchema.index({ studentId: 1, createdAt: -1 });
ParentReportSchema.index({ parentId: 1, studentId: 1, period: 1 });
ParentReportSchema.index({ reportType: 1, createdAt: -1 });

export const Parent = mongoose.models.Parent || mongoose.model<IParent>('Parent', ParentSchema);
export const ParentNotification = mongoose.models.ParentNotification || mongoose.model<IParentNotification>('ParentNotification', ParentNotificationSchema);
export const ParentReport = mongoose.models.ParentReport || mongoose.model<IParentReport>('ParentReport', ParentReportSchema);
