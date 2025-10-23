'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, User, Calendar, Target, FileText, BarChart3 } from 'lucide-react';

interface Class {
  _id: string;
  name: string;
  description: string;
  teacherId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  students: Array<{
    _id: string;
    firstName: string;
    lastName: string;
  }>;
  assignments: Array<{
    _id: string;
    title: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'completed' | 'graded';
  }>;
  goals: Array<{
    _id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  createdAt: string;
}

export default function StudentClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/student/classes', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Classes fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentStatusCount = (assignments: Class['assignments'], status: string) => {
    return assignments.filter(assignment => assignment.status === status).length;
  };

  const getGoalStatusCount = (goals: Class['goals'], status: string) => {
    return goals.filter(goal => goal.status === status).length;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Sınıflarım</h1>
        <div className="mt-4 sm:mt-0">
          <p className="text-sm text-secondary-600">
            {classes.length} sınıfta kayıtlısınız
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Sınıf bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            Henüz herhangi bir sınıfa kayıtlı değilsiniz.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {classes.map((classItem) => (
            <div key={classItem._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-6 w-6 text-primary-600" />
                    <h3 className="text-xl font-medium text-secondary-900">
                      {classItem.name}
                    </h3>
                  </div>
                  
                  <p className="mt-2 text-sm text-secondary-600">
                    {classItem.description}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">Öğretmen</span>
                      </div>
                      <p className="mt-1 text-sm text-blue-700">
                        {classItem.teacherId.firstName} {classItem.teacherId.lastName}
                      </p>
                      <p className="text-xs text-blue-600">{classItem.teacherId.email}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-900">Sınıf Üyeleri</span>
                      </div>
                      <p className="mt-1 text-sm text-green-700">
                        {classItem.students.length} öğrenci
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="text-sm font-medium text-purple-900">Oluşturulma</span>
                      </div>
                      <p className="mt-1 text-sm text-purple-700">
                        {new Date(classItem.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900 mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Ödevler ({classItem.assignments.length})
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">Bekleyen</span>
                          <span className="font-medium text-yellow-600">
                            {getAssignmentStatusCount(classItem.assignments, 'pending')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">Teslim Edilen</span>
                          <span className="font-medium text-blue-600">
                            {getAssignmentStatusCount(classItem.assignments, 'submitted')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">Tamamlanan</span>
                          <span className="font-medium text-green-600">
                            {getAssignmentStatusCount(classItem.assignments, 'completed')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">Değerlendirilen</span>
                          <span className="font-medium text-purple-600">
                            {getAssignmentStatusCount(classItem.assignments, 'graded')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-secondary-900 mb-3 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Hedefler ({classItem.goals.length})
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">Bekleyen</span>
                          <span className="font-medium text-yellow-600">
                            {getGoalStatusCount(classItem.goals, 'pending')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">Devam Eden</span>
                          <span className="font-medium text-blue-600">
                            {getGoalStatusCount(classItem.goals, 'in_progress')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">Tamamlanan</span>
                          <span className="font-medium text-green-600">
                            {getGoalStatusCount(classItem.goals, 'completed')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {classItem.assignments.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-secondary-900 mb-3">Son Ödevler:</h4>
                      <div className="space-y-2">
                        {classItem.assignments.slice(0, 3).map((assignment) => (
                          <div key={assignment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 text-secondary-400 mr-2" />
                              <span className="text-sm text-secondary-700">{assignment.title}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                assignment.status === 'graded' ? 'bg-green-100 text-green-800' :
                                assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                assignment.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {assignment.status === 'graded' ? 'Değerlendirildi' :
                                 assignment.status === 'completed' ? 'Tamamlandı' :
                                 assignment.status === 'submitted' ? 'Teslim Edildi' :
                                 'Bekliyor'}
                              </span>
                              <span className="text-xs text-secondary-500">
                                {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </div>
                        ))}
                        {classItem.assignments.length > 3 && (
                          <div className="text-sm text-secondary-500 text-center">
                            +{classItem.assignments.length - 3} ödev daha...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
