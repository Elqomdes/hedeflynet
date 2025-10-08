import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscount extends Document {
  name: string;
  description: string;
  discountPercentage: number;
  planTypes: ('3months' | '6months' | '12months')[];
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  maxUses?: number;
  currentUses: number;
  createdBy: mongoose.Types.ObjectId; // Admin who created the discount
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema = new Schema<IDiscount>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  planTypes: [{
    type: String,
    enum: ['3months', '6months', '12months'],
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  maxUses: {
    type: Number,
    min: 1
  },
  currentUses: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
DiscountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Ensure the model is not already compiled
if (mongoose.models.Discount) {
  delete mongoose.models.Discount;
}

const Discount = mongoose.model<IDiscount>('Discount', DiscountSchema);
export default Discount;
