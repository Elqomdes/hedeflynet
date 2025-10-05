import mongoose, { Document, Schema } from 'mongoose';

export interface IAIRecommendation extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  type: 'study_plan' | 'motivation' | 'difficulty' | 'schedule' | 'assignment_focus' | 'goal_adjustment' | 'skill_development';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'applied' | 'dismissed';
  category: string;
  estimatedImpact: number; // 1-10 scale
  actionRequired: boolean;
  reason: string; // Why this recommendation was made
  confidence: number; // 0-100, how confident the system is
  relatedData: {
    assignments?: mongoose.Types.ObjectId[];
    goals?: mongoose.Types.ObjectId[];
    submissions?: mongoose.Types.ObjectId[];
  };
  appliedAt?: Date;
  dismissedAt?: Date;
  feedback?: {
    rating: number; // 1-5
    comment: string;
    wasHelpful: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AIRecommendationSchema = new Schema<IAIRecommendation>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['study_plan', 'motivation', 'difficulty', 'schedule', 'assignment_focus', 'goal_adjustment', 'skill_development'],
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
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true,
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'applied', 'dismissed'],
    required: true,
    default: 'pending'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  estimatedImpact: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5
  },
  actionRequired: {
    type: Boolean,
    required: true,
    default: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 75
  },
  relatedData: {
    assignments: [{
      type: Schema.Types.ObjectId,
      ref: 'Assignment'
    }],
    goals: [{
      type: Schema.Types.ObjectId,
      ref: 'Goal'
    }],
    submissions: [{
      type: Schema.Types.ObjectId,
      ref: 'AssignmentSubmission'
    }]
  },
  appliedAt: {
    type: Date
  },
  dismissedAt: {
    type: Date
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
      maxlength: 500
    },
    wasHelpful: {
      type: Boolean
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
AIRecommendationSchema.index({ studentId: 1, status: 1 });
AIRecommendationSchema.index({ teacherId: 1, status: 1 });
AIRecommendationSchema.index({ type: 1, priority: 1 });
AIRecommendationSchema.index({ createdAt: -1 });

export const AIRecommendation = mongoose.models.AIRecommendation || mongoose.model<IAIRecommendation>('AIRecommendation', AIRecommendationSchema);
