import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: 'completed' | 'incomplete' | 'not_started';
  grade?: number;
  feedback?: string;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>({
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'incomplete', 'not_started'],
    default: 'not_started'
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    maxlength: 1000
  },
  submittedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to ensure one submission per student per assignment
AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

// Ensure the model is not already compiled
if (mongoose.models.AssignmentSubmission) {
  delete mongoose.models.AssignmentSubmission;
}

const AssignmentSubmission = mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema);
export default AssignmentSubmission;
