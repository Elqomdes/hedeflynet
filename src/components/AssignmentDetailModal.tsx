'use client';

import { useState } from 'react';
import { X, FileText, Clock, User, Star, CheckCircle, AlertCircle, Calendar, BookOpen } from 'lucide-react';

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

interface AssignmentDetailModalProps {
  assignment: Assignment | null;
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssignmentDetailModal({ 
  assignment, 
  student, 
  isOpen, 
  onClose 
}: AssignmentDetailModalProps) {
  if (!isOpen || !assignment || !student) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'submitted':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'late':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'incomplete':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'late':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto max-w-4xl w-11/12 shadow-2xl rounded-xl bg-white">
        {/* Header */}
        <div className="px-8 py-6 border-b border-secondary-200 bg-gradient-to-r from-primary-600 to-primary-700 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2">
                {assignment.title}
              </h3>
              <div className="flex items-center space-x-4 text-primary-100">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm">
                    {student.firstName} {student.lastName}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(assignment.dueDate).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {assignment.type === 'class' && assignment.classId && (
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm">{assignment.classId.name}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Assignment Description */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <h4 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Ödev Açıklaması
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-secondary-700 whitespace-pre-wrap leading-relaxed">
                  {assignment.description}
                </p>
              </div>
            </div>

            {/* Assignment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-secondary-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-secondary-600" />
                  Ödev Bilgileri
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Teslim Tarihi:</span>
                    <span className={`text-sm font-medium ${isOverdue(assignment.dueDate) ? 'text-red-600' : 'text-secondary-900'}`}>
                      {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Maksimum Puan:</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {assignment.maxGrade || 100}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Ödev Türü:</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {assignment.type === 'class' ? 'Sınıf Ödevi' : 'Bireysel Ödev'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Oluşturulma:</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {new Date(assignment.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submission Status */}
              <div className="bg-white border border-secondary-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
                  {assignment.submission ? getStatusIcon(assignment.submission.status) : <Clock className="h-5 w-5 mr-2 text-gray-400" />}
                  <span className="ml-2">Teslim Durumu</span>
                </h4>
                
                {assignment.submission ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-secondary-600">Durum:</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(assignment.submission.status)}`}>
                        {getStatusText(assignment.submission.status)}
                      </span>
                    </div>
                    
                    {assignment.submission.grade !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-secondary-600">Aldığı Not:</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-lg font-bold text-yellow-600">
                            {assignment.submission.grade}/{assignment.submission.maxGrade || assignment.maxGrade || 100}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {assignment.submission.submittedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-secondary-600">Teslim Tarihi:</span>
                        <span className="text-sm font-medium text-secondary-900">
                          {new Date(assignment.submission.submittedAt).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    )}
                    
                    {assignment.submission.gradedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-secondary-600">Değerlendirme:</span>
                        <span className="text-sm font-medium text-secondary-900">
                          {new Date(assignment.submission.gradedAt).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Henüz teslim edilmedi</p>
                  </div>
                )}
              </div>
            </div>

            {/* Student Submission Content */}
            {assignment.submission && assignment.submission.content && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <h4 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Öğrenci Çalışması
                </h4>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-secondary-700 whitespace-pre-wrap leading-relaxed">
                    {assignment.submission.content}
                  </p>
                </div>
              </div>
            )}

            {/* Teacher Feedback */}
            {assignment.submission && assignment.submission.teacherFeedback && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                <h4 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-purple-600" />
                  Geri Bildirimim
                </h4>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-secondary-700 whitespace-pre-wrap leading-relaxed">
                    {assignment.submission.teacherFeedback}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-secondary-200 bg-secondary-50 rounded-b-xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-secondary-300 rounded-lg shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
