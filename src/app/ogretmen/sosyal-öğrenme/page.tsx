'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, Users, Calendar, BookOpen, Plus, Settings, Heart, MessageCircle } from 'lucide-react';

interface SocialPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  type: 'question' | 'discussion' | 'resource' | 'announcement';
  subject: string;
  likes: number;
  comments: number;
  createdAt: string;
  tags: string[];
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  memberCount: number;
  maxMembers: number;
  isActive: boolean;
  createdAt: string;
}

interface SocialStats {
  totalPosts: number;
  totalGroups: number;
  activeUsers: number;
  totalInteractions: number;
  mostActiveSubject: string;
  recentActivity: number;
}

export default function SocialLearningPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [stats, setStats] = useState<SocialStats>({
    totalPosts: 0,
    totalGroups: 0,
    activeUsers: 0,
    totalInteractions: 0,
    mostActiveSubject: '',
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'question' | 'discussion' | 'resource' | 'announcement'>('all');

  const fetchSocialData = useCallback(async () => {
    try {
      // Sosyal öğrenme istatistiklerini getir
      const statsResponse = await fetch('/api/teacher/social-learning/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prevStats => statsData.data || prevStats);
      }

      // Gönderileri getir
      const postsResponse = await fetch('/api/teacher/social-learning/posts');
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData.data || []);
      }

      // Çalışma gruplarını getir
      const groupsResponse = await fetch('/api/teacher/social-learning/groups');
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(groupsData.data || []);
      }
    } catch (error) {
      console.error('Social learning data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocialData();
  }, [fetchSocialData]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <MessageCircle className="w-5 h-5" />;
      case 'discussion': return <MessageSquare className="w-5 h-5" />;
      case 'resource': return <BookOpen className="w-5 h-5" />;
      case 'announcement': return <Calendar className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'question': return 'text-blue-600 bg-blue-50';
      case 'discussion': return 'text-green-600 bg-green-50';
      case 'resource': return 'text-purple-600 bg-purple-50';
      case 'announcement': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'question': return 'Soru';
      case 'discussion': return 'Tartışma';
      case 'resource': return 'Kaynak';
      case 'announcement': return 'Duyuru';
      default: return 'Gönderi';
    }
  };

  const filteredPosts = useMemo(() => {
    return (posts || []).filter(post => {
      if (selectedFilter === 'all') return true;
      return post.type === selectedFilter;
    });
  }, [posts, selectedFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Sosyal Öğrenme</h1>
        <p className="text-lg text-secondary-600">
          Çalışma grupları, topluluk gönderileri ve işbirlikçi öğrenme
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="card card-hover animate-scale-in">
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-blue-500 shadow-lg">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Toplam Gönderi</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalPosts}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-green-500 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Çalışma Grubu</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalGroups}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-purple-500 shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Etkileşim</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalInteractions}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-orange-500 shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Aktif Kullanıcı</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Posts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-900">Topluluk Gönderileri</h2>
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Yeni Gönderi</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-secondary-100 p-1 rounded-lg w-fit">
              {[
                { key: 'all' as const, label: 'Tümü' },
                { key: 'question' as const, label: 'Sorular' },
                { key: 'discussion' as const, label: 'Tartışmalar' },
                { key: 'resource' as const, label: 'Kaynaklar' },
                { key: 'announcement' as const, label: 'Duyurular' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedFilter === filter.key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="card text-center py-12">
                <MessageSquare className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">Henüz gönderi yok</h3>
                <p className="text-secondary-600">İlk gönderiyi oluşturmak için yukarıdaki butona tıklayın.</p>
              </div>
            ) : (
              filteredPosts.map((post, index) => (
                <div key={post.id} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getTypeIcon(post.type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-secondary-900">{post.title}</h3>
                          <p className="text-sm text-secondary-600">{post.author} • {post.subject}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(post.type)}`}>
                        {getTypeText(post.type)}
                      </span>
                    </div>

                    <p className="text-secondary-600 mb-4 line-clamp-3">{post.content}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-secondary-500">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </div>
                        <span>{new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex space-x-2">
                        {post.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-secondary-100 text-secondary-600 text-xs rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Study Groups */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-secondary-900">Çalışma Grupları</h2>
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Yeni Grup</span>
            </button>
          </div>

          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="card text-center py-8">
                <Users className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">Henüz grup yok</h3>
                <p className="text-secondary-600 text-sm">İlk çalışma grubunu oluşturun.</p>
              </div>
            ) : (
              (groups || []).map((group, index) => (
                <div key={group.id} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-secondary-900">{group.name}</h3>
                        <p className="text-sm text-secondary-600">{group.subject}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 mb-3 line-clamp-2">{group.description}</p>
                    <div className="flex items-center justify-between text-sm text-secondary-500">
                      <span>{group.memberCount}/{group.maxMembers} üye</span>
                      <span>{new Date(group.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
