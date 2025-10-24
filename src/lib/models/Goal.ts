import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  title: string;
  description: string;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  targetDate: Date;
  category: 'academic' | 'behavioral' | 'skill' | 'personal' | 'other';
  priority: 'low' | 'medium' | 'high';
  successCriteria: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number; // 0-100
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>({
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
  targetDate: {
    type: Date,
    required: true
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
  successCriteria: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  notes: {
    type: String,
    maxlength: 1000
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
