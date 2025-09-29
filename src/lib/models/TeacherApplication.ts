import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherApplication extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience: string;
  subjects: string[];
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const TeacherApplicationSchema = new Schema<ITeacherApplication>({
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
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: String,
    required: true,
    maxlength: 1000
  },
  subjects: [{
    type: String,
    required: true,
    trim: true
  }],
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Ensure the model is not already compiled
if (mongoose.models.TeacherApplication) {
  delete mongoose.models.TeacherApplication;
}

const TeacherApplication = mongoose.model<ITeacherApplication>('TeacherApplication', TeacherApplicationSchema);
export default TeacherApplication;
