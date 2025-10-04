import { 
  Achievement, 
  UserAchievement, 
  UserLevel, 
  UserStreak, 
  Leaderboard, 
  UserReward,
  IAchievement,
  IUserAchievement,
  IUserLevel,
  IUserStreak,
  ILeaderboard,
  IUserReward
} from '@/lib/models/Gamification';
import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export interface GamificationStats {
  level: number;
  experience: number;
  experienceToNext: number;
  totalExperience: number;
  title: string;
  badge: string;
  achievements: {
    total: number;
    unlocked: number;
    recent: IUserAchievement[];
  };
  streaks: {
    study: number;
    assignment: number;
    login: number;
  };
  points: number;
  rank: number;
  nextAchievements: IUserAchievement[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar?: string;
  score: number;
  level: number;
  badge: string;
}

export class GamificationService {
  private static instance: GamificationService;

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  /**
   * Initialize default achievements
   */
  async initializeDefaultAchievements(): Promise<void> {
    await connectDB();
    
    const defaultAchievements = [
      {
        name: 'İlk Adım',
        description: 'İlk ödevinizi tamamladınız!',
        icon: '🎯',
        category: 'assignment',
        points: 10,
        requirements: { type: 'assignments_completed', value: 1 },
        rarity: 'common'
      },
      {
        name: 'Çalışkan Öğrenci',
        description: '5 ödev tamamladınız!',
        icon: '📚',
        category: 'assignment',
        points: 50,
        requirements: { type: 'assignments_completed', value: 5 },
        rarity: 'common'
      },
      {
        name: 'Hedef Avcısı',
        description: 'İlk hedefinizi başardınız!',
        icon: '🎯',
        category: 'goal',
        points: 25,
        requirements: { type: 'goals_achieved', value: 1 },
        rarity: 'common'
      },
      {
        name: 'Hedef Ustası',
        description: '10 hedef başardınız!',
        icon: '🏆',
        category: 'goal',
        points: 100,
        requirements: { type: 'goals_achieved', value: 10 },
        rarity: 'rare'
      },
      {
        name: 'Çalışma Serisi',
        description: '7 gün üst üste çalıştınız!',
        icon: '🔥',
        category: 'streak',
        points: 75,
        requirements: { type: 'study_streak', value: 7 },
        rarity: 'rare'
      },
      {
        name: 'Mükemmel Öğrenci',
        description: '100 puan alan bir ödev yaptınız!',
        icon: '💯',
        category: 'assignment',
        points: 50,
        requirements: { type: 'score_threshold', value: 100 },
        rarity: 'epic'
      },
      {
        name: 'Süper Çalışkan',
        description: '30 gün üst üste çalıştınız!',
        icon: '⭐',
        category: 'streak',
        points: 200,
        requirements: { type: 'study_streak', value: 30 },
        rarity: 'legendary'
      },
      {
        name: 'Matematik Ustası',
        description: 'Matematik dersinde 10 ödev tamamladınız!',
        icon: '🔢',
        category: 'study',
        points: 75,
        requirements: { type: 'assignments_completed', value: 10, subject: 'Matematik' },
        rarity: 'rare'
      },
      {
        name: 'Fen Bilimleri Uzmanı',
        description: 'Fen Bilimleri dersinde 10 ödev tamamladınız!',
        icon: '🧪',
        category: 'study',
        points: 75,
        requirements: { type: 'assignments_completed', value: 10, subject: 'Fen Bilimleri' },
        rarity: 'rare'
      },
      {
        name: 'Türkçe Şampiyonu',
        description: 'Türkçe dersinde 10 ödev tamamladınız!',
        icon: '📝',
        category: 'study',
        points: 75,
        requirements: { type: 'assignments_completed', value: 10, subject: 'Türkçe' },
        rarity: 'rare'
      }
    ];

    for (const achievementData of defaultAchievements) {
      const existingAchievement = await Achievement.findOne({ name: achievementData.name });
      if (!existingAchievement) {
        await Achievement.create(achievementData);
      }
    }
  }

  /**
   * Get user gamification stats
   */
  async getUserStats(userId: string): Promise<GamificationStats> {
    await connectDB();
    
    const userLevel = await UserLevel.findOne({ userId }).lean();
    const userAchievements = await UserAchievement.find({ userId }).populate('achievementId').lean();
    const userStreaks = await UserStreak.find({ userId }).lean();
    
    const unlockedAchievements = userAchievements.filter(ua => ua.isUnlocked);
    const recentAchievements = unlockedAchievements
      .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
      .slice(0, 5);
    
    const nextAchievements = await this.getNextAchievements(userId);
    
    const studyStreak = userStreaks.find(s => s.type === 'study')?.currentStreak || 0;
    const assignmentStreak = userStreaks.find(s => s.type === 'assignment')?.currentStreak || 0;
    const loginStreak = userStreaks.find(s => s.type === 'login')?.currentStreak || 0;
    
    const totalPoints = unlockedAchievements.reduce((sum, ua) => {
      const achievement = ua.achievementId as any;
      return sum + (achievement?.points || 0);
    }, 0);
    
    const rank = await this.getUserRank(userId, 'experience');
    
    return {
      level: (userLevel as any)?.level || 1,
      experience: (userLevel as any)?.experience || 0,
      experienceToNext: (userLevel as any)?.experienceToNext || 100,
      totalExperience: (userLevel as any)?.totalExperience || 0,
      title: (userLevel as any)?.title || 'Yeni Başlayan',
      badge: (userLevel as any)?.badge || '🌟',
      achievements: {
        total: userAchievements.length,
        unlocked: unlockedAchievements.length,
        recent: recentAchievements as any
      },
      streaks: {
        study: studyStreak,
        assignment: assignmentStreak,
        login: loginStreak
      },
      points: totalPoints,
      rank,
      nextAchievements
    };
  }

  /**
   * Add experience points to user
   */
  async addExperience(userId: string, points: number, source: string): Promise<{
    leveledUp: boolean;
    newLevel?: number;
    newTitle?: string;
    rewards?: IUserReward[];
  }> {
    await connectDB();
    
    let userLevel = await UserLevel.findOne({ userId });
    if (!userLevel) {
      userLevel = await UserLevel.create({
        userId,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        totalExperience: 0,
        title: 'Yeni Başlayan',
        badge: '🌟'
      });
    }
    
    const oldLevel = userLevel.level;
    userLevel.experience += points;
    userLevel.totalExperience += points;
    
    // Check for level up
    let leveledUp = false;
    let newLevel = oldLevel;
    let newTitle = userLevel.title;
    const rewards: IUserReward[] = [];
    
    while (userLevel.experience >= userLevel.experienceToNext) {
      userLevel.experience -= userLevel.experienceToNext;
      userLevel.level += 1;
      leveledUp = true;
      newLevel = userLevel.level;
      
      // Calculate new experience requirement (exponential growth)
      userLevel.experienceToNext = Math.floor(100 * Math.pow(1.2, userLevel.level - 1));
      
      // Update title and badge based on level
      const levelData = this.getLevelData(userLevel.level);
      userLevel.title = levelData.title;
      userLevel.badge = levelData.badge;
      newTitle = levelData.title;
      
      // Create level up reward
      const reward = await UserReward.create({
        userId,
        type: 'points',
        name: `Seviye ${userLevel.level} Ödülü`,
        description: `Seviye ${userLevel.level}'e ulaştınız!`,
        value: userLevel.level * 10,
        icon: levelData.badge,
        source: 'level_up'
      });
      rewards.push(reward);
    }
    
    await userLevel.save();
    
    // Check for achievements
    await this.checkAchievements(userId, source);
    
    return {
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      newTitle: leveledUp ? newTitle : undefined,
      rewards: leveledUp ? rewards : undefined
    };
  }

  /**
   * Update user streak
   */
  async updateStreak(userId: string, type: 'study' | 'assignment' | 'login'): Promise<{
    streakUpdated: boolean;
    newStreak: number;
    isNewRecord: boolean;
  }> {
    await connectDB();
    
    let userStreak = await UserStreak.findOne({ userId, type });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (!userStreak) {
      userStreak = await UserStreak.create({
        userId,
        type,
        currentStreak: 1,
        longestStreak: 1,
        lastActivity: now,
        streakStartDate: now,
        isActive: true
      });
      
      return {
        streakUpdated: true,
        newStreak: 1,
        isNewRecord: true
      };
    }
    
    const lastActivity = new Date(userStreak.lastActivity);
    const lastActivityDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
    const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let streakUpdated = false;
    let isNewRecord = false;
    
    if (daysDiff === 1) {
      // Continue streak
      userStreak.currentStreak += 1;
      userStreak.lastActivity = now;
      streakUpdated = true;
      
      if (userStreak.currentStreak > userStreak.longestStreak) {
        userStreak.longestStreak = userStreak.currentStreak;
        isNewRecord = true;
      }
    } else if (daysDiff > 1) {
      // Reset streak
      userStreak.currentStreak = 1;
      userStreak.streakStartDate = now;
      userStreak.lastActivity = now;
      streakUpdated = true;
    }
    
    await userStreak.save();
    
    return {
      streakUpdated,
      newStreak: userStreak.currentStreak,
      isNewRecord
    };
  }

  /**
   * Check and unlock achievements
   */
  async checkAchievements(userId: string, source: string): Promise<IUserAchievement[]> {
    await connectDB();
    
    const achievements = await Achievement.find({ isActive: true });
    const unlockedAchievements: IUserAchievement[] = [];
    
    for (const achievement of achievements) {
      const userAchievement = await UserAchievement.findOne({ userId, achievementId: achievement._id });
      
      if (userAchievement && userAchievement.isUnlocked) {
        continue; // Already unlocked
      }
      
      const progress = await this.calculateAchievementProgress(userId, achievement);
      
      if (userAchievement) {
        userAchievement.progress = progress;
        if (progress >= 100 && !userAchievement.isUnlocked) {
          userAchievement.isUnlocked = true;
          userAchievement.unlockedAt = new Date();
          await userAchievement.save();
          unlockedAchievements.push(userAchievement);
          
          // Add experience points for achievement
          await this.addExperience(userId, achievement.points, 'achievement');
        } else {
          await userAchievement.save();
        }
      } else {
        const newUserAchievement = await UserAchievement.create({
          userId,
          achievementId: achievement._id,
          progress,
          isUnlocked: progress >= 100,
          unlockedAt: progress >= 100 ? new Date() : undefined
        });
        
        if (progress >= 100) {
          unlockedAchievements.push(newUserAchievement);
          await this.addExperience(userId, achievement.points, 'achievement');
        }
      }
    }
    
    return unlockedAchievements;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(type: 'weekly' | 'monthly' | 'all_time', category: 'experience' | 'achievements' | 'streaks' | 'assignments'): Promise<LeaderboardEntry[]> {
    await connectDB();
    
    let leaderboard = await Leaderboard.findOne({ type, category, isActive: true });
    
    if (!leaderboard || this.isLeaderboardExpired(leaderboard)) {
      leaderboard = await this.generateLeaderboard(type, category);
    }
    
    return leaderboard.entries.map((entry: any) => ({
      rank: entry.rank,
      userId: entry.userId.toString(),
      displayName: entry.displayName,
      avatar: entry.avatar,
      score: entry.score,
      level: 0, // Will be populated separately
      badge: '🌟' // Will be populated separately
    }));
  }

  /**
   * Get next available achievements for user
   */
  private async getNextAchievements(userId: string): Promise<IUserAchievement[]> {
    const userAchievements = await UserAchievement.find({ userId, isUnlocked: false })
      .populate('achievementId')
      .sort({ progress: -1 })
      .limit(5)
      .lean();
    
    return userAchievements as any;
  }

  /**
   * Get user rank in leaderboard
   */
  private async getUserRank(userId: string, category: string): Promise<number> {
    const leaderboard = await Leaderboard.findOne({ category, isActive: true });
    if (!leaderboard) return 0;
    
    const entry = leaderboard.entries.find((e: any) => e.userId.toString() === userId);
    return entry?.rank || 0;
  }

  /**
   * Calculate achievement progress
   */
  private async calculateAchievementProgress(userId: string, achievement: IAchievement): Promise<number> {
    // This is a simplified version - in a real implementation, you'd query the database
    // based on the achievement requirements and calculate the actual progress
    
    switch (achievement.requirements.type) {
      case 'assignments_completed':
        // Query assignments completed by user
        return Math.min(100, Math.random() * 100); // Placeholder
      case 'goals_achieved':
        // Query goals achieved by user
        return Math.min(100, Math.random() * 100); // Placeholder
      case 'study_streak':
        // Query study streak
        return Math.min(100, Math.random() * 100); // Placeholder
      case 'score_threshold':
        // Query highest score achieved
        return Math.min(100, Math.random() * 100); // Placeholder
      default:
        return 0;
    }
  }

  /**
   * Generate new leaderboard
   */
  private async generateLeaderboard(type: string, category: string): Promise<ILeaderboard> {
    // Implementation would query user data and create leaderboard
    // This is a placeholder
    return await Leaderboard.create({
      type,
      category,
      entries: [],
      period: {
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      isActive: true
    });
  }

  /**
   * Check if leaderboard is expired
   */
  private isLeaderboardExpired(leaderboard: ILeaderboard): boolean {
    return new Date() > leaderboard.period.end;
  }

  /**
   * Get level data based on level number
   */
  private getLevelData(level: number): { title: string; badge: string } {
    if (level >= 50) return { title: 'Efsanevi Öğrenci', badge: '👑' };
    if (level >= 40) return { title: 'Usta Öğrenci', badge: '🏆' };
    if (level >= 30) return { title: 'Deneyimli Öğrenci', badge: '⭐' };
    if (level >= 20) return { title: 'Gelişmiş Öğrenci', badge: '🔥' };
    if (level >= 10) return { title: 'Orta Seviye Öğrenci', badge: '📚' };
    if (level >= 5) return { title: 'Başlangıç Öğrenci', badge: '🌟' };
    return { title: 'Yeni Başlayan', badge: '🌱' };
  }
}
