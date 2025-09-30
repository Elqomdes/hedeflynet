'use client';

import { useMemo } from 'react';

type CalendarGoal = {
  _id: string;
  title: string;
  date: string; // ISO date string (yyyy-mm-dd)
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
};

interface WeekCalendarProps {
  referenceDate?: Date; // any date within the week
  items: CalendarGoal[];
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
  const now = referenceDate || new Date();
  const days = useMemo(() => getWeekDays(now), [now]);

  const grouped = useMemo(() => {
    const map: Record<string, CalendarGoal[]> = {};
    for (const d of days) {
      map[formatISODate(d)] = [];
    }
    for (const item of items) {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    }
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
                  grouped[iso].slice(0, 4).map((g) => (
                    <div key={g._id} className="text-xs px-2 py-1 rounded bg-secondary-100 text-secondary-800 truncate">
                      {g.title}
                    </div>
                  ))
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
    </div>
  );
}


