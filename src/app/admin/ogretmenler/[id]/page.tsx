'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  UserCheck, 
  Mail, 
  Phone, 
  Calendar, 
  BookOpen, 
  FileText, 
  Target,
  BarChart3,
  Activity,
  UserPlus,
  UserMinus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface Teacher {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  classId?: string;
  className?: string;
}

interface Parent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  children: string[];
  createdAt: string;
}

interface Class {
  _id: string;
  name: string;
  description: string;
  studentCount: number;
  createdAt: string;
}

interface TeacherStats {
  totalStudents: number;
  totalClasses: number;
  totalAssignments: number;
  totalGoals: number;
  activeStudents: number;
  recentActivity: number;
}

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'parents' | 'classes' | 'stats'>('students');

  const fetchTeacherDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch teacher details
      const teacherResponse = await fetch(`/api/admin/teachers/${teacherId}`);
      if (teacherResponse.ok) {
        const teacherData = await teacherResponse.json();
        setTeacher(teacherData);
      }

      // Fetch teacher's students
      const studentsResponse = await fetch(`/api/admin/teachers/${teacherId}/students`);
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students || []);
      }

      // Fetch teacher's parents
      const parentsResponse = await fetch(`/api/admin/teachers/${teacherId}/parents`);
      if (parentsResponse.ok) {
        const parentsData = await parentsResponse.json();
        setParents(parentsData.parents || []);
      }

      // Fetch teacher's classes
      const classesResponse = await fetch(`/api/admin/teachers/${teacherId}/classes`);
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);
      }

      // Fetch teacher stats
      const statsResponse = await fetch(`/api/admin/teachers/${teacherId}/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

    } catch (error) {
      console.error('Fetch teacher details error:', error);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (teacherId) {
      fetchTeacherDetails();
    }
  }, [teacherId, fetchTeacherDetails]);

  const handleToggleStudentStatus = async (studentId: string, currentStatus: boolean) => {
    setActionLoading(studentId);
    try {
      const response = await fetch(`/api/admin/students/${studentId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchTeacherDetails();
        alert(`Öğrenci ${!currentStatus ? 'aktif' : 'pasif'} yapıldı`);
      } else {
        const error = await response.json();
        alert(error.error || 'Durum değiştirilemedi');
      }
    } catch (error) {
      console.error('Toggle student status error:', error);
      alert('Durum değiştirilemedi');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleParentStatus = async (parentId: string, currentStatus: boolean) => {
    setActionLoading(parentId);
    try {
      const response = await fetch(`/api/admin/parents/${parentId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchTeacherDetails();
        alert(`Veli ${!currentStatus ? 'aktif' : 'pasif'} yapıldı`);
      } else {
        const error = await response.json();
        alert(error.error || 'Durum değiştirilemedi');
      }
    } catch (error) {
      console.error('Toggle parent status error:', error);
      alert('Durum değiştirilemedi');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Öğretmen Bulunamadı</h2>
        <p className="text-secondary-600 mb-6">Aradığınız öğretmen bulunamadı veya silinmiş olabilir.</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'students', name: 'Öğrenciler', icon: Users, count: students.length },
    { id: 'parents', name: 'Veliler', icon: UserCheck, count: parents.length },
    { id: 'classes', name: 'Sınıflar', icon: BookOpen, count: classes.length },
    { id: 'stats', name: 'İstatistikler', icon: BarChart3, count: null },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-secondary-600 hover:text-secondary-900 mb-4 transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              {teacher.firstName} {teacher.lastName}
            </h1>
            <div className="flex items-center space-x-6 text-secondary-600">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {teacher.email}
              </div>
              {teacher.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  {teacher.phone}
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Kayıt: {new Date(teacher.createdAt).toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              teacher.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {teacher.isActive ? 'Aktif' : 'Pasif'}
            </span>
            <button className="p-2 text-secondary-600 hover:text-secondary-900 transition-colors duration-150">
              <Edit className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Toplam Sınıf</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.totalClasses}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Toplam Ödev</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.totalAssignments}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Aktif Öğrenci</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.activeStudents}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 mb-6">
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <div className="flex items-center">
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                  {tab.count !== null && (
                    <span className="ml-2 bg-secondary-100 text-secondary-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900">Öğrenciler</h3>
                <span className="text-sm text-secondary-600">{students.length} öğrenci</span>
              </div>
              
              {students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">Henüz öğrenci yok</h3>
                  <p className="text-secondary-600">Bu öğretmenin henüz öğrencisi bulunmuyor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Öğrenci
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          İletişim
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Sınıf
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {students.map((student) => (
                        <tr key={student._id} className="hover:bg-secondary-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-secondary-900">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-secondary-500">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-secondary-900">{student.email}</div>
                            {student.phone && (
                              <div className="text-sm text-secondary-500">{student.phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                            {student.className || 'Sınıf yok'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              student.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleToggleStudentStatus(student._id, student.isActive)}
                                disabled={actionLoading === student._id}
                                className={`disabled:opacity-50 ${
                                  student.isActive
                                    ? 'text-red-600 hover:text-red-900'
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                                title={student.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                              >
                                {actionLoading === student._id ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : student.isActive ? (
                                  <UserMinus className="w-4 h-4" />
                                ) : (
                                  <UserPlus className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                title="Detayları Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Parents Tab */}
          {activeTab === 'parents' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900">Veliler</h3>
                <span className="text-sm text-secondary-600">{parents.length} veli</span>
              </div>
              
              {parents.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">Henüz veli yok</h3>
                  <p className="text-secondary-600">Bu öğretmenin henüz velisi bulunmuyor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Veli
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          İletişim
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Çocuk Sayısı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {parents.map((parent) => (
                        <tr key={parent._id} className="hover:bg-secondary-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <UserCheck className="h-5 w-5 text-green-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-secondary-900">
                                  {parent.firstName} {parent.lastName}
                                </div>
                                <div className="text-sm text-secondary-500">
                                  {parent.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-secondary-900">{parent.email}</div>
                            {parent.phone && (
                              <div className="text-sm text-secondary-500">{parent.phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {parent.children.length} çocuk
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              parent.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {parent.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleToggleParentStatus(parent._id, parent.isActive)}
                                disabled={actionLoading === parent._id}
                                className={`disabled:opacity-50 ${
                                  parent.isActive
                                    ? 'text-red-600 hover:text-red-900'
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                                title={parent.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                              >
                                {actionLoading === parent._id ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : parent.isActive ? (
                                  <UserMinus className="w-4 h-4" />
                                ) : (
                                  <UserPlus className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                title="Detayları Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900">Sınıflar</h3>
                <span className="text-sm text-secondary-600">{classes.length} sınıf</span>
              </div>
              
              {classes.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">Henüz sınıf yok</h3>
                  <p className="text-secondary-600">Bu öğretmenin henüz sınıfı bulunmuyor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((classItem) => (
                    <div key={classItem._id} className="bg-white border border-secondary-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-150">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-secondary-900">{classItem.name}</h4>
                        <span className="text-sm text-secondary-600">{classItem.studentCount} öğrenci</span>
                      </div>
                      <p className="text-secondary-600 text-sm mb-4">{classItem.description}</p>
                      <div className="flex items-center justify-between text-sm text-secondary-500">
                        <span>Oluşturulma: {new Date(classItem.createdAt).toLocaleDateString('tr-TR')}</span>
                        <button className="text-primary-600 hover:text-primary-900">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-6">Detaylı İstatistikler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-secondary-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-secondary-900 mb-4">Genel Bilgiler</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Toplam Öğrenci:</span>
                      <span className="font-semibold">{stats.totalStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Aktif Öğrenci:</span>
                      <span className="font-semibold text-green-600">{stats.activeStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Toplam Sınıf:</span>
                      <span className="font-semibold">{stats.totalClasses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Toplam Ödev:</span>
                      <span className="font-semibold">{stats.totalAssignments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Toplam Hedef:</span>
                      <span className="font-semibold">{stats.totalGoals}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-secondary-900 mb-4">Aktivite</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Son Aktivite:</span>
                      <span className="font-semibold">{stats.recentActivity} gün önce</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Kayıt Tarihi:</span>
                      <span className="font-semibold">{new Date(teacher.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {teacher.lastLogin && (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Son Giriş:</span>
                        <span className="font-semibold">{new Date(teacher.lastLogin).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
