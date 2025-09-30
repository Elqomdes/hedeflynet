import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
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
  attempt?: number; // starts at 1
  versions?: {
    attempt: number;
    submittedAt: Date;
    content?: string;
    attachments?: { type: 'pdf' | 'video' | 'link' | 'image'; url: string; name: string }[];
  }[];
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
    enum: ['completed', 'incomplete', 'not_started', 'submitted', 'graded', 'late'],
    default: 'not_started'
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  maxGrade: {
    type: Number,
    default: 100,
    min: 1,
    max: 100
  },
  feedback: {
    type: String,
    maxlength: 1000
  },
  teacherFeedback: {
    type: String,
    maxlength: 2000
  },
  submittedAt: {
    type: Date
  },
  gradedAt: {
    type: Date
  },
  content: {
    type: String,
    maxlength: 5000
  },
  attachments: [{
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'image'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  }],
  attempt: {
    type: Number,
    min: 1
  },
  versions: [{
    attempt: { type: Number, min: 1, required: true },
    submittedAt: { type: Date, required: true },
    content: { type: String, maxlength: 5000 },
    attachments: [{
      type: {
        type: String,
        enum: ['pdf', 'video', 'link', 'image'],
        required: true
      },
      url: { type: String, required: true },
      name: { type: String, required: true }
    }]
  }]
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
