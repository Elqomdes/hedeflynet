import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyGroup extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  subject: string;
  createdBy: mongoose.Types.ObjectId; // Student ID
  members: mongoose.Types.ObjectId[]; // Student IDs
  maxMembers: number;
  isPublic: boolean;
  tags: string[];
  rules: {
    title: string;
    description: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudySession extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  scheduledFor: Date;
  duration: number; // in minutes
  location: {
    type: 'online' | 'physical';
    details: string; // Zoom link or physical address
  };
  host: mongoose.Types.ObjectId; // Student ID
  participants: {
    studentId: mongoose.Types.ObjectId;
    joinedAt: Date;
    status: 'confirmed' | 'pending' | 'declined';
  }[];
  maxParticipants: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudyPost extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId; // Student ID
  groupId?: mongoose.Types.ObjectId; // Optional, if posted in a group
  type: 'question' | 'answer' | 'resource' | 'discussion' | 'achievement';
  title: string;
  content: string;
  subject: string;
  tags: string[];
  attachments: {
    type: 'image' | 'document' | 'link';
    url: string;
    name: string;
  }[];
  likes: mongoose.Types.ObjectId[]; // Student IDs who liked
  comments: {
    authorId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    likes: mongoose.Types.ObjectId[];
  }[];
  isPinned: boolean;
  isResolved: boolean; // For questions
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudyResource extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  type: 'document' | 'video' | 'link' | 'quiz' | 'summary';
  url: string;
  uploadedBy: mongoose.Types.ObjectId; // Student ID
  groupId?: mongoose.Types.ObjectId; // Optional, if shared in a group
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: {
    average: number;
    count: number;
  };
  downloads: number;
  isVerified: boolean; // Verified by teachers
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudyChallenge extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  type: 'quiz' | 'project' | 'discussion' | 'collaboration';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  requirements: {
    type: 'time_limit' | 'group_size' | 'prerequisite' | 'submission';
    value: any;
    description: string;
  }[];
  participants: {
    studentId: mongoose.Types.ObjectId;
    joinedAt: Date;
    completedAt?: Date;
    score?: number;
    submission?: string;
  }[];
  maxParticipants: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId; // Student or Teacher ID
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudyNotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId; // Student ID
  type: 'group_invite' | 'session_reminder' | 'post_like' | 'post_comment' | 'challenge_invite' | 'resource_shared';
  title: string;
  message: string;
  data: {
    groupId?: mongoose.Types.ObjectId;
    postId?: mongoose.Types.ObjectId;
    sessionId?: mongoose.Types.ObjectId;
    challengeId?: mongoose.Types.ObjectId;
    resourceId?: mongoose.Types.ObjectId;
    fromUserId?: mongoose.Types.ObjectId;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Study Group Schema
const StudyGroupSchema = new Schema<IStudyGroup>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxMembers: {
    type: Number,
    default: 10,
    min: 2,
    max: 50
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  rules: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Study Session Schema
const StudySessionSchema = new Schema<IStudySession>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  subject: {
    type: String,
    required: true,
    trim: true
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
  location: {
    type: {
      type: String,
      enum: ['online', 'physical'],
      required: true
    },
    details: {
      type: String,
      required: true,
      trim: true
    }
  },
  host: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'declined'],
      default: 'pending'
    }
  }],
  maxParticipants: {
    type: Number,
    default: 10,
    min: 2,
    max: 50
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Study Post Schema
const StudyPostSchema = new Schema<IStudyPost>({
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'StudyGroup'
  },
  type: {
    type: String,
    enum: ['question', 'answer', 'resource', 'discussion', 'achievement'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link'],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    authorId: {
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
  isPinned: {
    type: Boolean,
    default: false
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Study Resource Schema
const StudyResourceSchema = new Schema<IStudyResource>({
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
  subject: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['document', 'video', 'link', 'quiz', 'summary'],
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'StudyGroup'
  },
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  downloads: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Study Challenge Schema
const StudyChallengeSchema = new Schema<IStudyChallenge>({
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
  type: {
    type: String,
    enum: ['quiz', 'project', 'discussion', 'collaboration'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 1
  },
  requirements: [{
    type: {
      type: String,
      enum: ['time_limit', 'group_size', 'prerequisite', 'submission'],
      required: true
    },
    value: {
      type: Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  }],
  participants: [{
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    score: {
      type: Number,
      min: 0
    },
    submission: {
      type: String,
      trim: true
    }
  }],
  maxParticipants: {
    type: Number,
    default: 20,
    min: 2,
    max: 100
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
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

// Study Notification Schema
const StudyNotificationSchema = new Schema<IStudyNotification>({
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['group_invite', 'session_reminder', 'post_like', 'post_comment', 'challenge_invite', 'resource_shared'],
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
  data: {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyGroup'
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyPost'
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'StudySession'
    },
    challengeId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyChallenge'
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyResource'
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
StudyGroupSchema.index({ subject: 1, isActive: 1 });
StudyGroupSchema.index({ createdBy: 1 });
StudyGroupSchema.index({ members: 1 });
StudySessionSchema.index({ groupId: 1, scheduledFor: 1 });
StudySessionSchema.index({ host: 1 });
StudyPostSchema.index({ authorId: 1, createdAt: -1 });
StudyPostSchema.index({ groupId: 1, type: 1 });
StudyPostSchema.index({ subject: 1, tags: 1 });
StudyResourceSchema.index({ subject: 1, type: 1 });
StudyResourceSchema.index({ uploadedBy: 1 });
StudyChallengeSchema.index({ subject: 1, isActive: 1 });
StudyChallengeSchema.index({ createdBy: 1 });
StudyNotificationSchema.index({ recipientId: 1, isRead: 1 });

export const StudyGroup = mongoose.models.StudyGroup || mongoose.model<IStudyGroup>('StudyGroup', StudyGroupSchema);
export const StudySession = mongoose.models.StudySession || mongoose.model<IStudySession>('StudySession', StudySessionSchema);
export const StudyPost = mongoose.models.StudyPost || mongoose.model<IStudyPost>('StudyPost', StudyPostSchema);
export const StudyResource = mongoose.models.StudyResource || mongoose.model<IStudyResource>('StudyResource', StudyResourceSchema);
export const StudyChallenge = mongoose.models.StudyChallenge || mongoose.model<IStudyChallenge>('StudyChallenge', StudyChallengeSchema);
export const StudyNotification = mongoose.models.StudyNotification || mongoose.model<IStudyNotification>('StudyNotification', StudyNotificationSchema);
