import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description: string;
  type: 'individual' | 'class';
  teacherId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  attachments: {
    type: 'pdf' | 'video' | 'link';
    url: string;
    name: string;
  }[];
  dueDate: Date;
  maxGrade?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['individual', 'class'],
    required: true
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    validate: {
      validator: function(classId: mongoose.Types.ObjectId) {
        // classId is required when type is 'class'
        return this.type !== 'class' || classId != null;
      },
      message: 'Sınıf ID, sınıf ödevi için gereklidir'
    }
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['pdf', 'video', 'link'],
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
  dueDate: {
    type: Date,
    required: true
  },
  maxGrade: {
    type: Number,
    default: 100,
    min: 1,
    max: 100
  }
}, {
  timestamps: true
});

// Ensure the model is not already compiled
if (mongoose.models.Assignment) {
  delete mongoose.models.Assignment;
}

const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
export default Assignment;
