import mongoose, { Schema, Document } from 'mongoose';

export interface IFreeTeacherSlot extends Document {
  teacherId: mongoose.Types.ObjectId;
  slotNumber: number; // 1-20 arası
  isActive: boolean;
  assignedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FreeTeacherSlotSchema = new Schema<IFreeTeacherSlot>({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  slotNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 20,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 yıl
  }
}, {
  timestamps: true
});

// Index for efficient queries
FreeTeacherSlotSchema.index({ isActive: 1 });

// Ensure the model is not already compiled
if (mongoose.models.FreeTeacherSlot) {
  delete mongoose.models.FreeTeacherSlot;
}

const FreeTeacherSlot = mongoose.model<IFreeTeacherSlot>('FreeTeacherSlot', FreeTeacherSlotSchema);
export default FreeTeacherSlot;
