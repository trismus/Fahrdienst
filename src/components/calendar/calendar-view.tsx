'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button, Card, StatusBadge } from '@/components/ui';
import type { RideWithRelations } from '@/types';

type ViewMode = 'day' | 'week' | 'month';

interface CalendarViewProps {
  rides: RideWithRelations[];
  initialDate?: Date;
  initialView?: ViewMode;
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
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

export function CalendarView({ rides, initialDate = new Date(), initialView = 'week' }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
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
          <Button variant="ghost" onClick={() => navigate(-1)} aria-label="Vorheriger Zeitraum">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button variant="ghost" onClick={goToToday}>
            Heute
          </Button>
          <Button variant="ghost" onClick={() => navigate(1)} aria-label="Naechster Zeitraum">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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

// Time slots in 30-minute intervals from 07:00 to 18:30
const TIME_SLOTS_30MIN = [
  { hour: 7, minute: 0, label: '07:00' },
  { hour: 7, minute: 30, label: '07:30' },
  { hour: 8, minute: 0, label: '08:00' },
  { hour: 8, minute: 30, label: '08:30' },
  { hour: 9, minute: 0, label: '09:00' },
  { hour: 9, minute: 30, label: '09:30' },
  { hour: 10, minute: 0, label: '10:00' },
  { hour: 10, minute: 30, label: '10:30' },
  { hour: 11, minute: 0, label: '11:00' },
  { hour: 11, minute: 30, label: '11:30' },
  { hour: 12, minute: 0, label: '12:00' },
  { hour: 12, minute: 30, label: '12:30' },
  { hour: 13, minute: 0, label: '13:00' },
  { hour: 13, minute: 30, label: '13:30' },
  { hour: 14, minute: 0, label: '14:00' },
  { hour: 14, minute: 30, label: '14:30' },
  { hour: 15, minute: 0, label: '15:00' },
  { hour: 15, minute: 30, label: '15:30' },
  { hour: 16, minute: 0, label: '16:00' },
  { hour: 16, minute: 30, label: '16:30' },
  { hour: 17, minute: 0, label: '17:00' },
  { hour: 17, minute: 30, label: '17:30' },
  { hour: 18, minute: 0, label: '18:00' },
  { hour: 18, minute: 30, label: '18:30' },
];

function DayView({ date, rides }: { date: Date; rides: RideWithRelations[] }) {
  const today = new Date();
  const isToday = isSameDay(date, today);

  // Get current time slot for "now" indicator
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Time slots with 30-minute intervals */}
      {TIME_SLOTS_30MIN.map((slot) => {
        // Get rides that fall within this 30-minute slot
        const slotRides = rides.filter((ride) => {
          const rideDate = new Date(ride.pickup_time);
          const rideHour = rideDate.getHours();
          const rideMinute = rideDate.getMinutes();

          // Check if ride falls within this 30-minute slot
          if (rideHour === slot.hour) {
            if (slot.minute === 0) {
              return rideMinute < 30;
            } else {
              return rideMinute >= 30;
            }
          }
          return false;
        });

        // Check if this is the current time slot (for "now" indicator)
        const isCurrentSlot = isToday &&
          currentHour === slot.hour &&
          ((slot.minute === 0 && currentMinute < 30) ||
           (slot.minute === 30 && currentMinute >= 30));

        // Only show label for full hours
        const showLabel = slot.minute === 0;

        return (
          <div
            key={`${slot.hour}-${slot.minute}`}
            className={`
              flex border-b last:border-b-0
              ${isCurrentSlot ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              ${slot.minute === 30 ? 'border-b-dashed border-gray-200 dark:border-gray-700' : ''}
            `}
          >
            {/* Time column */}
            <div className={`
              w-20 p-2 text-sm bg-gray-50 dark:bg-gray-800 border-r flex-shrink-0
              ${slot.minute === 30 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500'}
              ${isCurrentSlot ? 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : ''}
            `}>
              {showLabel ? slot.label : ''}
              {slot.minute === 30 && (
                <span className="text-xs text-gray-400">:30</span>
              )}
            </div>

            {/* Content area */}
            <div className={`
              flex-1 p-2 min-h-[48px] relative
              ${slot.minute === 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}
            `}>
              {/* Current time indicator */}
              {isCurrentSlot && (
                <div className="absolute left-0 right-0 h-0.5 bg-blue-500 z-10" style={{
                  top: `${(currentMinute % 30) / 30 * 100}%`
                }}>
                  <div className="absolute left-0 -top-1 w-2 h-2 rounded-full bg-blue-500" />
                </div>
              )}

              {/* Rides */}
              {slotRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} compact />
              ))}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>{rides.length} Fahrten</span>
            {isToday && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Aktuelle Zeit
              </span>
            )}
          </div>
          <Link href="/rides/new" className="text-blue-600 hover:underline">
            + Neue Fahrt
          </Link>
        </div>
      </div>
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
            {dayRides.slice(0, 2).map((ride) => {
              const colors = STATUS_COLORS[ride.status] || STATUS_COLORS.planned;
              return (
                <Link
                  key={ride.id}
                  href={`/rides/${ride.id}`}
                  className={`block text-xs truncate px-1 py-0.5 mb-0.5 rounded ${colors.bg} ${colors.text} ${colors.hover}`}
                >
                  {formatTime(ride.pickup_time)} {ride.patient?.name}
                </Link>
              );
            })}
            {dayRides.length > 2 && (
              <div className="text-xs text-gray-500">+{dayRides.length - 2}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Status-based color mapping for ride cards
const STATUS_COLORS = {
  planned: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
  },
  confirmed: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/50',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
  },
  in_progress: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/50',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    hover: 'hover:bg-green-100 dark:hover:bg-green-900/50',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
  },
  cancelled: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    hover: 'hover:bg-red-100 dark:hover:bg-red-900/50',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
  },
} as const;

function RideCard({ ride, compact = false }: { ride: RideWithRelations; compact?: boolean }) {
  const colors = STATUS_COLORS[ride.status] || STATUS_COLORS.planned;

  if (compact) {
    return (
      <Link
        href={`/rides/${ride.id}`}
        className={`block p-1.5 mb-1 rounded text-xs ${colors.bg} ${colors.hover} transition-colors`}
      >
        <div className="flex items-center justify-between">
          <span className={`font-medium ${colors.text}`}>{formatTime(ride.pickup_time)}</span>
          <StatusBadge status={ride.status} />
        </div>
        <div className="truncate text-gray-600 dark:text-gray-400">
          {ride.patient?.name} <span className="text-gray-400">-</span> {ride.destination?.name}
        </div>
        {ride.driver && (
          <div className="text-gray-500 dark:text-gray-500 truncate mt-0.5">
            Fahrer: {ride.driver.name}
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/rides/${ride.id}`}
      className={`block p-3 mb-2 rounded-lg border ${colors.bg} ${colors.hover} ${colors.border} transition-shadow hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`font-medium ${colors.text}`}>{formatTime(ride.pickup_time)}</span>
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
