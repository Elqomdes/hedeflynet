'use client';

import { useState, useEffect } from 'react';
import { Folder, User, ChevronDown, ChevronRight, FileText, Star, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AssignmentSubmission {
  _id: string;
  status: 'completed' | 'incomplete' | 'not_started' | 'submitted' | 'graded' | 'late';
  grade?: number;
  maxGrade?: number;
  teacherFeedback?: string;
  submittedAt?: string;
  gradedAt?: string;
  content?: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  type: 'individual' | 'class';
  dueDate: string;
  attachments?: any[];
  maxGrade?: number;
  classId?: {
    _id: string;
    name: string;
  };
  studentId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  students?: any[];
  category?: string;
  priority?: string;
  successCriteria?: string;
  progress?: number;
  createdAt: string;
  updatedAt?: string;
  submission?: AssignmentSubmission | null;
}

interface StudentAssignmentsData {
  student: Student;
  assignments: Assignment[];
}

interface StudentFolderProps {
  students: Array<{
    _id: string;
    firstName: string;
    lastName: string;
  }>;
  onAssignmentClick: (assignment: Assignment, student: Student) => void;
}

export default function StudentFolder({ students, onAssignmentClick }: StudentFolderProps) {
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [studentData, setStudentData] = useState<Map<string, StudentAssignmentsData>>(new Map());
  const [loadingStudents, setLoadingStudents] = useState<Set<string>>(new Set());

  const toggleStudent = async (studentId: string) => {
    const isExpanded = expandedStudents.has(studentId);
    
    if (isExpanded) {
      // Collapse
      setExpandedStudents(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    } else {
      // Expand and fetch data if not already loaded
      setExpandedStudents(prev => new Set(prev).add(studentId));
      
      if (!studentData.has(studentId)) {
        setLoadingStudents(prev => new Set(prev).add(studentId));
        
        try {
          const response = await fetch(`/api/teacher/students/${studentId}/assignments`, {
            credentials: 'include',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          });
          
          if (response.ok) {
            const data = await response.json();
            setStudentData(prev => new Map(prev).set(studentId, data));
          }
        } catch (error) {
          console.error('Error fetching student assignments:', error);
        } finally {
          setLoadingStudents(prev => {
            const newSet = new Set(prev);
            newSet.delete(studentId);
            return newSet;
          });
        }
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'submitted':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'late':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'incomplete':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'graded':
        return 'Değerlendirildi';
      case 'submitted':
        return 'Teslim Edildi';
      case 'late':
        return 'Geç Teslim';
      case 'completed':
        return 'Tamamlandı';
      case 'incomplete':
        return 'Eksik';
      default:
        return 'Bekliyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'submitted':
        return 'text-blue-600 bg-blue-50';
      case 'late':
        return 'text-red-600 bg-red-50';
      case 'incomplete':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-secondary-200 mt-6">
      <div className="px-6 py-4 border-b border-secondary-200 bg-gradient-to-r from-purple-50 to-purple-100">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
          <Folder className="h-5 w-5 mr-2 text-purple-600" />
          Öğrenci Klasörü
        </h3>
        <p className="text-sm text-secondary-600 mt-1">Öğrencilerin tamamladığı ödevleri görüntüleyin</p>
      </div>
      
      <div className="p-6">
        {students.length === 0 ? (
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">Öğrenci bulunamadı</h3>
            <p className="mt-1 text-sm text-secondary-500">
              Henüz hiç öğrenciniz yok.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {students.map((student) => {
              const isExpanded = expandedStudents.has(student._id);
              const isLoading = loadingStudents.has(student._id);
              const data = studentData.get(student._id);
              const assignments = data?.assignments || [];
              // All assignments are already completed since API filters them
              
              return (
                <div key={student._id} className="border border-secondary-200 rounded-lg">
                  <button
                    onClick={() => toggleStudent(student._id)}
                    className="w-full px-4 py-3 text-left hover:bg-secondary-50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-secondary-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-secondary-500" />
                        )}
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-secondary-900">
                            {student.firstName} {student.lastName}
                          </h4>
                          <p className="text-sm text-secondary-600">
                            {assignments.length} tamamlanan ödev
                          </p>
                        </div>
                      </div>
                      {isLoading && (
                        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </button>
                  
                  {isExpanded && data && (
                    <div className="px-4 pb-4 border-t border-secondary-100">
                      {assignments.length === 0 ? (
                        <div className="py-4 text-center text-sm text-secondary-500">
                          Bu öğrenci için henüz tamamlanan ödev bulunmuyor.
                        </div>
                      ) : (
                        <div className="space-y-2 mt-3">
                          {assignments.map((assignment) => (
                            <div
                              key={assignment._id}
                              onClick={() => onAssignmentClick(assignment, data.student)}
                              className="p-3 bg-white border border-secondary-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <FileText className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                                    <h5 className="font-medium text-secondary-900 truncate">
                                      {assignment.title}
                                    </h5>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3 text-xs text-secondary-600">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                                      </span>
                                    </span>
                                    
                                    {assignment.type === 'class' && assignment.classId && (
                                      <span className="text-blue-600">
                                        {assignment.classId.name}
                                      </span>
                                    )}
                                    
                                    {isOverdue(assignment.dueDate) && (
                                      <span className="text-red-600 font-medium">
                                        Süresi geçmiş
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-end space-y-1 ml-3">
                                  {assignment.submission ? (
                                    <>
                                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.submission.status)}`}>
                                        {getStatusIcon(assignment.submission.status)}
                                        <span>{getStatusText(assignment.submission.status)}</span>
                                      </div>
                                      
                                      {assignment.submission.grade !== undefined && (
                                        <div className="flex items-center space-x-1 text-xs font-semibold text-yellow-600">
                                          <Star className="h-3 w-3" />
                                          <span>
                                            {assignment.submission.grade}/{assignment.submission.maxGrade || assignment.maxGrade || 100}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-50">
                                      <Clock className="h-3 w-3" />
                                      <span>Bekliyor</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
