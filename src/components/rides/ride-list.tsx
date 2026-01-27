'use client';

import Link from 'next/link';
import { Card, StatusBadge, Button } from '@/components/ui';
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
      <Card>
        <p className="text-center text-gray-500 py-8">{emptyMessage}</p>
      </Card>
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
    <div className="space-y-4">
      {Object.entries(groupedRides).map(([dateString, dateRides]) => {
        const date = new Date(dateString);
        const dateLabel = isToday(dateRides[0].pickup_time)
          ? 'Heute'
          : formatDate(dateRides[0].pickup_time);

        return (
          <div key={dateString}>
            <h3 className="text-sm font-medium text-gray-500 mb-2">{dateLabel}</h3>
            <div className="space-y-2">
              {dateRides.map((ride) => (
                <Link key={ride.id} href={`${linkPrefix}/${ride.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-blue-600">
                          {formatTime(ride.pickup_time)}
                        </div>
                        <div>
                          <p className="font-medium">{ride.patient?.name}</p>
                          <p className="text-sm text-gray-500">
                            → {ride.destination?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {ride.patient?.special_needs && (
                          <span className="text-orange-500" title={ride.patient.special_needs}>
                            ⚠️
                          </span>
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
