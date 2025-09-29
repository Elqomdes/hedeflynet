import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  data: {
    assignmentCompletion: number;
    subjectStats: { [key: string]: number };
    goalsProgress: number;
    overallPerformance: number;
  };
  createdAt: Date;
  isPublic: boolean;
  shareToken?: string;
}

const ReportSchema = new Schema<IReport>({
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
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  data: {
    assignmentCompletion: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    subjectStats: {
      type: Map,
      of: Number
    },
    goalsProgress: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    overallPerformance: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Generate share token before saving
ReportSchema.pre('save', function(next) {
  if (this.isPublic && !this.shareToken) {
    const crypto = require('crypto');
    this.shareToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Ensure the model is not already compiled
if (mongoose.models.Report) {
  delete mongoose.models.Report;
}

const Report = mongoose.model<IReport>('Report', ReportSchema);
export default Report;
