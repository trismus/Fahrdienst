'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle } from '@/components/ui';
import { getDriversWithAvailability, type DriverWithAvailability, type AvailabilityStatus } from '@/lib/actions/drivers-v2';
import { assignDriverWithNotification, unassignDriverFromRide } from '@/lib/actions/ride-assignment';

// =============================================================================
// TYPES
// =============================================================================

interface DriverAssignmentProps {
  rideId: string;
  currentDriverId: string | null;
  currentDriverName: string | null;
  pickupTime: string;
  rideStatus: string;
}

// =============================================================================
// AVAILABILITY BADGE COMPONENT
// =============================================================================

function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const config: Record<AvailabilityStatus, { bg: string; text: string; label: string }> = {
    available: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      label: 'Verfuegbar',
    },
    busy: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300',
      label: 'Beschaeftigt',
    },
    unavailable: {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-400',
      label: 'Nicht verfuegbar',
    },
  };

  const { bg, text, label } = config[status];

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DriverAssignment({
  rideId,
  currentDriverId,
  currentDriverName,
  pickupTime,
  rideStatus,
}: DriverAssignmentProps) {
  const router = useRouter();

  // State
  const [drivers, setDrivers] = useState<DriverWithAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  // Check if assignment/unassignment is allowed
  const canModify = rideStatus === 'planned' || rideStatus === 'confirmed';

  // Load drivers with availability
  const loadDrivers = useCallback(async () => {
    setLoadingDrivers(true);
    try {
      const data = await getDriversWithAvailability(pickupTime);
      // Sort: available first, then busy, then unavailable
      const sorted = data.sort((a, b) => {
        const order: Record<AvailabilityStatus, number> = {
          available: 0,
          busy: 1,
          unavailable: 2,
        };
        return order[a.availabilityStatus] - order[b.availabilityStatus];
      });
      setDrivers(sorted);
    } catch (err) {
      console.error('Failed to load drivers:', err);
    } finally {
      setLoadingDrivers(false);
    }
  }, [pickupTime]);

  useEffect(() => {
    if (showSelector) {
      loadDrivers();
    }
  }, [showSelector, loadDrivers]);

  // Handle driver assignment
  const handleAssign = async (driverId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await assignDriverWithNotification(rideId, driverId);

      if (result.success) {
        setSuccess(result.message);
        setShowSelector(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  // Handle driver unassignment
  const handleUnassign = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await unassignDriverFromRide(rideId);

      if (result.success) {
        setSuccess(result.message);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fahrer-Zuweisung</CardTitle>
          {canModify && currentDriverId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnassign}
              disabled={loading}
              className="text-red-600 hover:text-red-700"
            >
              Entfernen
            </Button>
          )}
        </div>
      </CardHeader>

      <div className="p-4 space-y-4">
        {/* Messages */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Current Driver */}
        {currentDriverId ? (
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {currentDriverName}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Fahrer zugewiesen
                </p>
              </div>
            </div>
            {canModify && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSelector(true)}
              >
                Aendern
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-orange-900 dark:text-orange-100">
                  Kein Fahrer zugewiesen
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Fahrt ist noch nicht vergeben
                </p>
              </div>
            </div>
            {canModify && (
              <Button onClick={() => setShowSelector(true)}>
                Fahrer zuweisen
              </Button>
            )}
          </div>
        )}

        {/* Driver Selector */}
        {showSelector && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Fahrer auswaehlen
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSelector(false)}
              >
                Abbrechen
              </Button>
            </div>

            {loadingDrivers ? (
              <div className="text-center py-8 text-gray-500">
                Fahrer werden geladen...
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Keine Fahrer verfuegbar
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {drivers.map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => handleAssign(driver.id)}
                    disabled={loading || driver.id === currentDriverId}
                    className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-colors
                      ${driver.id === currentDriverId
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                        : driver.availabilityStatus === 'available'
                        ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                        : driver.availabilityStatus === 'busy'
                        ? 'bg-yellow-50/50 dark:bg-yellow-900/10 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 opacity-60'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        driver.availabilityStatus === 'available'
                          ? 'bg-green-500'
                          : driver.availabilityStatus === 'busy'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {driver.firstName} {driver.lastName}
                        </p>
                        {driver.vehiclePlate && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {driver.vehiclePlate}
                          </p>
                        )}
                      </div>
                    </div>
                    <AvailabilityBadge status={driver.availabilityStatus} />
                  </button>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Legende:</p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> Verfuegbar - Zeitslot frei
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" /> Beschaeftigt - andere Fahrt in der Naehe
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400" /> Nicht verfuegbar - abwesend oder keine Verfuegbarkeit
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
