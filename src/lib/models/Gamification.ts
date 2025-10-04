import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'assignment' | 'goal' | 'streak' | 'social' | 'special';
  points: number;
  requirements: {
    type: 'assignments_completed' | 'goals_achieved' | 'study_streak' | 'score_threshold' | 'time_spent' | 'custom';
    value: number;
    subject?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserAchievement extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  unlockedAt: Date;
  progress: number; // 0-100
  isUnlocked: boolean;
  sharedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserLevel extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  level: number;
  experience: number;
  experienceToNext: number;
  totalExperience: number;
  title: string;
  badge: string;
  unlockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserStreak extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'study' | 'assignment' | 'login';
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date;
  streakStartDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaderboard extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'weekly' | 'monthly' | 'all_time';
  category: 'experience' | 'achievements' | 'streaks' | 'assignments';
  entries: {
    userId: mongoose.Types.ObjectId;
    rank: number;
    score: number;
    displayName: string;
    avatar?: string;
  }[];
  period: {
    start: Date;
    end: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserReward extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'points' | 'badge' | 'title' | 'unlock' | 'bonus';
  name: string;
  description: string;
  value: number;
  icon?: string;
  isClaimed: boolean;
  claimedAt?: Date;
  expiresAt?: Date;
  source: 'achievement' | 'level_up' | 'streak' | 'bonus' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Achievement Schema
const AchievementSchema = new Schema<IAchievement>({
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
  icon: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['study', 'assignment', 'goal', 'streak', 'social', 'special'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 0,
    max: 1000
  },
  requirements: {
    type: {
      type: String,
      enum: ['assignments_completed', 'goals_achieved', 'study_streak', 'score_threshold', 'time_spent', 'custom'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    subject: {
      type: String,
      trim: true
    },
    timeframe: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'all_time'],
      default: 'all_time'
    }
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// User Achievement Schema
const UserAchievementSchema = new Schema<IUserAchievement>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementId: {
    type: Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  unlockedAt: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  sharedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// User Level Schema
const UserLevelSchema = new Schema<IUserLevel>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  experienceToNext: {
    type: Number,
    default: 100
  },
  totalExperience: {
    type: Number,
    default: 0,
    min: 0
  },
  title: {
    type: String,
    default: 'Yeni Başlayan',
    trim: true
  },
  badge: {
    type: String,
    default: '🌟',
    trim: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// User Streak Schema
const UserStreakSchema = new Schema<IUserStreak>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['study', 'assignment', 'login'],
    required: true
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  streakStartDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Leaderboard Schema
const LeaderboardSchema = new Schema<ILeaderboard>({
  type: {
    type: String,
    enum: ['weekly', 'monthly', 'all_time'],
    required: true
  },
  category: {
    type: String,
    enum: ['experience', 'achievements', 'streaks', 'assignments'],
    required: true
  },
  entries: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rank: {
      type: Number,
      required: true,
      min: 1
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    avatar: {
      type: String,
      trim: true
    }
  }],
  period: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// User Reward Schema
const UserRewardSchema = new Schema<IUserReward>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['points', 'badge', 'title', 'unlock', 'bonus'],
    required: true
  },
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
  value: {
    type: Number,
    required: true,
    min: 0
  },
  icon: {
    type: String,
    trim: true
  },
  isClaimed: {
    type: Boolean,
    default: false
  },
  claimedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  source: {
    type: String,
    enum: ['achievement', 'level_up', 'streak', 'bonus', 'admin'],
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
AchievementSchema.index({ category: 1, isActive: 1 });
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
UserAchievementSchema.index({ userId: 1, isUnlocked: 1 });
UserLevelSchema.index({ level: -1, experience: -1 });
UserStreakSchema.index({ userId: 1, type: 1 }, { unique: true });
LeaderboardSchema.index({ type: 1, category: 1, isActive: 1 });
UserRewardSchema.index({ userId: 1, isClaimed: 1 });

export const Achievement = mongoose.models.Achievement || mongoose.model<IAchievement>('Achievement', AchievementSchema);
export const UserAchievement = mongoose.models.UserAchievement || mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);
export const UserLevel = mongoose.models.UserLevel || mongoose.model<IUserLevel>('UserLevel', UserLevelSchema);
export const UserStreak = mongoose.models.UserStreak || mongoose.model<IUserStreak>('UserStreak', UserStreakSchema);
export const Leaderboard = mongoose.models.Leaderboard || mongoose.model<ILeaderboard>('Leaderboard', LeaderboardSchema);
export const UserReward = mongoose.models.UserReward || mongoose.model<IUserReward>('UserReward', UserRewardSchema);
