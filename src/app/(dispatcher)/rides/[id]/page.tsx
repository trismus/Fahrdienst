import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RideFormV2 } from '@/components/forms/ride-form-v2';
import { Card, Button, Badge } from '@/components/ui';
import { getRideById, type RideStatus } from '@/lib/actions/rides-v2';
import { getPatients } from '@/lib/actions/patients-v2';
import { getDestinations } from '@/lib/actions/destinations-v2';

// =============================================================================
// TYPES
// =============================================================================

interface RideDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

function StatusBadge({ status }: { status: RideStatus }) {
  const config: Record<RideStatus, { variant: 'default' | 'info' | 'warning' | 'success' | 'danger'; label: string }> = {
    planned: { variant: 'default', label: 'Geplant' },
    confirmed: { variant: 'info', label: 'Bestaetigt' },
    in_progress: { variant: 'warning', label: 'Unterwegs' },
    completed: { variant: 'success', label: 'Abgeschlossen' },
    cancelled: { variant: 'danger', label: 'Storniert' },
  };

  const { variant, label } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function RideDetailPage({ params, searchParams }: RideDetailPageProps) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [ride, patients, destinations] = await Promise.all([
    getRideById(id),
    getPatients(),
    getDestinations(),
  ]);

  if (!ride) {
    notFound();
  }

  const isEditMode = edit === 'true';

  // Edit mode - show form
  if (isEditMode) {
    return (
      <div>
        <div className="mb-4">
          <Link href={`/rides/${id}`}>
            <Button variant="ghost" size="sm">
              Zurueck zu Details
            </Button>
          </Link>
        </div>
        <RideFormV2
          ride={ride}
          patients={patients}
          destinations={destinations}
          mode="edit"
        />
      </div>
    );
  }

  // View mode - show details
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/rides">
            <Button variant="ghost" size="sm">
              Zurueck
            </Button>
          </Link>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Fahrt Details
          </h1>
          <StatusBadge status={ride.status} />
        </div>
        {ride.status !== 'completed' && ride.status !== 'cancelled' && (
          <Link href={`/rides/${id}?edit=true`}>
            <Button variant="secondary">Bearbeiten</Button>
          </Link>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Ride Info */}
        <div className="space-y-6">
          {/* Time Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Zeitplan
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Abholung</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {new Date(ride.pickupTime).toLocaleDateString('de-CH', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {new Date(ride.pickupTime).toLocaleTimeString('de-CH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ankunft</p>
                  <p className="text-2xl font-bold text-green-600">
                    {new Date(ride.arrivalTime).toLocaleTimeString('de-CH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {ride.estimatedDuration && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dauer</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ride.estimatedDuration} Min.
                      </p>
                    </div>
                    {ride.estimatedDistance && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Distanz</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ride.estimatedDistance} km
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Patient Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Patient
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {ride.patient.firstName} {ride.patient.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {ride.patient.street}, {ride.patient.city}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Telefon</p>
                <a
                  href={`tel:${ride.patient.phone}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {ride.patient.phone}
                </a>
              </div>
              {(ride.patient.needsWheelchair || ride.patient.needsWalker || ride.patient.needsAssistance) && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Besondere Beduerfnisse</p>
                  <div className="flex flex-wrap gap-2">
                    {ride.patient.needsWheelchair && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm">
                        Rollstuhl
                      </span>
                    )}
                    {ride.patient.needsWalker && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm">
                        Rollator
                      </span>
                    )}
                    {ride.patient.needsAssistance && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm">
                        Begleitung
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Destination Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ziel
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {ride.destination.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {ride.destination.street}, {ride.destination.city}
                </p>
              </div>
            </div>
          </Card>

          {/* Driver Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Fahrer
            </h2>
            {ride.driver ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {ride.driver.firstName} {ride.driver.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Telefon</p>
                  <a
                    href={`tel:${ride.driver.phone}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {ride.driver.phone}
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
                <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-orange-700 dark:text-orange-400 font-medium">
                  Kein Fahrer zugewiesen
                </p>
              </div>
            )}
          </Card>

          {/* Notes Card */}
          {ride.notes && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notizen
              </h2>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {ride.notes}
              </p>
            </Card>
          )}

          {/* Cancellation Info */}
          {ride.status === 'cancelled' && (
            <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">
                Stornierung
              </h2>
              <div className="space-y-2">
                {ride.cancelledAt && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Storniert am: {new Date(ride.cancelledAt).toLocaleString('de-CH')}
                  </p>
                )}
                {ride.cancellationReason && (
                  <p className="text-red-700 dark:text-red-300">
                    Grund: {ride.cancellationReason}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div>
            <span className="font-medium">Erstellt:</span>{' '}
            {new Date(ride.createdAt).toLocaleString('de-CH')}
          </div>
          <div>
            <span className="font-medium">Aktualisiert:</span>{' '}
            {new Date(ride.updatedAt).toLocaleString('de-CH')}
          </div>
          {ride.recurrenceGroup && (
            <div>
              <span className="font-medium">Gruppe:</span>{' '}
              {ride.recurrenceGroup.substring(0, 8)}...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
