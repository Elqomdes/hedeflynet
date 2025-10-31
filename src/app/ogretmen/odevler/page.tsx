'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Clock, Users, User, Calendar, Edit3, Trash2, ExternalLink, CheckCircle, Star, MessageSquare, Eye, Target, BookOpen, Zap, BarChart3, Printer } from 'lucide-react';
import WeekCalendar from '@/components/WeekCalendar';
import StudentFolder from '@/components/StudentFolder';
import AssignmentDetailModal from '@/components/AssignmentDetailModal';

interface Attachment {
  type: 'pdf' | 'video' | 'link';
  url: string;
  name: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  type: 'individual' | 'class';
  dueDate: string;
  attachments: Attachment[];
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
  students?: Student[]; // For grouped class assignments
  // Goal-like properties
  category?: 'academic' | 'behavioral' | 'skill' | 'personal' | 'other';
  priority?: 'low' | 'medium' | 'high';
  successCriteria?: string;
  progress?: number; // 0-100
  createdAt: string;
  updatedAt: string;
  // For student folder assignments
  submission?: {
    _id: string;
    status: 'completed' | 'incomplete' | 'not_started' | 'submitted' | 'graded' | 'late';
    grade?: number;
    maxGrade?: number;
    teacherFeedback?: string;
    submittedAt?: string;
    gradedAt?: string;
    content?: string;
  } | null;
}

interface Submission {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: 'completed' | 'incomplete' | 'not_started' | 'submitted' | 'graded' | 'late';
  grade?: number;
  maxGrade?: number;
  teacherFeedback?: string;
  submittedAt?: string;
  gradedAt?: string;
  content?: string;
  attachments?: {
    type: 'pdf' | 'video' | 'link' | 'image';
    url: string;
    name: string;
  }[];
}

