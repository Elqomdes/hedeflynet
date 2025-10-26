import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoSession extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  teacherId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: 'one_on_one' | 'group' | 'class' | 'consultation';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  scheduledFor: Date;
  duration: number; // in minutes
  actualDuration?: number; // in minutes
  meetingUrl: string;
  meetingId: string;
  platformUrl?: string;
  password?: string;
  participants: {
    userId: mongoose.Types.ObjectId;
    role: 'teacher' | 'student' | 'observer';
    joinedAt?: Date;
    leftAt?: Date;
    isActive: boolean;
  }[];
  recording: {
    url?: string;
    duration?: number;
    isAvailable: boolean;
    expiresAt?: Date;
  };
  notes: {
    authorId: mongoose.Types.ObjectId;
    content: string;
    timestamp: number; // in seconds from start
    isPrivate: boolean;
    createdAt: Date;
  }[];
  feedback: {
    fromUserId: mongoose.Types.ObjectId;
    toUserId: mongoose.Types.ObjectId;
    rating: number; // 1-5
    comment: string;
    createdAt: Date;
  }[];
  agenda: {
    topic: string;
    duration: number; // in minutes
    description?: string;
    isCompleted: boolean;
  }[];
  followUpActions: {
    action: string;
    assignedTo: mongoose.Types.ObjectId;
    dueDate: Date;
    isCompleted: boolean;
    completedAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoRecording extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  quality: 'low' | 'medium' | 'high' | 'hd';
  isPublic: boolean;
  accessLevel: 'private' | 'students_only' | 'public';
  tags: string[];
  views: number;
  downloads: number;
  sharedWith: mongoose.Types.ObjectId[]; // User IDs who have access
  rating: {
    average: number;
    count: number;
  };
  likes: mongoose.Types.ObjectId[];
  bookmarks: mongoose.Types.ObjectId[];
  comments: {
    userId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    likes: mongoose.Types.ObjectId[];
  }[];
  relatedSessions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoResource extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'tutorial' | 'lecture' | 'demo' | 'review' | 'practice';
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  url: string;
  thumbnailUrl?: string;
  createdBy: mongoose.Types.ObjectId; // Teacher ID
  isPublic: boolean;
  isVerified: boolean;
  tags: string[];
  rating: {
    average: number;
    count: number;
  };
  views: number;
  likes: mongoose.Types.ObjectId[]; // User IDs who liked
  bookmarks: mongoose.Types.ObjectId[]; // User IDs who bookmarked
  comments: {
    userId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    likes: mongoose.Types.ObjectId[];
  }[];
  relatedSessions: mongoose.Types.ObjectId[]; // Related video sessions
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  engagement: {
    totalWatchTime: number; // in seconds
    averageWatchTime: number; // in seconds
    completionRate: number; // percentage
    pauseCount: number;
    rewindCount: number;
    fastForwardCount: number;
  };
  interaction: {
    questionsAsked: number;
    answersGiven: number;
    chatMessages: number;
    screenShares: number;
    whiteboardUsage: number;
  };
  performance: {
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
    audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
    videoQuality: 'excellent' | 'good' | 'fair' | 'poor';
    technicalIssues: number;
  };
  feedback: {
    sessionRating: number; // 1-5
    contentRating: number; // 1-5
    teacherRating: number; // 1-5
    overallSatisfaction: number; // 1-5
    comments: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Video Session Schema
const VideoSessionSchema = new Schema<IVideoSession>({
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
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['one_on_one', 'group', 'class', 'consultation'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  scheduledFor: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 480 // 8 hours max
  },
  actualDuration: {
    type: Number,
    min: 0
  },
  meetingUrl: {
    type: String,
    required: true,
    trim: true
  },
  meetingId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  platformUrl: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    trim: true
  },
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['teacher', 'student', 'observer'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: null
    },
    leftAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: false
    }
  }],
  recording: {
    url: {
      type: String,
      trim: true
    },
    duration: {
      type: Number,
      min: 0
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  notes: [{
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    timestamp: {
      type: Number,
      required: true,
      min: 0
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: [{
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  agenda: [{
    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    duration: {
      type: Number,
      required: true,
      min: 5
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  followUpActions: [{
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  }]
}, {
  timestamps: true
});

// Video Recording Schema
const VideoRecordingSchema = new Schema<IVideoRecording>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'VideoSession',
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
    maxlength: 1000
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  quality: {
    type: String,
    enum: ['low', 'medium', 'high', 'hd'],
    default: 'medium'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['private', 'students_only', 'public'],
    default: 'private'
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  downloads: {
    type: Number,
    default: 0,
    min: 0
  },
  sharedWith: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarks: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  relatedSessions: [{
    type: Schema.Types.ObjectId,
    ref: 'VideoSession'
  }]
}, {
  timestamps: true
});

// Video Resource Schema
const VideoResourceSchema = new Schema<IVideoResource>({
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
  type: {
    type: String,
    enum: ['tutorial', 'lecture', 'demo', 'review', 'practice'],
    required: true
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
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarks: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  relatedSessions: [{
    type: Schema.Types.ObjectId,
    ref: 'VideoSession'
  }]
}, {
  timestamps: true
});

// Video Analytics Schema
const VideoAnalyticsSchema = new Schema<IVideoAnalytics>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'VideoSession',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  engagement: {
    totalWatchTime: {
      type: Number,
      default: 0,
      min: 0
    },
    averageWatchTime: {
      type: Number,
      default: 0,
      min: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    pauseCount: {
      type: Number,
      default: 0,
      min: 0
    },
    rewindCount: {
      type: Number,
      default: 0,
      min: 0
    },
    fastForwardCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  interaction: {
    questionsAsked: {
      type: Number,
      default: 0,
      min: 0
    },
    answersGiven: {
      type: Number,
      default: 0,
      min: 0
    },
    chatMessages: {
      type: Number,
      default: 0,
      min: 0
    },
    screenShares: {
      type: Number,
      default: 0,
      min: 0
    },
    whiteboardUsage: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  performance: {
    connectionQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    audioQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    videoQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    technicalIssues: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  feedback: {
    sessionRating: {
      type: Number,
      min: 1,
      max: 5
    },
    contentRating: {
      type: Number,
      min: 1,
      max: 5
    },
    teacherRating: {
      type: Number,
      min: 1,
      max: 5
    },
    overallSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
VideoSessionSchema.index({ teacherId: 1, scheduledFor: 1 });
VideoSessionSchema.index({ studentId: 1, status: 1 });
// meetingId already has a unique index on the field; avoid duplicate index declaration
VideoRecordingSchema.index({ sessionId: 1 });
VideoRecordingSchema.index({ createdBy: 1 });
VideoResourceSchema.index({ subject: 1, level: 1 });
VideoResourceSchema.index({ createdBy: 1 });
VideoResourceSchema.index({ isPublic: 1, isVerified: 1 });
VideoAnalyticsSchema.index({ sessionId: 1, studentId: 1 });
VideoAnalyticsSchema.index({ teacherId: 1, createdAt: -1 });

export const VideoSession = mongoose.models.VideoSession || mongoose.model<IVideoSession>('VideoSession', VideoSessionSchema);
export const VideoRecording = mongoose.models.VideoRecording || mongoose.model<IVideoRecording>('VideoRecording', VideoRecordingSchema);
export const VideoResource = mongoose.models.VideoResource || mongoose.model<IVideoResource>('VideoResource', VideoResourceSchema);
export const VideoAnalytics = mongoose.models.VideoAnalytics || mongoose.model<IVideoAnalytics>('VideoAnalytics', VideoAnalyticsSchema);
