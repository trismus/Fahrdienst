'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, Button } from '@/components/ui';
import { RouteMap } from '@/components/maps';
import {
  driverConfirmRide,
  driverRejectRide,
  driverStartRide,
  driverArrivedAtPickup,
  driverPickedUpPatient,
  driverArrivedAtDestination,
  driverCompleteRide,
  driverQuickCompleteRide,
} from '@/lib/actions/rides-driver';
import type { RideWithRelations, RideSubstatus } from '@/lib/actions/rides-v2';

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
// EXECUTION PROGRESS STEPS
// =============================================================================

interface ProgressStep {
  id: RideSubstatus;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  timestamp?: string | null;
}

const PROGRESS_STEPS: Omit<ProgressStep, 'timestamp'>[] = [
  {
    id: 'waiting',
    label: 'Bereit',
    shortLabel: 'Bereit',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'en_route_pickup',
    label: 'Auf dem Weg zur Abholung',
    shortLabel: 'Unterwegs',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: 'at_pickup',
    label: 'Bei Patient',
    shortLabel: 'Abholung',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'en_route_destination',
    label: 'Auf dem Weg zum Ziel',
    shortLabel: 'Transport',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 'at_destination',
    label: 'Am Ziel angekommen',
    shortLabel: 'Am Ziel',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'completed',
    label: 'Abgeschlossen',
    shortLabel: 'Fertig',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

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

function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return '';
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

function getSubstatusLabel(substatus: RideSubstatus | null): string {
  if (!substatus) return '';
  const labels: Record<RideSubstatus, string> = {
    waiting: 'Warten auf Start',
    en_route_pickup: 'Auf dem Weg zur Abholung',
    at_pickup: 'Bei Patient',
    en_route_destination: 'Auf dem Weg zum Ziel',
    at_destination: 'Am Ziel angekommen',
    completed: 'Abgeschlossen',
  };
  return labels[substatus];
}

function getCurrentStepIndex(substatus: RideSubstatus | null): number {
  if (!substatus) return -1;
  return PROGRESS_STEPS.findIndex((step) => step.id === substatus);
}

// =============================================================================
// PROGRESS TRACKER COMPONENT
// =============================================================================

function ProgressTracker({ ride }: { ride: RideWithRelations }) {
  const currentIndex = getCurrentStepIndex(ride.substatus);

  // Map timestamps to steps
  const getTimestampForStep = (stepId: RideSubstatus): string | null => {
    switch (stepId) {
      case 'en_route_pickup':
        return ride.startedAt;
      case 'at_pickup':
        return ride.startedAt; // Same as started for now
      case 'en_route_destination':
        return ride.pickedUpAt;
      case 'at_destination':
        return ride.arrivedAt;
      case 'completed':
        return ride.completedAt;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Mobile: Vertical Stepper */}
      <div className="md:hidden space-y-4">
        {PROGRESS_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const timestamp = getTimestampForStep(step.id);

          return (
            <div key={step.id} className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-purple-500 text-white animate-pulse'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium ${
                    isCompleted || isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                {timestamp && (isCompleted || isCurrent) && (
                  <p className="text-sm text-gray-500">{formatTimestamp(timestamp)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal Stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {PROGRESS_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const timestamp = getTimestampForStep(step.id);

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Line */}
                <div className="flex items-center w-full">
                  {index > 0 && (
                    <div
                      className={`h-1 flex-1 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                  {/* Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-purple-500 text-white animate-pulse'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </div>
                  {index < PROGRESS_STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
                {/* Label */}
                <p
                  className={`text-xs mt-2 text-center ${
                    isCompleted || isCurrent ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'
                  }`}
                >
                  {step.shortLabel}
                </p>
                {/* Timestamp */}
                {timestamp && (isCompleted || isCurrent) && (
                  <p className="text-xs text-gray-500">{formatTimestamp(timestamp)}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DriverRideDetail({ ride, driverId }: DriverRideDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, message: '' });

  // Determine available actions based on status and substatus
  const canConfirm = ride.status === 'planned';
  const canReject = ride.status === 'planned' || ride.status === 'confirmed';
  const canStart = ride.status === 'confirmed';
  const canArrivedAtPickup = ride.status === 'in_progress' && ride.substatus === 'en_route_pickup';
  const canPickedUp = ride.status === 'in_progress' && (ride.substatus === 'en_route_pickup' || ride.substatus === 'at_pickup');
  const canArrivedAtDestination = ride.status === 'in_progress' && ride.substatus === 'en_route_destination';
  const canComplete = ride.status === 'in_progress' && (ride.substatus === 'at_destination' || ride.substatus === 'en_route_destination');
  const canQuickComplete = ride.status === 'confirmed' || ride.status === 'in_progress';
  const isCompleted = ride.status === 'completed';
  const showProgressTracker = ride.status === 'in_progress' || ride.status === 'completed';

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

  // Get the next action based on current substatus
  const getNextAction = () => {
    if (canConfirm) {
      return {
        label: 'Fahrt bestaetigen',
        pendingLabel: 'Wird bestaetigt...',
        action: () => driverConfirmRide(ride.id, driverId),
        color: 'bg-blue-600 hover:bg-blue-700',
      };
    }
    if (canStart) {
      return {
        label: 'Fahrt starten',
        pendingLabel: 'Wird gestartet...',
        action: () => driverStartRide(ride.id, driverId),
        color: 'bg-purple-600 hover:bg-purple-700',
      };
    }
    if (canArrivedAtPickup) {
      return {
        label: 'Bei Patient angekommen',
        pendingLabel: 'Wird aktualisiert...',
        action: () => driverArrivedAtPickup(ride.id, driverId),
        color: 'bg-purple-600 hover:bg-purple-700',
      };
    }
    if (canPickedUp) {
      return {
        label: 'Patient abgeholt',
        pendingLabel: 'Wird aktualisiert...',
        action: () => driverPickedUpPatient(ride.id, driverId),
        color: 'bg-purple-600 hover:bg-purple-700',
      };
    }
    if (canArrivedAtDestination) {
      return {
        label: 'Am Ziel angekommen',
        pendingLabel: 'Wird aktualisiert...',
        action: () => driverArrivedAtDestination(ride.id, driverId),
        color: 'bg-purple-600 hover:bg-purple-700',
      };
    }
    if (canComplete) {
      return {
        label: 'Fahrt abschliessen',
        pendingLabel: 'Wird abgeschlossen...',
        action: () => driverCompleteRide(ride.id, driverId),
        color: 'bg-green-600 hover:bg-green-700',
      };
    }
    return null;
  };

  const nextAction = getNextAction();

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

      {/* Progress Tracker Card - Show during execution */}
      {showProgressTracker && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Fahrtfortschritt
            </h3>
            {ride.substatus && (
              <span className="text-sm text-gray-500">
                {getSubstatusLabel(ride.substatus)}
              </span>
            )}
          </div>
          <ProgressTracker ride={ride} />
        </Card>
      )}

      {/* Main Action Card - Large, prominent action button */}
      {nextAction && (
        <Card className="p-6 border-2 border-primary/20">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">Naechster Schritt</p>
            <Button
              onClick={() => handleAction(nextAction.action)}
              disabled={isPending}
              size="lg"
              className={`w-full text-lg py-6 ${nextAction.color}`}
            >
              {isPending ? nextAction.pendingLabel : nextAction.label}
            </Button>

            {/* Quick Complete Option */}
            {canQuickComplete && !isCompleted && (
              <button
                onClick={() => {
                  if (confirm('Fahrt direkt abschliessen? (Alle Zwischenschritte werden uebersprungen)')) {
                    handleAction(() => driverQuickCompleteRide(ride.id, driverId));
                  }
                }}
                disabled={isPending}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                Schnellabschluss
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Completed Message */}
      {isCompleted && (
        <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">
              Fahrt abgeschlossen
            </h3>
            {ride.completedAt && (
              <p className="text-green-700 dark:text-green-400">
                Abgeschlossen um {formatTimestamp(ride.completedAt)}
              </p>
            )}
          </div>
        </Card>
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
            <h4 className="text-sm font-medium text-gray-500 mb-3">Geplante Zeiten</h4>
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

          {/* Actual Timestamps Section - Show when ride has execution data */}
          {(ride.startedAt || ride.pickedUpAt || ride.arrivedAt || ride.completedAt) && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Tatsaechliche Zeiten</h4>
              <div className="space-y-2">
                {ride.startedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Gestartet:</span>
                    <span className="font-semibold">{formatTimestamp(ride.startedAt)}</span>
                  </div>
                )}
                {ride.pickedUpAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Abgeholt:</span>
                    <span className="font-semibold">{formatTimestamp(ride.pickedUpAt)}</span>
                  </div>
                )}
                {ride.arrivedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Angekommen:</span>
                    <span className="font-semibold">{formatTimestamp(ride.arrivedAt)}</span>
                  </div>
                )}
                {ride.completedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Abgeschlossen:</span>
                    <span className="font-semibold text-green-600">{formatTimestamp(ride.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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

        {/* Secondary Action Buttons - Reject */}
        {canReject && (
          <div className="mt-8 pt-6 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm('Fahrt wirklich ablehnen?')) {
                  handleAction(() => driverRejectRide(ride.id, driverId), '/my-rides');
                }
              }}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? 'Wird abgelehnt...' : 'Fahrt ablehnen'}
            </Button>
          </div>
        )}
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
