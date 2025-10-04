'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, MessageSquare, Trophy, BookOpen, Plus, Search, Filter } from 'lucide-react';

interface SocialLearningDashboard {
  groups: {
    id: string;
    name: string;
    description: string;
    subject: string;
    memberCount: number;
    maxMembers: number;
    isMember: boolean;
    recentActivity: string;
  }[];
  upcomingSessions: {
    id: string;
    title: string;
    subject: string;
    scheduledFor: string;
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
    createdAt: string;
  }[];
  challenges: {
    id: string;
    title: string;
    subject: string;
    type: string;
    difficulty: string;
    points: number;
    participantCount: number;
    endDate: string;
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

export default function SocialLearningWidget() {
  const [data, setData] = useState<SocialLearningDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'groups' | 'sessions' | 'posts' | 'challenges' | 'resources'>('groups');

  useEffect(() => {
    fetchSocialLearningData();
  }, []);

  const fetchSocialLearningData = async () => {
    try {
      const response = await fetch('/api/student/social-learning');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Social learning data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupAction = async (groupId: string, action: string) => {
    try {
      await fetch('/api/student/social-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data: { groupId }
        })
      });
      fetchSocialLearningData();
    } catch (error) {
      console.error('Group action error:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return '❓';
      case 'answer': return '💡';
      case 'resource': return '📚';
      case 'discussion': return '💬';
      case 'achievement': return '🏆';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="card-header">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary-600" />
            Sosyal Öğrenme
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-secondary-600">Sosyal öğrenme verileri yüklenemedi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center">
          <Users className="w-5 h-5 mr-2 text-primary-600" />
          Sosyal Öğrenme
        </h3>
        <p className="text-sm text-secondary-600 mt-1">
          Gruplar, oturumlar ve topluluk etkileşimi
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'groups'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gruplar ({data.groups.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Oturumlar ({data.upcomingSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'posts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gönderiler ({data.recentPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'challenges'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Meydan Okumalar ({data.challenges.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'resources'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kaynaklar ({data.resources.length})
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-lg">Çalışma Grupları</h4>
              <button className="btn-primary btn-sm">
                <Plus className="w-4 h-4 mr-1" />
                Grup Oluştur
              </button>
            </div>
            {data.groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz grup bulunmuyor</p>
              </div>
            ) : (
              data.groups.map((group) => (
                <div key={group.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-secondary-900 mb-1">{group.name}</h5>
                      <p className="text-sm text-secondary-600 mb-2">{group.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500">
                        <span>{group.subject}</span>
                        <span>{group.memberCount}/{group.maxMembers} üye</span>
                        <span className={`px-2 py-1 rounded-full ${group.isMember ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {group.isMember ? 'Üyesiniz' : 'Üye değilsiniz'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {group.isMember ? (
                        <button
                          onClick={() => handleGroupAction(group.id, 'leave_group')}
                          className="btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Ayrıl
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGroupAction(group.id, 'join_group')}
                          className="btn-primary btn-sm"
                        >
                          Katıl
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-lg">Yaklaşan Oturumlar</h4>
              <button className="btn-primary btn-sm">
                <Plus className="w-4 h-4 mr-1" />
                Oturum Oluştur
              </button>
            </div>
            {data.upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Yaklaşan oturum bulunmuyor</p>
              </div>
            ) : (
              data.upcomingSessions.map((session) => (
                <div key={session.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-secondary-900 mb-1">{session.title}</h5>
                      <p className="text-sm text-secondary-600 mb-2">{session.subject}</p>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500">
                        <span>{new Date(session.scheduledFor).toLocaleDateString('tr-TR')}</span>
                        <span>{session.duration} dk</span>
                        <span>{session.location}</span>
                        <span>{session.participantCount}/{session.maxParticipants} katılımcı</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button className="btn-primary btn-sm">
                        Katıl
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-lg">Son Gönderiler</h4>
              <button className="btn-primary btn-sm">
                <Plus className="w-4 h-4 mr-1" />
                Gönderi Oluştur
              </button>
            </div>
            {data.recentPosts.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz gönderi bulunmuyor</p>
              </div>
            ) : (
              data.recentPosts.map((post) => (
                <div key={post.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getTypeIcon(post.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-semibold text-secondary-900">{post.title}</h5>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {post.type}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-600 mb-2">{post.content}</p>
                      <div className="flex items-center justify-between text-xs text-secondary-500">
                        <div className="flex items-center space-x-4">
                          <span>{post.author}</span>
                          <span>{post.subject}</span>
                          <span>{new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>👍 {post.likes}</span>
                          <span>💬 {post.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-lg">Aktif Meydan Okumalar</h4>
              <button className="btn-primary btn-sm">
                <Plus className="w-4 h-4 mr-1" />
                Meydan Okuma Oluştur
              </button>
            </div>
            {data.challenges.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aktif meydan okuma bulunmuyor</p>
              </div>
            ) : (
              data.challenges.map((challenge) => (
                <div key={challenge.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-secondary-900 mb-1">{challenge.title}</h5>
                      <p className="text-sm text-secondary-600 mb-2">{challenge.subject}</p>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500 mb-2">
                        <span className={`px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                          {challenge.difficulty}
                        </span>
                        <span>{challenge.type}</span>
                        <span>{challenge.points} puan</span>
                        <span>{challenge.participantCount} katılımcı</span>
                      </div>
                      <div className="text-xs text-secondary-500">
                        Bitiş: {new Date(challenge.endDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <div className="ml-4">
                      {challenge.isParticipating ? (
                        <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Katılıyorsunuz
                        </span>
                      ) : (
                        <button className="btn-primary btn-sm">
                          Katıl
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-lg">Popüler Kaynaklar</h4>
              <button className="btn-primary btn-sm">
                <Plus className="w-4 h-4 mr-1" />
                Kaynak Paylaş
              </button>
            </div>
            {data.resources.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz kaynak bulunmuyor</p>
              </div>
            ) : (
              data.resources.map((resource) => (
                <div key={resource.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-semibold text-secondary-900">{resource.title}</h5>
                        {resource.isVerified && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            ✓ Doğrulanmış
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-secondary-600 mb-2">{resource.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500">
                        <span>{resource.subject}</span>
                        <span>{resource.type}</span>
                        <span>⭐ {resource.rating.toFixed(1)}</span>
                        <span>📥 {resource.downloads}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button className="btn-outline btn-sm">
                        İncele
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
