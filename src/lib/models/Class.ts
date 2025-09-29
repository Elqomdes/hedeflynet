import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  name: string;
  description?: string;
  teacherId: mongoose.Types.ObjectId;
  coTeachers: mongoose.Types.ObjectId[]; // Max 3
  students: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coTeachers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(coTeachers: mongoose.Types.ObjectId[]) {
        return coTeachers.length <= 3;
      },
      message: 'Maximum 3 co-teachers allowed'
    }
  }],
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Ensure the model is not already compiled
if (mongoose.models.Class) {
  delete mongoose.models.Class;
}

const Class = mongoose.model<IClass>('Class', ClassSchema);
export default Class;
