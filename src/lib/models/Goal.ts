import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  targetDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number; // 0-100
  category: 'academic' | 'behavioral' | 'skill' | 'personal' | 'other';
  priority: 'low' | 'medium' | 'high';
  assignmentId?: mongoose.Types.ObjectId; // Linked assignment
  successCriteria: string; // What defines success
  parentNotificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>({
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
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  targetDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  category: {
    type: String,
    enum: ['academic', 'behavioral', 'skill', 'personal', 'other'],
    default: 'academic'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  successCriteria: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  parentNotificationSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure the model is not already compiled
if (mongoose.models.Goal) {
  delete mongoose.models.Goal;
}

const Goal = mongoose.model<IGoal>('Goal', GoalSchema);
export default Goal;
