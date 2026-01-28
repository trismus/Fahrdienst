'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button, Card, StatusBadge } from '@/components/ui';
import type { RideWithRelations } from '@/types';

type ViewMode = 'day' | 'week' | 'month';

interface CalendarViewProps {
  rides: RideWithRelations[];
  initialDate?: Date;
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const days: Date[] = [];

  // Get the Monday of the week containing the first day
  const start = getWeekStart(firstDay);

  // Generate 6 weeks (42 days) to cover all possible month layouts
  for (let i = 0; i < 42; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  return days;
}

export function CalendarView({ rides, initialDate = new Date() }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(initialDate);

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const title = useMemo(() => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('de-CH', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.getDate()}. - ${weekEnd.getDate()}. ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
    } else {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  }, [viewMode, currentDate]);

  const getRidesForDay = (date: Date) => {
    return rides.filter((ride) => isSameDay(new Date(ride.pickup_time), date));
  };

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            &larr;
          </Button>
          <Button variant="ghost" onClick={goToToday}>
            Heute
          </Button>
          <Button variant="ghost" onClick={() => navigate(1)}>
            &rarr;
          </Button>
          <h2 className="text-xl font-semibold ml-4">{title}</h2>
        </div>
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(mode)}
            >
              {mode === 'day' ? 'Tag' : mode === 'week' ? 'Woche' : 'Monat'}
            </Button>
          ))}
        </div>
      </div>

      {/* Day View */}
      {viewMode === 'day' && (
        <DayView date={currentDate} rides={getRidesForDay(currentDate)} />
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <WeekView currentDate={currentDate} getRidesForDay={getRidesForDay} />
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <MonthView currentDate={currentDate} getRidesForDay={getRidesForDay} />
      )}
    </Card>
  );
}

function DayView({ rides }: { date?: Date; rides: RideWithRelations[] }) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7:00 - 18:00

  return (
    <div className="border rounded-lg overflow-hidden">
      {hours.map((hour) => {
        const hourRides = rides.filter((ride) => {
          const rideHour = new Date(ride.pickup_time).getHours();
          return rideHour === hour;
        });

        return (
          <div key={hour} className="flex border-b last:border-b-0">
            <div className="w-16 p-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 border-r">
              {hour}:00
            </div>
            <div className="flex-1 p-2 min-h-[60px]">
              {hourRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} compact />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekView({
  currentDate,
  getRidesForDay,
}: {
  currentDate: Date;
  getRidesForDay: (date: Date) => RideWithRelations[];
}) {
  const weekStart = getWeekStart(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      {days.map((day, i) => (
        <div
          key={i}
          className={`
            p-2 text-center bg-gray-50 dark:bg-gray-800
            ${isSameDay(day, today) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
          `}
        >
          <div className="text-xs text-gray-500">{WEEKDAYS[i]}</div>
          <div className={`text-lg font-semibold ${isSameDay(day, today) ? 'text-blue-600' : ''}`}>
            {day.getDate()}
          </div>
        </div>
      ))}
      {/* Content */}
      {days.map((day, i) => {
        const dayRides = getRidesForDay(day);
        return (
          <div
            key={`content-${i}`}
            className={`
              min-h-[120px] p-1 bg-white dark:bg-gray-900
              ${isSameDay(day, today) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
            `}
          >
            {dayRides.slice(0, 3).map((ride) => (
              <RideCard key={ride.id} ride={ride} compact />
            ))}
            {dayRides.length > 3 && (
              <div className="text-xs text-gray-500 text-center mt-1">
                +{dayRides.length - 3} weitere
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({
  currentDate,
  getRidesForDay,
}: {
  currentDate: Date;
  getRidesForDay: (date: Date) => RideWithRelations[];
}) {
  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      {WEEKDAYS.map((day) => (
        <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800">
          {day}
        </div>
      ))}
      {/* Days */}
      {days.map((day, i) => {
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const dayRides = getRidesForDay(day);

        return (
          <div
            key={i}
            className={`
              min-h-[80px] p-1 bg-white dark:bg-gray-900
              ${!isCurrentMonth ? 'opacity-40' : ''}
              ${isSameDay(day, today) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
            `}
          >
            <div className={`text-sm font-medium mb-1 ${isSameDay(day, today) ? 'text-blue-600' : ''}`}>
              {day.getDate()}
            </div>
            {dayRides.slice(0, 2).map((ride) => (
              <div
                key={ride.id}
                className="text-xs truncate px-1 py-0.5 mb-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
              >
                {formatTime(ride.pickup_time)} {ride.patient?.name}
              </div>
            ))}
            {dayRides.length > 2 && (
              <div className="text-xs text-gray-500">+{dayRides.length - 2}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RideCard({ ride, compact = false }: { ride: RideWithRelations; compact?: boolean }) {
  if (compact) {
    return (
      <Link
        href={`/rides/${ride.id}`}
        className="block p-1.5 mb-1 rounded text-xs bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">{formatTime(ride.pickup_time)}</span>
          <StatusBadge status={ride.status} />
        </div>
        <div className="truncate text-gray-600 dark:text-gray-400">
          {ride.patient?.name} → {ride.destination?.name}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/rides/${ride.id}`}
      className="block p-3 mb-2 rounded-lg border hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{formatTime(ride.pickup_time)}</span>
        <StatusBadge status={ride.status} />
      </div>
      <div className="text-sm">
        <div className="font-medium">{ride.patient?.name}</div>
        <div className="text-gray-500">{ride.destination?.name}</div>
        {ride.driver && (
          <div className="text-gray-500 mt-1">Fahrer: {ride.driver.name}</div>
        )}
      </div>
    </Link>
  );
}
