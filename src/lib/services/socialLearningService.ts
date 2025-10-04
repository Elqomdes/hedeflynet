import { 
  StudyGroup,
  StudySession,
  StudyPost,
  StudyResource,
  StudyChallenge,
  IStudyGroup,
  IStudySession,
  IStudyPost,
  IStudyResource,
  IStudyChallenge
} from '@/lib/models/SocialLearning';
import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export interface SocialLearningDashboard {
  groups: {
    id: string;
    name: string;
    description: string;
    subject: string;
    memberCount: number;
    maxMembers: number;
    isMember: boolean;
    recentActivity: Date;
  }[];
  upcomingSessions: {
    id: string;
    title: string;
    subject: string;
    scheduledFor: Date;
    duration: number;
    location: string;
    participantCount: number;
    maxParticipants: number;
  }[];
  recentPosts: {
    id: string;
    title: string;
    content: string;
    author: string;
    type: string;
    subject: string;
    likes: number;
    comments: number;
    createdAt: Date;
  }[];
  challenges: {
    id: string;
    title: string;
    subject: string;
    type: string;
    difficulty: string;
    points: number;
    participantCount: number;
    endDate: Date;
    isParticipating: boolean;
  }[];
  resources: {
    id: string;
    title: string;
    description: string;
    subject: string;
    type: string;
    rating: number;
    downloads: number;
    isVerified: boolean;
  }[];
}

export interface StudyGroupData {
  id: string;
  name: string;
  description: string;
  subject: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  members: {
    id: string;
    name: string;
    avatar?: string;
    joinedAt: Date;
  }[];
  maxMembers: number;
  isPublic: boolean;
  tags: string[];
  rules: {
    title: string;
    description: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  memberCount: number;
  isMember: boolean;
  isCreator: boolean;
}

export class SocialLearningService {
  private static instance: SocialLearningService;

  public static getInstance(): SocialLearningService {
    if (!SocialLearningService.instance) {
      SocialLearningService.instance = new SocialLearningService();
    }
    return SocialLearningService.instance;
  }

  /**
   * Get social learning dashboard data
   */
  async getDashboardData(studentId: string): Promise<SocialLearningDashboard> {
    await connectDB();

    // Get groups
    const groups = await StudyGroup.find({})
      .populate('createdBy', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(10);

    // Get upcoming sessions
    const upcomingSessions = await StudySession.find({
      isActive: true,
      scheduledFor: { $gte: new Date() }
    })
      .populate('groupId', 'name subject')
      .populate('host', 'firstName lastName')
      .sort({ scheduledFor: 1 })
      .limit(5);

    // Get recent posts
    const recentPosts = await StudyPost.find({})
      .populate('authorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get active challenges
    const challenges = await StudyChallenge.find({
      isActive: true,
      endDate: { $gte: new Date() }
    })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get popular resources
    const resources = await StudyResource.find({ isPublic: true })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ downloads: -1 })
      .limit(10);

    return {
      groups: groups.map(group => ({
        id: group._id.toString(),
        name: group.name,
        description: group.description,
        subject: group.subject,
        memberCount: group.members.length,
        maxMembers: group.maxMembers,
        isMember: group.members.some((member: any) => member.toString() === studentId),
        recentActivity: group.updatedAt
      })),
      upcomingSessions: upcomingSessions.map(session => ({
        id: session._id.toString(),
        title: session.title,
        subject: session.subject,
        scheduledFor: session.scheduledFor,
        duration: session.duration,
        location: session.location.details,
        participantCount: session.participants.length,
        maxParticipants: session.maxParticipants
      })),
      recentPosts: recentPosts.map(post => ({
        id: post._id.toString(),
        title: post.title,
        content: post.content.substring(0, 100) + '...',
        author: `${(post.authorId as any).firstName} ${(post.authorId as any).lastName}`,
        type: post.type,
        subject: post.subject,
        likes: post.likes.length,
        comments: post.comments.length,
        createdAt: post.createdAt
      })),
      challenges: challenges.map((challenge: any) => ({
        id: challenge._id.toString(),
        title: challenge.title,
        subject: challenge.subject,
        type: challenge.type,
        difficulty: challenge.difficulty,
        points: challenge.points,
        participantCount: challenge.participants.length,
        endDate: challenge.endDate,
        isParticipating: challenge.participants.some((p: any) => p.studentId.toString() === studentId)
      })),
      resources: resources.map((resource: any) => ({
        id: resource._id.toString(),
        title: resource.title,
        description: resource.description,
        subject: resource.subject,
        type: resource.type,
        rating: resource.rating.average,
        downloads: resource.downloads,
        isVerified: resource.isVerified
      }))
    };
  }