// Helper function to format date for datetime-local input
const formatDateForInput = (date: string | Date): string => {
  const d = new Date(date);
  // Ensure we're working with local time, not UTC
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper function to parse date from API response
const parseApiDate = (dateString: string): Date => {
  // If the date string is already in ISO format, parse it directly
  const date = new Date(dateString);
  
  // Create a new date in local timezone to avoid timezone conversion
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
};

// Helper function to format time for display (same logic as WeekCalendar)
const formatTimeForDisplay = (date: string | Date): string => {
  const d = new Date(date);
  const hasTime = !isNaN(d.getTime()) && (d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0);
  return hasTime ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '';
};

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'individual' | 'class'>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [selectedStudentForCalendar, setSelectedStudentForCalendar] = useState<string>('');
  const [showStudentCalendar, setShowStudentCalendar] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt'>('dueDate');
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);
  const [allowLatePolicy, setAllowLatePolicy] = useState<'no' | 'untilClose' | 'always'>('untilClose');
  const [penaltyPercent, setPenaltyPercent] = useState<number>(0);
  const [selectedAssignmentForDetail, setSelectedAssignmentForDetail] = useState<Assignment | null>(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<any>(null);

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchStudents();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/teacher/assignments', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        // Keep server-provided date values as-is to avoid double timezone conversions
        setAssignments(data);
      }
    } catch (error) {
      console.error('Assignments fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        // Remove duplicate classes by name to prevent duplicate options
        const uniqueClasses = data.filter((classItem: any, index: number, self: any[]) => 
          index === self.findIndex(c => c.name === classItem.name)
        );
        setClasses(uniqueClasses);
      }
    } catch (error) {
      console.error('Classes fetch error:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Students fetch error:', error);
    }
  };


  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Bu ödevi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (response.ok) {
        // Remove locally and refresh from server to reflect any sibling deletions
        setAssignments(prev => prev.filter(a => a._id !== assignmentId));
        await fetchAssignments();
      }
    } catch (error) {
      console.error('Delete assignment error:', error);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/teacher/assignments/${assignmentId}/submissions`, {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Fetch submissions error:', error);
    }
  };

  const handleViewSubmissions = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    fetchSubmissions(assignment._id);
  };

  const handleGradeSubmission = async () => {
    if (!gradingSubmission) return;

    try {
      const response = await fetch(`/api/teacher/assignments/submissions/${gradingSubmission._id}/grade`, {
        method: 'PUT',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          grade: grade,
          teacherFeedback: teacherFeedback,
          status: 'graded'
        })
      });

      if (response.ok) {
        // Refresh submissions
        if (selectedAssignment) {
          fetchSubmissions(selectedAssignment._id);
        }
        setGradingSubmission(null);
        setGrade(0);
        setTeacherFeedback('');
        alert('Ödev başarıyla değerlendirildi');
      } else {
        const error = await response.json();
        alert(error.error || 'Değerlendirme yapılamadı');
      }
    } catch (error) {
      console.error('Grade submission error:', error);
      alert('Değerlendirme yapılamadı');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const filteredAssignments = assignments
    .filter(assignment => {
    if (filter === 'all') return true;
    return assignment.type === filter;
    })
    .filter(assignment => {
      if (studentFilter === 'all') return true;
      if (assignment.type === 'individual' && assignment.studentId) {
        return assignment.studentId._id === studentFilter;
      }
      if (assignment.type === 'class') return true; // Sınıf ödevleri her zaman gösterilsin
      return false;
    })
    .filter(a => (showOnlyOverdue ? isOverdue(a.dueDate) : true))
    .sort((a, b) => new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime());


  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    try {
      const due = new Date(dueDate);
      const now = new Date();
      // Check if the date is valid
      if (isNaN(due.getTime())) return false;
      // Compare: due date should be less than current date/time
      return due.getTime() < now.getTime();
    } catch (error) {
      console.error('Error checking overdue date:', error);
      return false;
    }
  };

  // Calendar items for selected student
  const getStudentCalendarItems = () => {
    if (!selectedStudentForCalendar) return [];
    
    const studentAssignments = assignments.filter(assignment => {
      if (assignment.type === 'individual' && assignment.studentId) {
        return assignment.studentId._id === selectedStudentForCalendar;
      }
      if (assignment.type === 'class' && assignment.classId) {
        // Check if the selected student is in this class
        const classData = classes.find(c => c._id === assignment.classId?._id);
        return classData?.students?.some((s: any) => s._id === selectedStudentForCalendar);
      }
      return false;
    });

    return studentAssignments.map(assignment => ({
      _id: assignment._id,
      title: assignment.title,
      description: assignment.description,
      date: assignment.dueDate, // Keep the full date with time information
      status: 'assignment' as const,
      studentName: assignment.studentId ? `${assignment.studentId.firstName} ${assignment.studentId.lastName}` : 'Sınıf Ödevi',
      type: assignment.type
    }));
  };

  const studentCalendarItems = getStudentCalendarItems();

  const handleAssignmentClick = (assignment: any, student: any) => {
    setSelectedAssignmentForDetail(assignment);
    setSelectedStudentForDetail(student);
  };

  const handleCloseAssignmentDetail = () => {
    setSelectedAssignmentForDetail(null);
    setSelectedStudentForDetail(null);
  };

  const handlePrintCalendar = () => {
    if (!selectedStudentForCalendar) return;
    
    const studentName = students.find(s => s._id === selectedStudentForCalendar);
    const studentFullName = studentName ? `${studentName.firstName} ${studentName.lastName}` : 'Öğrenci';
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Get calendar items for the selected student
    const calendarItems = getStudentCalendarItems();
    
    // Get current week days (same logic as WeekCalendar)
    const getWeekDays = (reference: Date): Date[] => {
      const ref = new Date(reference);
      const day = ref.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      const monday = new Date(ref);
      monday.setDate(ref.getDate() + diffToMonday);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
    };
    
    const formatISODate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const days = getWeekDays(new Date());
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    
    // Group items by day
    const grouped: Record<string, any[]> = {};
    for (const d of days) {
      grouped[formatISODate(d)] = [];
    }
    // Helper to reconstruct local date from UTC components
    const toLocalFromUTC = (input: string): Date => {
      const d = new Date(input);
      if (isNaN(d.getTime())) return d;
      return new Date(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds()
      );
    };

    for (const item of calendarItems) {
      const key = formatISODate(toLocalFromUTC(item.date));
      if (grouped[key]) {
        grouped[key].push(item);
      }
    }
    
    // Create HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${studentFullName} - Haftalık Ödev Takvimi</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            color: #1f2937;
          }
          .header p {
            font-size: 14px;
            color: #6b7280;
            margin: 5px 0 0 0;
          }
          .calendar-info {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .calendar-info h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 10px 0;
            color: #374151;
          }
          .calendar-info p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
          }
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            margin-top: 20px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          .calendar-day {
            background: white;
            border-right: 1px solid #e5e7eb;
            padding: 12px 8px;
            min-height: 160px;
          }
          .calendar-day:last-child {
            border-right: none;
          }
          .day-header {
            font-weight: 600;
            font-size: 14px;
            color: #374151;
            margin-bottom: 8px;
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px solid #f3f4f6;
          }
          .day-number {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
          }
          .day-name {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
          }
          .assignment-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 6px;
            font-size: 11px;
          }
          .assignment-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 3px;
            line-height: 1.2;
          }
          .assignment-time {
            font-size: 10px;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 3px;
            background: #f1f5f9;
            padding: 2px 4px;
            border-radius: 2px;
            display: inline-block;
          }
          .assignment-description {
            font-size: 10px;
            color: #475569;
            line-height: 1.3;
            margin-bottom: 3px;
            max-height: 30px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .assignment-type {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 500;
            margin-top: 3px;
          }
          .assignment-type.class {
            background: #dcfce7;
            color: #166534;
          }
          .assignment-type.individual {
            background: #e0e7ff;
            color: #3730a3;
          }
          .no-assignments {
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
            font-style: italic;
            padding: 20px 0;
          }
          .print-date {
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            margin-top: 30px;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
          .week-range {
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 20px;
            font-weight: 500;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .no-print { display: none; }
            .calendar-grid { break-inside: avoid; }
            .calendar-day { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${studentFullName} - Haftalık Ödev Takvimi</h1>
          <p>Ödev Programı ve Teslim Tarihleri</p>
        </div>
        
        <div class="calendar-info">
          <h3>📅 Takvim Bilgileri</h3>
          <p><strong>Öğrenci:</strong> ${studentFullName}</p>
          <p><strong>Toplam Ödev:</strong> ${calendarItems.length} adet</p>
          <p><strong>Yazdırma Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}</p>
        </div>
        
        <div class="week-range">
          📅 ${days[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${days[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        
        <div class="calendar-grid">
          ${days.map((day, idx) => {
            const iso = formatISODate(day);
            const dayItems = grouped[iso] || [];
            const isToday = formatISODate(new Date()) === iso;
            
            return `
              <div class="calendar-day">
                <div class="day-header">
                  <div class="day-number">${day.getDate()}</div>
                  <div class="day-name">${dayNames[idx]}</div>
                  ${isToday ? '<div style="font-size: 10px; color: #dc2626; font-weight: bold;">BUGÜN</div>' : ''}
                </div>
                <div style="min-height: 120px;">
                  ${dayItems.length === 0 ? 
                    '<div class="no-assignments">Ödev yok</div>' :
                    dayItems.map(item => {
                      const utc = new Date(item.date);
                      const itemDate = new Date(
                        utc.getUTCFullYear(),
                        utc.getUTCMonth(),
                        utc.getUTCDate(),
                        utc.getUTCHours(),
                        utc.getUTCMinutes(),
                        utc.getUTCSeconds()
                      );
                      // Use local time display consistently
                      const hasTime = !isNaN(itemDate.getTime()) && (itemDate.getHours() !== 0 || itemDate.getMinutes() !== 0 || itemDate.getSeconds() !== 0);
                      const timeLabel = hasTime ? `${String(itemDate.getHours()).padStart(2, '0')}:${String(itemDate.getMinutes()).padStart(2, '0')}` : '';
                      const description = item.description || '';
                      
                      return `
                        <div class="assignment-item">
                          <div class="assignment-title">${item.title}</div>
                          ${timeLabel ? `<div class="assignment-time">🕐 ${timeLabel}</div>` : ''}
                          ${description ? `<div class="assignment-description">${description}</div>` : ''}
                          <div class="assignment-type ${item.type}">${item.type === 'class' ? 'Sınıf' : 'Bireysel'}</div>
                        </div>
                      `;
                    }).join('')
                  }
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="print-date">
          Bu belge ${new Date().toLocaleString('tr-TR')} tarihinde yazdırılmıştır.
        </div>
      </body>
      </html>
    `;
    
    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      
      // Close the window after printing (optional)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Ödevlerim</h1>
            <p className="text-xs sm:text-sm text-secondary-600 mt-1">Tüm ödevlerinizi yönetin ve takip edin</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors min-h-[44px] touch-manipulation w-full sm:w-auto justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Ödev
          </button>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">Ödev Türü</label>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as any);
                  if (e.target.value !== 'individual') {
                    setStudentFilter('all');
                  }
                }}
                className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="all">Tümü</option>
                <option value="individual">Bireysel</option>
                <option value="class">Sınıf</option>
              </select>
            </div>

            {filter === 'individual' && students.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">Öğrenci</label>
                <select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="all">Tüm Öğrenciler</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">Sıralama</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="dueDate">Teslim Tarihi</option>
                <option value="createdAt">Oluşturulma</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">Takvim Görünümü</label>
              <select
                value={selectedStudentForCalendar}
                onChange={(e) => {
                  setSelectedStudentForCalendar(e.target.value);
                  setShowStudentCalendar(e.target.value !== '');
                }}
                className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="">Öğrenci Takvimi Seç</option>
                {students.map(student => (
                  <option key={student._id} value={student._id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t border-secondary-200">
            <label className="inline-flex items-center space-x-2 text-sm text-secondary-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showOnlyOverdue} 
                onChange={(e) => setShowOnlyOverdue(e.target.checked)}
                className="h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="font-medium">Sadece süresi geçmiş ödevleri göster</span>
            </label>
          </div>
        </div>
      </div>

      {/* Assignment Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 uppercase tracking-wide mb-1">Toplam Ödev</p>
              <p className="text-4xl font-bold text-blue-900">{filteredAssignments.length}</p>
              <p className="text-xs text-blue-600 mt-2">Aktif ödevler</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border border-green-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 uppercase tracking-wide mb-1">Sınıf Ödevleri</p>
              <p className="text-4xl font-bold text-green-900">
                {filteredAssignments.filter(a => a.type === 'class').length}
              </p>
              <p className="text-xs text-green-600 mt-2">Tüm sınıfa verilen</p>
            </div>
            <div className="bg-green-200 p-3 rounded-lg">
              <Users className="h-8 w-8 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md border border-purple-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 uppercase tracking-wide mb-1">Bireysel Ödevler</p>
              <p className="text-4xl font-bold text-purple-900">
                {filteredAssignments.filter(a => a.type === 'individual').length}
              </p>
              <p className="text-xs text-purple-600 mt-2">Kişiye özel ödevler</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-lg">
              <User className="h-8 w-8 text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Student Calendar Section */}
      {showStudentCalendar && selectedStudentForCalendar && (
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-secondary-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-secondary-900 flex items-center">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {students.find(s => s._id === selectedStudentForCalendar)?.firstName} {students.find(s => s._id === selectedStudentForCalendar)?.lastName} - Haftalık Takvim
                  </h3>
                  <p className="text-xs sm:text-sm text-secondary-600 mt-1">Seçilen öğrencinin ödev takvimi</p>
                </div>
                <button
                  onClick={handlePrintCalendar}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors min-h-[44px] touch-manipulation w-full sm:w-auto justify-center"
                  title="Takvimi Yazdır"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Yazdır
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-6">
              <WeekCalendar 
                items={studentCalendarItems} 
                readOnly 
                emptyText="Bu öğrenci için bu hafta ödev yok" 
              />
            </div>
          </div>
        </div>
      )}

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Ödev bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            {filter === 'all' 
              ? 'Henüz bir ödev oluşturmadınız.'
              : 'Bu kategoride ödev bulunmuyor.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAssignments.map((assignment) => (
            <div key={assignment._id} className="bg-white rounded-lg shadow-md border border-secondary-200 hover:shadow-lg transition-all duration-200 flex flex-col">
              {/* Card Header */}
              <div className={`px-4 py-3 rounded-t-lg ${
                assignment.type === 'class' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-r from-green-500 to-green-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <FileText className="h-4 w-4 text-white flex-shrink-0" />
                    <h3 className="text-base font-bold text-white truncate">
                      {assignment.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1.5 ml-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white bg-opacity-20 text-white">
                      {assignment.type === 'class' ? 'Sınıf' : 'Bireysel'}
                    </span>
                    {isOverdue(assignment.dueDate) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
                        ⚠️
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
                  {assignment.description}
                </p>
                
                <div className="space-y-2 mb-3 flex-1">
                  <div className="flex items-center text-xs text-secondary-600">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-secondary-400" />
                    <span className="font-medium">Teslim:</span>
                    <span className="ml-1 text-secondary-900">{new Date(assignment.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                  </div>

                  {assignment.type === 'class' && assignment.classId && (
                    <div className="flex items-center text-xs text-secondary-600">
                      <Users className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                      <span className="text-blue-900">{assignment.classId.name} ({assignment.students?.length || 0} öğrenci)</span>
                    </div>
                  )}

                  {assignment.type === 'individual' && assignment.studentId && (
                    <div className="flex items-center text-xs text-secondary-600">
                      <User className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                      <span className="text-green-900">{assignment.studentId.firstName} {assignment.studentId.lastName}</span>
                    </div>
                  )}
                </div>

                {assignment.attachments.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {assignment.attachments.slice(0, 2).map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary-100 text-secondary-700 hover:bg-secondary-200 transition-colors"
                        >
                          {attachment.type === 'pdf' && <FileText className="h-3 w-3 mr-1" />}
                          {(attachment.type === 'video' || attachment.type === 'link') && <ExternalLink className="h-3 w-3 mr-1" />}
                          <span className="truncate max-w-[100px]">{attachment.name}</span>
                        </a>
                      ))}
                      {assignment.attachments.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary-100 text-secondary-700">
                          +{assignment.attachments.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-secondary-200">
                  <button
                    onClick={() => handleViewSubmissions(assignment)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Teslimleri Görüntüle"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingAssignment(assignment)}
                    className="p-1.5 text-secondary-600 hover:bg-secondary-50 rounded transition-colors"
                    title="Düzenle"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(assignment._id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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

      {/* Create/Edit Assignment Modal */}
      {(showCreateForm || editingAssignment) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-10 mx-auto max-w-2xl w-full shadow-2xl rounded-xl bg-white max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-secondary-200 bg-gradient-to-r from-primary-600 to-primary-700 rounded-t-xl sticky top-0 z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {editingAssignment ? 'Ödevi Düzenle' : 'Yeni Ödev Oluştur'}
              </h3>
              <p className="text-xs sm:text-sm text-primary-100 mt-1">
                {editingAssignment ? 'Ödev bilgilerini güncelleyin' : 'Yeni bir ödev oluşturmak için formu doldurun'}
              </p>
            </div>
            <div className="p-4 sm:p-8">
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                // Client-side validation
                const title = formData.get('title') as string;
                const description = formData.get('description') as string;
                
                if (!title || title.trim().length === 0) {
                  alert('Ödev başlığı gereklidir');
                  return;
                }
                
                if (!description || description.trim().length === 0) {
                  alert('Ödev açıklaması gereklidir');
                  return;
                }
                
                if (title.length > 200) {
                  alert('Ödev başlığı 200 karakterden uzun olamaz');
                  return;
                }
                
                const dueDateValue = formData.get('dueDate') as string;
                
                const assignmentData = {
                  title: title.trim(),
                  description: description.trim(),
                  type: formData.get('type'),
                  classId: formData.get('classId'),
                  studentId: formData.get('studentId'),
                  dueDate: dueDateValue,
                  maxGrade: formData.get('maxGrade') ? parseInt(formData.get('maxGrade') as string) : 100,
                  attachments: []
                };

                try {
                  const isEdit = Boolean(editingAssignment);
                  const url = isEdit ? `/api/teacher/assignments/${editingAssignment!._id}` : '/api/teacher/assignments';
                  const method = isEdit ? 'PUT' : 'POST';
                  const response = await fetch(url, {
                    method,
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(assignmentData)
                  });

                  if (response.ok) {
                    fetchAssignments(); // Refresh the list
                    setShowCreateForm(false);
                    setEditingAssignment(null);
                  } else {
                    const error = await response.json();
                    alert(error.error || 'Ödev oluşturulamadı');
                  }
                } catch (error) {
                  console.error('Assignment creation error:', error);
                  alert('Ödev oluşturulamadı');
                }
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Başlık <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingAssignment?.title || ''}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                      minLength={1}
                      maxLength={200}
                      placeholder="Ödev başlığını girin"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Açıklama <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingAssignment?.description || ''}
                      rows={4}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                      required
                      placeholder="Ödev açıklamasını girin"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-900 mb-2">
                        Ödev Türü <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="type"
                        defaultValue={editingAssignment?.type || 'individual'}
                        className="w-full px-4 py-3 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        required
                      >
                        <option value="individual">Bireysel Ödev</option>
                        <option value="class">Sınıf Ödevi</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-secondary-900 mb-2">
                        Maksimum Puan
                      </label>
                      <input
                        type="number"
                        name="maxGrade"
                        min="1"
                        max="100"
                        defaultValue={editingAssignment?.maxGrade || 100}
                        className="w-full px-4 py-3 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Teslim Tarihi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="dueDate"
                      defaultValue={editingAssignment?.dueDate ? formatDateForInput(editingAssignment.dueDate) : ''}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Sınıf (Sınıf Ödevi için)
                    </label>
                    <select
                      name="classId"
                      className="w-full px-4 py-3 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    >
                      <option value="">Sınıf seçin</option>
                      {classes.map((classItem) => (
                        <option key={classItem._id} value={classItem._id}>
                          {classItem.name} ({classItem.students?.length || 0} öğrenci)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Öğrenci (Bireysel Ödev için)
                    </label>
                    <select
                      name="studentId"
                      className="w-full px-4 py-3 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    >
                      <option value="">Öğrenci seçin</option>
                      {students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.firstName} {student.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
                
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-secondary-200 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingAssignment(null);
                    }}
                    className="px-6 py-3 border border-secondary-300 rounded-lg shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors min-h-[44px] touch-manipulation order-2"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors min-h-[44px] touch-manipulation order-1"
                  >
                    {editingAssignment ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto max-w-5xl w-11/12 shadow-2xl rounded-xl bg-white">
            <div className="px-8 py-6 border-b border-secondary-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedAssignment.title}
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">Teslim Edilen Çalışmalar</p>
                  {selectedAssignment.type === 'class' && selectedAssignment.students && selectedAssignment.students.length > 0 && (
                    <div className="mt-2 text-sm text-blue-50">
                      <span className="font-medium">Öğrenciler: </span>
                      <span>{selectedAssignment.students.map(s => `${s.firstName} ${s.lastName}`).join(', ')}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedAssignment(null);
                    setSubmissions([]);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">

              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-secondary-400" />
                  <h3 className="mt-2 text-sm font-medium text-secondary-900">Henüz teslim yok</h3>
                  <p className="mt-1 text-sm text-secondary-500">
                    Bu ödev için henüz teslim edilmiş çalışma bulunmuyor.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {submissions.map((submission) => (
                    <div key={submission._id} className="bg-white border-2 border-secondary-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-lg">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-secondary-900">
                                {submission.studentId.firstName} {submission.studentId.lastName}
                              </h4>
                              <p className="text-sm text-secondary-600">{submission.studentId.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>
                              {getStatusText(submission.status)}
                            </span>
                            {submission.grade !== undefined && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-white">
                                <Star className="h-3.5 w-3.5 mr-1" />
                                {submission.grade}/{submission.maxGrade || 100}
                              </span>
                            )}
                            {submission.submittedAt && (
                              <span className="text-xs text-secondary-500">
                                <Clock className="h-3.5 w-3.5 inline mr-1" />
                                {new Date(submission.submittedAt).toLocaleString('tr-TR')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {submission.status === 'submitted' && (
                            <button
                              onClick={() => {
                                setGradingSubmission(submission);
                                setGrade(submission.grade || 0);
                                setTeacherFeedback(submission.teacherFeedback || '');
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Değerlendir
                            </button>
                          )}
                          {submission.status === 'graded' && (
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/teacher/assignments/submissions/${submission._id}/reopen`, {
                                    method: 'PUT'
                                  });
                                  if (response.ok && selectedAssignment) {
                                    fetchSubmissions(selectedAssignment._id);
                                  }
                                } catch (error) {
                                  console.error('Reopen submission error:', error);
                                }
                              }}
                              className="inline-flex items-center px-4 py-2 border border-secondary-300 rounded-lg shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                              Yeniden Aç
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {submission.content && (
                        <div className="mt-4">
                          <h5 className="text-sm font-semibold text-secondary-900 mb-2 uppercase tracking-wide">Ödev İçeriği</h5>
                          <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                            <p className="text-sm text-secondary-700 whitespace-pre-wrap">{submission.content}</p>
                          </div>
                        </div>
                      )}
                      
                      {submission.teacherFeedback && (
                        <div className="mt-4">
                          <h5 className="text-sm font-semibold text-secondary-900 mb-2 uppercase tracking-wide">Geri Bildirimim</h5>
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-secondary-700 whitespace-pre-wrap">{submission.teacherFeedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto max-w-2xl w-11/12 shadow-2xl rounded-xl bg-white">
            <div className="px-8 py-6 border-b border-secondary-200 bg-gradient-to-r from-green-600 to-green-700 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Ödev Değerlendir
                  </h3>
                  <p className="text-sm text-green-100">
                    {gradingSubmission.studentId.firstName} {gradingSubmission.studentId.lastName}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary-900 mb-2">
                    Puan <span className="text-secondary-500">(0-{gradingSubmission.maxGrade || 100})</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={gradingSubmission.maxGrade || 100}
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-2xl font-bold text-center"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-secondary-900 mb-2">
                    Geri Bildirim
                  </label>
                  <textarea
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                    placeholder="Öğrenciye detaylı geri bildirim yazın..."
                  />
                  <p className="mt-2 text-xs text-secondary-500">
                    Bu geri bildirim öğrenciye iletilir
                  </p>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setGradingSubmission(null);
                    setGrade(0);
                    setTeacherFeedback('');
                  }}
                  className="px-6 py-3 border border-secondary-300 rounded-lg shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleGradeSubmission}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Değerlendir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Folder Section */}
      <StudentFolder 
        students={students} 
        onAssignmentClick={handleAssignmentClick}
      />

      {/* Assignment Detail Modal */}
      <AssignmentDetailModal
        assignment={selectedAssignmentForDetail}
        student={selectedStudentForDetail}
        isOpen={!!selectedAssignmentForDetail}
        onClose={handleCloseAssignmentDetail}
      />
    </div>
  );
}
