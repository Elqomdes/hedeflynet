export { default as User } from './User';
export { default as TeacherApplication } from './TeacherApplication';
export { default as Class } from './Class';
export { default as Assignment } from './Assignment';
export { default as AssignmentSubmission } from './AssignmentSubmission';
export { default as Goal } from './Goal';
export { default as Plan } from './Plan';
export { default as Report } from './Report';
export { AIRecommendation } from './AIRecommendation';
export type { IAIRecommendation } from './AIRecommendation';

// New models for v3.4 features
export { 
  Achievement, 
  UserAchievement, 
  UserLevel, 
  UserStreak, 
  Leaderboard, 
  UserReward
} from './Gamification';
export type {
  IAchievement,
  IUserAchievement,
  IUserLevel,
  IUserStreak,
  ILeaderboard,
  IUserReward
} from './Gamification';
export { Parent, ParentNotification, ParentReport } from './Parent';
export type { IParent, IParentNotification, IParentReport } from './Parent';
export { 
  StudyGroup, 
  StudySession,
  StudyPost,
  StudyResource,
  StudyChallenge,
  StudyNotification
} from './SocialLearning';
export type { 
  IStudyGroup,
  IStudySession,
  IStudyPost,
  IStudyResource,
  IStudyChallenge,
  IStudyNotification
} from './SocialLearning';
export { 
  VideoSession, 
  VideoRecording, 
  VideoResource, 
  VideoAnalytics
} from './VideoCoaching';
export type {
  IVideoSession,
  IVideoRecording,
  IVideoResource,
  IVideoAnalytics
} from './VideoCoaching';
export { 
  LearningPath, 
  LearningModule, 
  StudentLearningProfile, 
  AdaptiveRecommendation, 
  AdaptiveAssessment
} from './AdaptiveLearning';
export type {
  ILearningPath,
  ILearningModule,
  IStudentLearningProfile,
  IAdaptiveRecommendation,
  IAdaptiveAssessment
} from './AdaptiveLearning';