  /**
   * Create a new study group
   */
  async createStudyGroup(studentId: string, groupData: {
    name: string;
    description: string;
    subject: string;
    maxMembers: number;
    isPublic: boolean;
    tags: string[];
    rules: { title: string; description: string; }[];
  }): Promise<IStudyGroup> {
    await connectDB();

    const group = await StudyGroup.create({
      ...groupData,
      createdBy: studentId,
      members: [studentId] // Creator is automatically a member
    });

    return group;
  }

  /**
   * Join a study group
   */
  async joinStudyGroup(studentId: string, groupId: string): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return { success: false, message: 'Grup bulunamadı' };
    }

    if (group.members.length >= group.maxMembers) {
      return { success: false, message: 'Grup dolu' };
    }

    if (group.members.some((member: any) => member.toString() === studentId)) {
      return { success: false, message: 'Zaten bu grubun üyesisiniz' };
    }

    group.members.push(studentId as any);
    await group.save();

    return { success: true, message: 'Gruba başarıyla katıldınız' };
  }

  /**
   * Leave a study group
   */
  async leaveStudyGroup(studentId: string, groupId: string): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return { success: false, message: 'Grup bulunamadı' };
    }

    if (group.createdBy.toString() === studentId) {
      return { success: false, message: 'Grup kurucusu gruptan ayrılamaz' };
    }

    group.members = group.members.filter((member: any) => member.toString() !== studentId);
    await group.save();

    return { success: true, message: 'Gruptan ayrıldınız' };
  }

  /**
   * Create a study session
   */
  async createStudySession(groupId: string, hostId: string, sessionData: {
    title: string;
    description: string;
    subject: string;
    scheduledFor: Date;
    duration: number;
    location: { type: 'online' | 'physical'; details: string };
    maxParticipants: number;
  }): Promise<IStudySession> {
    await connectDB();

    const session = await StudySession.create({
      ...sessionData,
      groupId,
      host: hostId,
      participants: [{ studentId: hostId, status: 'confirmed' }]
    });

    return session;
  }

  /**
   * Join a study session
   */
  async joinStudySession(studentId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const session = await StudySession.findById(sessionId);
    if (!session) {
      return { success: false, message: 'Oturum bulunamadı' };
    }

    if (session.participants.length >= session.maxParticipants) {
      return { success: false, message: 'Oturum dolu' };
    }

    if (session.participants.some((p: any) => p.studentId.toString() === studentId)) {
      return { success: false, message: 'Zaten bu oturuma katıldınız' };
    }

    session.participants.push({
      studentId: studentId as any,
      status: 'confirmed'
    });
    await session.save();

    return { success: true, message: 'Oturuma başarıyla katıldınız' };
  }

  /**
   * Create a study post
   */
  async createStudyPost(authorId: string, postData: {
    groupId?: string;
    type: 'question' | 'answer' | 'resource' | 'discussion' | 'achievement';
    title: string;
    content: string;
    subject: string;
    tags: string[];
    attachments?: { type: 'image' | 'document' | 'link'; url: string; name: string; }[];
  }): Promise<IStudyPost> {
    await connectDB();

    const post = await StudyPost.create({
      ...postData,
      authorId
    });

    return post;
  }

  /**
   * Like a study post
   */
  async likePost(studentId: string, postId: string): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const post = await StudyPost.findById(postId);
    if (!post) {
      return { success: false, message: 'Gönderi bulunamadı' };
    }

    const isLiked = post.likes.some((like: any) => like.toString() === studentId);
    if (isLiked) {
      post.likes = post.likes.filter((like: any) => like.toString() !== studentId);
      await post.save();
      return { success: true, message: 'Beğeni kaldırıldı' };
    } else {
      post.likes.push(studentId as any);
      await post.save();
      return { success: true, message: 'Gönderi beğenildi' };
    }
  }

  /**
   * Comment on a study post
   */
  async commentOnPost(studentId: string, postId: string, content: string): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const post = await StudyPost.findById(postId);
    if (!post) {
      return { success: false, message: 'Gönderi bulunamadı' };
    }

    post.comments.push({
      authorId: studentId as any,
      content,
      createdAt: new Date(),
      likes: []
    });
    await post.save();

    return { success: true, message: 'Yorum eklendi' };
  }

  /**
   * Share a study resource
   */
  async shareResource(uploaderId: string, resourceData: {
    title: string;
    description: string;
    subject: string;
    type: 'document' | 'video' | 'link' | 'quiz' | 'summary';
    url: string;
    groupId?: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    isPublic: boolean;
  }): Promise<any> {
    await connectDB();

    const resource = await StudyResource.create({
      ...resourceData,
      uploadedBy: uploaderId
    });

    return resource;
  }

  /**
   * Join a study challenge
   */
  async joinChallenge(studentId: string, challengeId: string): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const challenge = await StudyChallenge.findById(challengeId);
    if (!challenge) {
      return { success: false, message: 'Meydan okuma bulunamadı' };
    }

    if (!challenge.isActive) {
      return { success: false, message: 'Meydan okuma aktif değil' };
    }

    if (new Date() > challenge.endDate) {
      return { success: false, message: 'Meydan okuma süresi dolmuş' };
    }

    if (challenge.participants.some((p: any) => p.studentId.toString() === studentId)) {
      return { success: false, message: 'Zaten bu meydan okumaya katıldınız' };
    }

    challenge.participants.push({
      studentId: studentId as any,
      joinedAt: new Date()
    });
    await challenge.save();

    return { success: true, message: 'Meydan okumaya katıldınız' };
  }

  /**
   * Get study group details
   */
  async getStudyGroupDetails(groupId: string, studentId: string): Promise<StudyGroupData | null> {
    await connectDB();

    const group = await StudyGroup.findById(groupId)
      .populate('createdBy', 'firstName lastName')
      .populate('members', 'firstName lastName');

    if (!group) return null;

    return {
      id: group._id.toString(),
      name: group.name,
      description: group.description,
      subject: group.subject,
      createdBy: {
        id: (group.createdBy as any)._id.toString(),
        name: `${(group.createdBy as any).firstName} ${(group.createdBy as any).lastName}`
      },
      members: group.members.map((member: any) => ({
        id: (member as any)._id.toString(),
        name: `${(member as any).firstName} ${(member as any).lastName}`,
        joinedAt: new Date() // This would be stored in a separate collection in a real implementation
      })),
      maxMembers: group.maxMembers,
      isPublic: group.isPublic,
      tags: group.tags,
      rules: group.rules,
      isActive: group.isActive,
      createdAt: group.createdAt,
      memberCount: group.members.length,
      isMember: group.members.some((member: any) => member._id.toString() === studentId),
      isCreator: group.createdBy._id.toString() === studentId
    };
  }

  /**
   * Search study groups
   */
  async searchStudyGroups(query: string, subject?: string): Promise<StudyGroupData[]> {
    await connectDB();

    const searchQuery: any = {
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    };

    if (subject) {
      searchQuery.subject = subject;
    }

    const groups = await StudyGroup.find(searchQuery)
      .populate('createdBy', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(20);

    return groups.map(group => ({
      id: group._id.toString(),
      name: group.name,
      description: group.description,
      subject: group.subject,
      createdBy: {
        id: (group.createdBy as any)._id.toString(),
        name: `${(group.createdBy as any).firstName} ${(group.createdBy as any).lastName}`
      },
      members: [],
      maxMembers: group.maxMembers,
      isPublic: group.isPublic,
      tags: group.tags,
      rules: group.rules,
      isActive: group.isActive,
      createdAt: group.createdAt,
      memberCount: group.members.length,
      isMember: false,
      isCreator: false
    }));
  }
}
