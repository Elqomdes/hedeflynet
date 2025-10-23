'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, User, Calendar, CheckCircle, Clock, AlertCircle, Edit3, Trash2, BookOpen, Users, Zap, Star, Link, Bell, Filter, Search, ArrowUpDown } from 'lucide-react';
import WeekCalendar from '@/components/WeekCalendar';

interface Goal {
  _id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  category: 'academic' | 'behavioral' | 'skill' | 'personal' | 'other';
  priority: 'low' | 'medium' | 'high';
  assignmentId?: {
    _id: string;
    title: string;
    dueDate: string;
  };
  assignments?: {
    _id: string;
    title: string;
    dueDate: string;
    type: 'individual' | 'class';
    maxGrade?: number;
  }[];
  successCriteria: string;
  parentNotificationSent: boolean;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TeacherGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'academic' | 'behavioral' | 'skill' | 'personal' | 'other'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'progress' | 'student'>('date');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  useEffect(() => {
    fetchGoals();
    fetchStudents();
    fetchAssignments();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/teacher/goals', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setGoals(data || []);
      } else {
        console.error('Goals fetch failed:', response.status);
        setGoals([]);
      }
    } catch (error) {
      console.error('Goals fetch error:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data || []);
      } else {
        console.error('Students fetch failed:', response.status);
        setStudents([]);
      }
    } catch (error) {
      console.error('Students fetch error:', error);
      setStudents([]);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/teacher/assignments', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data || []);
      } else {
        console.error('Assignments fetch failed:', response.status);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Assignments fetch error:', error);
      setAssignments([]);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Bu hedefi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/goals/${goalId}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (response.ok) {
        setGoals(goals.filter(g => g._id !== goalId));
      }
    } catch (error) {
      console.error('Delete goal error:', error);
    }
  };

  const handleUpdateGoal = async (goalId: string, data: any) => {
    try {
      const response = await fetch(`/api/teacher/goals/${goalId}`, {
        method: 'PUT',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        fetchGoals();
        setEditingGoal(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Hedef güncellenemedi');
      }
    } catch (error) {
      console.error('Update goal error:', error);
      alert('Hedef güncellenemedi');
    }
  };

  const handleNotifyParent = async (goalId: string, message?: string) => {
    try {
      const response = await fetch(`/api/teacher/goals/${goalId}/notify-parent`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        alert('Veliye bildirim gönderildi');
        fetchGoals();
      } else {
        const error = await response.json();
        alert(error.error || 'Bildirim gönderilemedi');
      }
    } catch (error) {
      console.error('Notify parent error:', error);
      alert('Bildirim gönderilemedi');
    }
  };

  const handleLinkAssignment = async (goalId: string, assignmentId: string) => {
    try {
      const response = await fetch(`/api/teacher/goals/${goalId}/link-assignment`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ assignmentId })
      });

      if (response.ok) {
        alert('Ödev başarıyla bağlandı');
        fetchGoals();
      } else {
        const error = await response.json();
        alert(error.error || 'Ödev bağlanamadı');
      }
    } catch (error) {
      console.error('Link assignment error:', error);
      alert('Ödev bağlanamadı');
    }
  };

  const getStatusIcon = (goal: Goal) => {
    switch (goal.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Target className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (goal: Goal) => {
    switch (goal.status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bekliyor';
    }
  };

  const getStatusColor = (goal: Goal) => {
    switch (goal.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return <BookOpen className="h-4 w-4" />;
      case 'behavioral':
        return <Users className="h-4 w-4" />;
      case 'skill':
        return <Zap className="h-4 w-4" />;
      case 'personal':
        return <Star className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'academic':
        return 'Akademik';
      case 'behavioral':
        return 'Davranışsal';
      case 'skill':
        return 'Beceri';
      case 'personal':
        return 'Kişisel';
      default:
        return 'Diğer';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return 'Belirtilmemiş';
    }
  };

  const filteredGoals = goals.filter(goal => {
    // Status filter
    if (filter !== 'all' && goal.status !== filter) return false;
    
    // Category filter
    if (categoryFilter !== 'all' && goal.category !== categoryFilter) return false;
    
    // Priority filter
    if (priorityFilter !== 'all' && goal.priority !== priorityFilter) return false;
    
    // Search filter
    if (searchTerm && !goal.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !goal.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !goal.studentId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !goal.studentId.lastName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Student filter
    if (selectedStudentId && goal.studentId._id !== selectedStudentId) return false;
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case 'progress':
        return b.progress - a.progress;
      case 'student':
        return `${a.studentId.firstName} ${a.studentId.lastName}`.localeCompare(`${b.studentId.firstName} ${b.studentId.lastName}`);
      case 'date':
      default:
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    }
  });

  const weekItems = filteredGoals
    .filter(g => !selectedStudentId || g.studentId._id === selectedStudentId)
    .map(g => ({
    _id: g._id,
    title: g.title,
    date: g.targetDate,
    status: g.status
  }));

  // Add assignments to calendar items
  const assignmentItems = filteredGoals
    .filter(g => !selectedStudentId || g.studentId._id === selectedStudentId)
    .flatMap(g => 
      g.assignments?.map(assignment => ({
        _id: `assignment-${assignment._id}`,
        title: `📝 ${assignment.title}`,
        date: assignment.dueDate,
        status: 'pending' as const
      })) || []
    );

  const allWeekItems = [...weekItems, ...assignmentItems];

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date() && !goals.find(g => g.targetDate === targetDate)?.status.includes('completed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
              <Target className="h-8 w-8 mr-3 text-primary-600" />
              Hedef Yönetimi
            </h1>
            <p className="mt-2 text-secondary-600">
              Öğrencilerinizin hedeflerini takip edin ve yönetin
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Hedef
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Hedef ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 w-full border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Student Filter */}
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Tüm Öğrenciler</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Bekleyen</option>
            <option value="in_progress">Devam Eden</option>
            <option value="completed">Tamamlanan</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="academic">Akademik</option>
            <option value="behavioral">Davranışsal</option>
            <option value="skill">Beceri</option>
            <option value="personal">Kişisel</option>
            <option value="other">Diğer</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Tüm Öncelikler</option>
            <option value="high">Yüksek</option>
            <option value="medium">Orta</option>
            <option value="low">Düşük</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-secondary-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="date">Tarihe Göre</option>
              <option value="priority">Önceliğe Göre</option>
              <option value="progress">İlerlemeye Göre</option>
              <option value="student">Öğrenciye Göre</option>
            </select>
          </div>

          <div className="text-sm text-secondary-500">
            {filteredGoals.length} hedef bulundu
          </div>
        </div>
      </div>

      <div>
        <WeekCalendar
          items={allWeekItems}
          onSelectDate={(iso) => { if (!selectedStudentId) return; setSelectedDate(iso); setShowCreateForm(true); }}
          emptyText={selectedStudentId ? 'Hedef yok' : 'Öğrenci seçiniz'}
        />
      </div>

      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Hedef bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            {filter === 'all' 
              ? 'Henüz bir hedef oluşturmadınız.'
              : 'Bu kategoride hedef bulunmuyor.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredGoals.map((goal) => (
            <div key={goal._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(goal)}
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {goal.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(goal)}`}>
                      {getStatusText(goal)}
                    </span>
                    {isOverdue(goal.targetDate) && goal.status !== 'completed' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Süresi Geçmiş
                      </span>
                    )}
                  </div>

                  {/* Category and Priority */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200`}>
                      {getCategoryIcon(goal.category)}
                      <span className="ml-1">{getCategoryText(goal.category)}</span>
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(goal.priority)}`}>
                      {getPriorityText(goal.priority)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-secondary-600 mb-4">
                    {goal.description}
                  </p>

                  {/* Success Criteria */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-secondary-700 mb-1">Başarı Kriterleri:</h4>
                    <p className="text-sm text-secondary-600">{goal.successCriteria}</p>
                  </div>
                  
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-secondary-600 mb-2">
                      <span>İlerleme</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Assignment Links */}
                  {goal.assignments && goal.assignments.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-2">
                        <Link className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Bağlı Ödevler:</span>
                      </div>
                      <div className="space-y-2">
                        {goal.assignments.map((assignment) => (
                          <div key={assignment._id} className="flex items-center justify-between bg-white p-2 rounded border border-blue-100">
                            <div className="flex items-center">
                              <span className="text-sm text-blue-700 font-medium">{assignment.title}</span>
                              <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {assignment.type === 'individual' ? 'Bireysel' : 'Sınıf'}
                              </span>
                            </div>
                            <div className="text-xs text-blue-600">
                              Teslim: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Legacy Assignment Link (for backward compatibility) */}
                  {goal.assignmentId && !goal.assignments && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <Link className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Bağlı Ödev:</span>
                        <span className="text-sm text-blue-700 ml-2">{goal.assignmentId.title}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(goal.targetDate).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {goal.studentId.firstName} {goal.studentId.lastName}
                    </div>
                    {goal.parentNotificationSent && (
                      <div className="flex items-center text-green-600">
                        <Bell className="h-4 w-4 mr-1" />
                        Veliye Bildirildi
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="ml-4 flex flex-col space-y-2">
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleNotifyParent(goal._id)}
                    className="p-2 text-secondary-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Veliye Bildir"
                  >
                    <Bell className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal._id)}
                    className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Goal Modal */}
      {(showCreateForm || editingGoal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-xl rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-secondary-900">
                  {editingGoal ? 'Hedefi Düzenle' : 'Yeni Hedef Oluştur'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingGoal(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const goalData = {
                  title: formData.get('title'),
                  description: formData.get('description'),
                  targetDate: formData.get('targetDate'),
                  studentId: formData.get('studentId'),
                  category: formData.get('category'),
                  priority: formData.get('priority'),
                  assignmentId: formData.get('assignmentId') || null,
                  successCriteria: formData.get('successCriteria')
                };

                try {
                  if (editingGoal) {
                    await handleUpdateGoal(editingGoal._id, goalData);
                  } else {
                    const response = await fetch('/api/teacher/goals', {
                      method: 'POST',
                      credentials: 'include',
                      cache: 'no-store',
                      headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                      },
                      body: JSON.stringify(goalData)
                    });

                    if (response.ok) {
                      fetchGoals();
                      setShowCreateForm(false);
                    } else {
                      const error = await response.json();
                      alert(error.error || 'Hedef oluşturulamadı');
                    }
                  }
                } catch (error) {
                  console.error('Goal operation error:', error);
                  alert('İşlem başarısız');
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Başlık
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingGoal?.title || ''}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingGoal?.description || ''}
                      rows={3}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Öğrenci
                    </label>
                    <select
                      name="studentId"
                      defaultValue={editingGoal?.studentId._id || selectedStudentId || ''}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Öğrenci seçin</option>
                      {students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.firstName} {student.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Hedef Tarihi
                    </label>
                    <input
                      type="datetime-local"
                      name="targetDate"
                      defaultValue={(() => {
                        if (editingGoal?.targetDate) {
                          const d = new Date(editingGoal.targetDate);
                          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        }
                        if (selectedDate) {
                          return `${selectedDate}T09:00`;
                        }
                        return '';
                      })()}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Kategori
                    </label>
                    <select
                      name="category"
                      defaultValue={editingGoal?.category || 'academic'}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="academic">Akademik</option>
                      <option value="behavioral">Davranışsal</option>
                      <option value="skill">Beceri</option>
                      <option value="personal">Kişisel</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Öncelik
                    </label>
                    <select
                      name="priority"
                      defaultValue={editingGoal?.priority || 'medium'}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Başarı Kriterleri
                    </label>
                    <textarea
                      name="successCriteria"
                      defaultValue={editingGoal?.successCriteria || ''}
                      rows={2}
                      placeholder="Bu hedefin başarılı sayılması için hangi kriterlerin sağlanması gerekiyor?"
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Ödev Bağlantısı (Opsiyonel)
                    </label>
                    <select
                      name="assignmentId"
                      defaultValue={editingGoal?.assignmentId?._id || ''}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Ödev seçin (opsiyonel)</option>
                      {assignments.map((assignment) => (
                        <option key={assignment._id} value={assignment._id}>
                          {assignment.title} - {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingGoal(null);
                    }}
                    className="px-4 py-2 border border-secondary-300 rounded-lg shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    {editingGoal ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
