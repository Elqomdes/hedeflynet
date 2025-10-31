'use client';

import { useMemo, useState } from 'react';
import { X, FileText, Clock } from 'lucide-react';

type CalendarItem = {
  _id: string;
  title: string;
  date: string; // ISO string: yyyy-mm-dd or full ISO with time
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'submitted' | 'late' | 'graded' | 'assignment';
  studentName?: string;
  type?: 'individual' | 'class';
  description?: string; // For assignment details
};

interface WeekCalendarProps {
  referenceDate?: Date; // any date within the week
  items: CalendarItem[];
  onSelectDate?: (isoDate: string) => void; // called when a day cell is clicked
  readOnly?: boolean;
  emptyText?: string;
}

function formatISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDays(reference: Date): Date[] {
  const ref = new Date(reference);
  const day = ref.getDay();
  // Make Monday first (Mon=1..Sun=0->7)
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function WeekCalendar({ referenceDate, items, onSelectDate, readOnly, emptyText }: WeekCalendarProps) {
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const days = useMemo(() => {
    const now = referenceDate || new Date();
    return getWeekDays(now);
  }, [referenceDate]);

  const grouped = useMemo(() => {
    // Helper: reconstruct local Date from UTC components to neutralize timezone shift
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
    const map: Record<string, CalendarItem[]> = {};
    for (const d of days) {
      map[formatISODate(d)] = [];
    }
    for (const item of items) {
      // Group by corrected local day derived from UTC components
      const key = (() => {
        const dt = toLocalFromUTC(item.date);
        if (isNaN(dt.getTime())) return item.date; // fallback
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const da = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      })();
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    // Sort each day's items by time (if any)
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const ta = toLocalFromUTC(a.date).getTime();
        const tb = toLocalFromUTC(b.date).getTime();
        return ta - tb;
      });
    });
    return map;
  }, [days, items]);

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, idx) => {
          const iso = formatISODate(d);
          const isToday = formatISODate(new Date()) === iso;
          const dayLabel = `${dayNames[idx]} ${d.getDate()}`;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => !readOnly && onSelectDate && onSelectDate(iso)}
              className={`text-left p-3 rounded-md border border-secondary-200 bg-white hover:bg-secondary-50 transition ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-700">{dayLabel}</span>
                {isToday && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">Bugün</span>
                )}
              </div>
              <div className="space-y-1 min-h-[2rem]">
                {grouped[iso] && grouped[iso].length > 0 ? (
                  grouped[iso].slice(0, 4).map((g) => {
                    // Display time using local date reconstructed from UTC components
                    const utc = new Date(g.date);
                    const dt = new Date(
                      utc.getUTCFullYear(),
                      utc.getUTCMonth(),
                      utc.getUTCDate(),
                      utc.getUTCHours(),
                      utc.getUTCMinutes(),
                      utc.getUTCSeconds()
                    );
                    
                    const hasTime = !isNaN(dt.getTime()) && (dt.getHours() !== 0 || dt.getMinutes() !== 0 || dt.getSeconds() !== 0);
                    // Use consistent time formatting - ensure local time display
                    const timeLabel = hasTime ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : '';
                    const statusColor = (() => {
                      const isPast = !isNaN(dt.getTime()) && dt.getTime() < new Date().getTime();
                      if (g.status === 'completed' || g.status === 'graded') return 'bg-green-100 text-green-800';
                      if (g.status === 'cancelled') return 'bg-red-100 text-red-800';
                      if (g.status === 'late') return 'bg-red-100 text-red-800';
                      if (g.status === 'submitted') return 'bg-blue-100 text-blue-800';
                      if (isPast) return 'bg-orange-100 text-orange-800';
                      if (g.status === 'in_progress') return 'bg-blue-100 text-blue-800';
                      return 'bg-secondary-100 text-secondary-800';
                    })();
                    return (
                      <div 
                        key={g._id} 
                        onClick={() => {
                          if (g.description) {
                            setSelectedItem(g);
                            setShowDetail(true);
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded flex items-center gap-2 ${statusColor} ${g.description ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                        title={g.title}
                      >
                        {timeLabel && <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white/60 text-secondary-900 flex-shrink-0">{timeLabel}</span>}
                        <span className="truncate flex-1 min-w-0" title={g.title}>{g.title}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-secondary-400">
                    {emptyText || 'Kayıt yok'}
                  </div>
                )}
                {grouped[iso] && grouped[iso].length > 4 && (
                  <div className="text-xs text-secondary-500">+{grouped[iso].length - 4} daha</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Assignment Detail Modal */}
      {showDetail && selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowDetail(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white line-clamp-2">
                      {selectedItem.title}
                    </h3>
                    {selectedItem.studentName && (
                      <p className="text-sm text-primary-100 mt-0.5">{selectedItem.studentName}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Date */}
              <div className="flex items-center gap-2 mb-4 text-sm text-secondary-600">
                <Clock className="h-4 w-4" />
                <span>{new Date(selectedItem.date).toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>

              {/* Description */}
              {selectedItem.description && (
                <div className="space-y-2 animate-fade-in">
                  <h4 className="text-sm font-semibold text-secondary-700 uppercase tracking-wide">Açıklama</h4>
                  <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                    <p className="text-sm text-secondary-700 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="mt-6 flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${(() => {
                  const statusColors: Record<string, string> = {
                    'completed': 'bg-green-100 text-green-800',
                    'cancelled': 'bg-red-100 text-red-800',
                    'late': 'bg-red-100 text-red-800',
                    'submitted': 'bg-blue-100 text-blue-800',
                    'graded': 'bg-green-100 text-green-800',
                    'in_progress': 'bg-blue-100 text-blue-800',
                    'pending': 'bg-secondary-100 text-secondary-800',
                    'assignment': 'bg-blue-100 text-blue-800',
                  };
                  const status = selectedItem.status || 'pending';
                  return statusColors[status] || 'bg-secondary-100 text-secondary-800';
                })()}`}>
                  {(() => {
                    const statusTexts: Record<string, string> = {
                      'completed': '✓ Tamamlandı',
                      'cancelled': '✗ İptal',
                      'late': '⚠ Geç Teslim',
                      'submitted': '✓ Teslim Edildi',
                      'graded': '✓ Değerlendirildi',
                      'in_progress': '⏳ Devam Ediyor',
                      'pending': '📌 Bekliyor',
                      'assignment': '📝 Ödev',
                    };
                    const status = selectedItem.status || 'pending';
                    return statusTexts[status] || '📌 Bekliyor';
                  })()}
                </span>
                {selectedItem.type && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
                    {selectedItem.type === 'class' ? '👥 Sınıf' : '👤 Bireysel'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


