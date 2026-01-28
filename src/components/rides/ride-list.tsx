'use client';

import Link from 'next/link';
import { Card, StatusBadge } from '@/components/ui';
import type { RideWithRelations } from '@/types';

interface RideListProps {
  rides: RideWithRelations[];
  emptyMessage?: string;
  linkPrefix?: string;
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isToday(isoString: string) {
  const date = new Date(isoString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function RideList({ rides, emptyMessage = 'Keine Fahrten', linkPrefix = '/rides' }: RideListProps) {
  if (rides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  // Group rides by date
  const groupedRides = rides.reduce((acc, ride) => {
    const date = new Date(ride.pickup_time).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(ride);
    return acc;
  }, {} as Record<string, RideWithRelations[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedRides).map(([dateString, dateRides]) => {
        const dateLabel = isToday(dateRides[0].pickup_time)
          ? 'Heute'
          : formatDate(dateRides[0].pickup_time);

        return (
          <div key={dateString}>
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-4">{dateLabel}</h3>
            <div className="space-y-3">
              {dateRides.map((ride) => (
                <Link key={ride.id} href={`${linkPrefix}/${ride.id}`}>
                  <Card hover padding="none" className="overflow-hidden">
                    <div className="flex items-center p-5">
                      <div className="flex items-center gap-5 flex-1 min-w-0">
                        <div className="flex flex-col items-center justify-center min-w-[64px]">
                          <div className="text-2xl font-bold text-primary tabular-nums">
                            {formatTime(ride.pickup_time)}
                          </div>
                        </div>
                        <div className="h-12 w-px bg-neutral-200 dark:bg-neutral-700"></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-base truncate">
                            {ride.patient?.name}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            → {ride.destination?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        {ride.patient?.special_needs && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning-light" title={ride.patient.special_needs}>
                            <span className="text-warning-dark text-lg">⚠️</span>
                          </div>
                        )}
                        <StatusBadge status={ride.status} />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
