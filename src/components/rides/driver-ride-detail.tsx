'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, Button } from '@/components/ui';
import { RouteMap } from '@/components/maps';
import {
  driverConfirmRide,
  driverRejectRide,
  driverStartRide,
  driverCompleteRide,
} from '@/lib/actions/rides-driver';
import type { RideWithRelations } from '@/lib/actions/rides-v2';

// =============================================================================
// TYPES
// =============================================================================

interface DriverRideDetailProps {
  ride: RideWithRelations;
  driverId: string;
}

interface FeedbackState {
  type: 'success' | 'error' | null;
  message: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

function getPatientName(patient: RideWithRelations['patient']): string {
  return `${patient.firstName} ${patient.lastName}`;
}

function getPatientAddress(patient: RideWithRelations['patient']): string {
  const parts = [patient.street];
  if (patient.postalCode || patient.city) {
    parts.push(`${patient.postalCode} ${patient.city}`.trim());
  }
  return parts.join(', ');
}

function getDestinationAddress(destination: RideWithRelations['destination']): string {
  const parts = [destination.street];
  if (destination.postalCode || destination.city) {
    parts.push(`${destination.postalCode} ${destination.city}`.trim());
  }
  return parts.join(', ');
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planned: 'Geplant',
    confirmed: 'Bestaetigt',
    in_progress: 'Unterwegs',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DriverRideDetail({ ride, driverId }: DriverRideDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, message: '' });

  // Determine available actions based on status
  const canConfirm = ride.status === 'planned';
  const canReject = ride.status === 'planned' || ride.status === 'confirmed';
  const canStart = ride.status === 'confirmed';
  const canComplete = ride.status === 'in_progress';

  const handleAction = (
    action: () => Promise<{ success: boolean; message: string }>,
    successRedirect?: string
  ) => {
    setFeedback({ type: null, message: '' });

    startTransition(async () => {
      try {
        const result = await action();
        if (result.success) {
          setFeedback({ type: 'success', message: result.message });
          if (successRedirect) {
            setTimeout(() => router.push(successRedirect), 1500);
          } else {
            router.refresh();
          }
        } else {
          setFeedback({ type: 'error', message: result.message });
        }
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback.type && (
        <div
          className={`p-4 rounded-lg ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Fahrt Details</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {formatDateTime(ride.pickupTime)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ride.status)}`}>
            {getStatusLabel(ride.status)}
          </span>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Patient</h4>
            <div className="space-y-2">
              <p className="font-semibold text-lg">{getPatientName(ride.patient)}</p>
              <p className="text-gray-600 dark:text-gray-400">{getPatientAddress(ride.patient)}</p>

              {/* Phone Link */}
              <a
                href={`tel:${ride.patient.phone}`}
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {ride.patient.phone}
              </a>

              {/* Special Needs */}
              {(ride.patient.needsWheelchair || ride.patient.needsWalker || ride.patient.needsAssistance) && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                    Besondere Anforderungen:
                  </p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    {ride.patient.needsWheelchair && <li>- Rollstuhl erforderlich</li>}
                    {ride.patient.needsWalker && <li>- Rollator erforderlich</li>}
                    {ride.patient.needsAssistance && <li>- Begleitung erforderlich</li>}
                  </ul>
                </div>
              )}

              {/* Pickup Instructions */}
              {ride.patient.pickupInstructions && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                    Abholhinweise:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    {ride.patient.pickupInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Destination Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Ziel</h4>
            <div className="space-y-2">
              <p className="font-semibold text-lg">{ride.destination.name}</p>
              <p className="text-gray-600 dark:text-gray-400">{getDestinationAddress(ride.destination)}</p>

              {/* Destination Phone */}
              {ride.destination.phone && (
                <a
                  href={`tel:${ride.destination.phone}`}
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-dark"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {ride.destination.phone}
                </a>
              )}

              {/* Arrival Instructions */}
              {ride.destination.arrivalInstructions && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                    Ankunftshinweise:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    {ride.destination.arrivalInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Times Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Zeiten</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-20">Abholung:</span>
                <span className="font-semibold text-lg">{formatTime(ride.pickupTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-20">Ankunft:</span>
                <span className="font-semibold">{formatTime(ride.arrivalTime)}</span>
              </div>
              {ride.returnTime && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-20">Rueckfahrt:</span>
                  <span className="font-semibold">{formatTime(ride.returnTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Route Info Section */}
          {(ride.estimatedDuration || ride.estimatedDistance) && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Route</h4>
              <div className="space-y-2">
                {ride.estimatedDistance && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Entfernung:</span>
                    <span className="font-semibold">{ride.estimatedDistance} km</span>
                  </div>
                )}
                {ride.estimatedDuration && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Fahrzeit:</span>
                    <span className="font-semibold">{ride.estimatedDuration} Min.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t flex flex-wrap gap-3">
          {canConfirm && (
            <Button
              onClick={() => handleAction(() => driverConfirmRide(ride.id, driverId))}
              disabled={isPending}
              size="lg"
              className="flex-1 sm:flex-none"
            >
              {isPending ? 'Wird bestaetigt...' : 'Fahrt bestaetigen'}
            </Button>
          )}

          {canReject && (
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm('Fahrt wirklich ablehnen?')) {
                  handleAction(() => driverRejectRide(ride.id, driverId), '/my-rides');
                }
              }}
              disabled={isPending}
              size="lg"
              className="flex-1 sm:flex-none"
            >
              {isPending ? 'Wird abgelehnt...' : 'Ablehnen'}
            </Button>
          )}

          {canStart && (
            <Button
              onClick={() => handleAction(() => driverStartRide(ride.id, driverId))}
              disabled={isPending}
              size="lg"
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700"
            >
              {isPending ? 'Wird gestartet...' : 'Fahrt starten'}
            </Button>
          )}

          {canComplete && (
            <Button
              onClick={() => handleAction(() => driverCompleteRide(ride.id, driverId))}
              disabled={isPending}
              size="lg"
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
            >
              {isPending ? 'Wird abgeschlossen...' : 'Fahrt abschliessen'}
            </Button>
          )}
        </div>
      </Card>

      {/* Map Card */}
      {ride.patient.latitude && ride.patient.longitude &&
       ride.destination.latitude && ride.destination.longitude && (
        <Card>
          <CardHeader>
            <CardTitle>Route</CardTitle>
            {/* Navigation Links */}
            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${ride.patient.latitude},${ride.patient.longitude}&destination=${ride.destination.latitude},${ride.destination.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Navigation starten
              </a>
            </div>
          </CardHeader>
          <RouteMap
            origin={{
              lat: ride.patient.latitude,
              lng: ride.patient.longitude,
              label: getPatientName(ride.patient),
            }}
            destination={{
              lat: ride.destination.latitude,
              lng: ride.destination.longitude,
              label: ride.destination.name,
            }}
          />
        </Card>
      )}

      {/* Notes Card */}
      {(ride.notes || ride.patient.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Notizen</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {ride.notes && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Fahrt-Notizen:</p>
                <p className="text-gray-700 dark:text-gray-300">{ride.notes}</p>
              </div>
            )}
            {ride.patient.notes && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Patienten-Notizen:</p>
                <p className="text-gray-700 dark:text-gray-300">{ride.patient.notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
