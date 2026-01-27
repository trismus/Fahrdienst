'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, Button, StatusBadge } from '@/components/ui';
import { RouteMap } from '@/components/maps';
import { confirmRide, rejectRide, startRide, completeRide, cancelRide } from '@/lib/actions/rides';
import type { RideWithRelations } from '@/types';

interface RideDetailCardProps {
  ride: RideWithRelations;
  showActions?: boolean;
  showEditLink?: boolean;
  isDriver?: boolean;
}

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString('de-CH', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RideDetailCard({
  ride,
  showActions = true,
  showEditLink = false,
  isDriver = false,
}: RideDetailCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        console.error('Action failed:', error);
      }
    });
  };

  const canConfirm = ride.status === 'planned' && ride.driver_id;
  const canReject = ride.status === 'planned' && ride.driver_id;
  const canStart = ride.status === 'confirmed';
  const canComplete = ride.status === 'in_progress';
  const canCancel = ride.status !== 'completed' && ride.status !== 'cancelled';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Fahrt Details</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {formatDateTime(ride.pickup_time)}
            </p>
          </div>
          <StatusBadge status={ride.status} />
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Patient</h4>
            <div className="space-y-1">
              <p className="font-medium">{ride.patient.name}</p>
              <p className="text-sm text-gray-600">{ride.patient.address}</p>
              <p className="text-sm text-gray-600">{ride.patient.phone}</p>
              {ride.patient.special_needs && (
                <p className="text-sm text-orange-600">
                  ⚠️ {ride.patient.special_needs}
                </p>
              )}
            </div>
          </div>

          {/* Destination */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Ziel</h4>
            <div className="space-y-1">
              <p className="font-medium">{ride.destination.name}</p>
              <p className="text-sm text-gray-600">{ride.destination.address}</p>
              <p className="text-sm text-gray-600">
                Ankunftsfenster: {ride.destination.arrival_window_start} - {ride.destination.arrival_window_end}
              </p>
            </div>
          </div>

          {/* Times */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Zeiten</h4>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-gray-500">Abholung:</span>{' '}
                <span className="font-medium">{formatTime(ride.pickup_time)}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Ankunft:</span>{' '}
                <span className="font-medium">{formatTime(ride.arrival_time)}</span>
              </p>
              {ride.return_time && (
                <p className="text-sm">
                  <span className="text-gray-500">Rückfahrt:</span>{' '}
                  <span className="font-medium">{formatTime(ride.return_time)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Driver */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Fahrer</h4>
            {ride.driver ? (
              <div className="space-y-1">
                <p className="font-medium">{ride.driver.name}</p>
                <p className="text-sm text-gray-600">{ride.driver.phone}</p>
                <p className="text-sm text-gray-600">{ride.driver.email}</p>
              </div>
            ) : (
              <p className="text-orange-600">Nicht zugewiesen</p>
            )}
          </div>
        </div>

        {/* Route info */}
        {(ride.estimated_duration || ride.estimated_distance) && (
          <div className="mt-4 pt-4 border-t flex gap-6">
            {ride.estimated_distance && (
              <div>
                <span className="text-sm text-gray-500">Entfernung:</span>{' '}
                <span className="font-medium">{ride.estimated_distance} km</span>
              </div>
            )}
            {ride.estimated_duration && (
              <div>
                <span className="text-sm text-gray-500">Fahrzeit:</span>{' '}
                <span className="font-medium">{ride.estimated_duration} Min.</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="mt-6 pt-4 border-t flex flex-wrap gap-3">
            {isDriver ? (
              <>
                {canConfirm && (
                  <Button
                    onClick={() => handleAction(() => confirmRide(ride.id))}
                    disabled={isPending}
                  >
                    Bestätigen
                  </Button>
                )}
                {canReject && (
                  <Button
                    variant="secondary"
                    onClick={() => handleAction(() => rejectRide(ride.id))}
                    disabled={isPending}
                  >
                    Ablehnen
                  </Button>
                )}
                {canStart && (
                  <Button
                    onClick={() => handleAction(() => startRide(ride.id))}
                    disabled={isPending}
                  >
                    Fahrt starten
                  </Button>
                )}
                {canComplete && (
                  <Button
                    onClick={() => handleAction(() => completeRide(ride.id))}
                    disabled={isPending}
                  >
                    Fahrt abschließen
                  </Button>
                )}
              </>
            ) : (
              <>
                {showEditLink && (
                  <Link href={`/rides/${ride.id}`}>
                    <Button variant="secondary">Bearbeiten</Button>
                  </Link>
                )}
                {canCancel && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm('Fahrt wirklich stornieren?')) {
                        handleAction(() => cancelRide(ride.id));
                      }
                    }}
                    disabled={isPending}
                  >
                    Stornieren
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Map */}
      {ride.patient.latitude && ride.patient.longitude &&
       ride.destination.latitude && ride.destination.longitude && (
        <RouteMap
          origin={{
            lat: ride.patient.latitude,
            lng: ride.patient.longitude,
            label: ride.patient.name,
          }}
          destination={{
            lat: ride.destination.latitude,
            lng: ride.destination.longitude,
            label: ride.destination.name,
          }}
        />
      )}

      {/* Notes */}
      {ride.patient.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notizen</CardTitle>
          </CardHeader>
          <p className="text-gray-600">{ride.patient.notes}</p>
        </Card>
      )}
    </div>
  );
}
