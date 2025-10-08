import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  teacherId: mongoose.Types.ObjectId;
  planType: '3months' | '6months' | '12months';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isFreeTrial: boolean; // İlk 50 öğretmen için ücretsiz
  originalPrice: number;
  discountedPrice?: number;
  discountPercentage?: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planType: {
    type: String,
    enum: ['3months', '6months', '12months'],
    required: true
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
  isActive: {
    type: Boolean,
    default: true
  },
  isFreeTrial: {
    type: Boolean,
    default: false
  },
  originalPrice: {
    type: Number,
    required: true
  },
  discountedPrice: {
    type: Number
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for efficient queries
SubscriptionSchema.index({ teacherId: 1, isActive: 1 });
SubscriptionSchema.index({ endDate: 1 });

// Ensure the model is not already compiled
if (mongoose.models.Subscription) {
  delete mongoose.models.Subscription;
}

const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;
