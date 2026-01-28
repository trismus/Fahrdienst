'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import { createRide, updateRide, cancelRide, type CreateRideInput } from '@/lib/actions/rides-v2';
import { getDriversWithAvailability, type DriverWithAvailability } from '@/lib/actions/drivers-v2';
import type { Patient, Destination } from '@/types/database';
import type { RideWithRelations } from '@/lib/actions/rides-v2';

// =============================================================================
// TYPES
// =============================================================================

interface RideFormProps {
  ride?: RideWithRelations;
  patients: Patient[];
  destinations: Destination[];
  mode?: 'create' | 'edit';
}

interface RouteInfo {
  duration: number; // minutes
  distance: number; // kilometers
  loading: boolean;
  error: string | null;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RideFormV2({ ride, patients, destinations, mode = 'create' }: RideFormProps) {
  const router = useRouter();
  const isEditing = mode === 'edit' && ride;

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Driver availability state
  const [driversWithAvailability, setDriversWithAvailability] = useState<DriverWithAvailability[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Route calculation state
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({
    duration: ride?.estimatedDuration || 0,
    distance: ride?.estimatedDistance || 0,
    loading: false,
    error: null,
  });

  // Form data
  const formatDateTimeLocal = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    patientId: ride?.patientId || '',
    destinationId: ride?.destinationId || '',
    driverId: ride?.driverId || '',
    pickupTime: formatDateTimeLocal(ride?.pickupTime) || '',
    arrivalTime: formatDateTimeLocal(ride?.arrivalTime) || '',
    returnTime: formatDateTimeLocal(ride?.returnTime) || '',
    notes: ride?.notes || '',
    createReturnRide: false,
  });

  // Cancellation state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // =============================================================================
  // LOAD DRIVERS WITH AVAILABILITY
  // =============================================================================

  const loadDriverAvailability = useCallback(async (pickupTime: string) => {
    if (!pickupTime) {
      setDriversWithAvailability([]);
      return;
    }

    setLoadingDrivers(true);
    try {
      const isoTime = new Date(pickupTime).toISOString();
      const drivers = await getDriversWithAvailability(isoTime);
      setDriversWithAvailability(drivers);
    } catch (err) {
      console.error('Failed to load driver availability:', err);
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  // Load drivers when pickup time changes
  useEffect(() => {
    if (formData.pickupTime) {
      loadDriverAvailability(formData.pickupTime);
    }
  }, [formData.pickupTime, loadDriverAvailability]);

  // =============================================================================
  // ROUTE CALCULATION
  // =============================================================================

  const calculateRoute = useCallback(async () => {
    const patient = patients.find((p) => p.id === formData.patientId);
    const destination = destinations.find((d) => d.id === formData.destinationId);

    if (!patient || !destination) {
      return;
    }

    // Check if coordinates are available
    if (!patient.latitude || !patient.longitude || !destination.latitude || !destination.longitude) {
      setRouteInfo((prev) => ({
        ...prev,
        error: 'Koordinaten fehlen fuer Routenberechnung',
      }));
      return;
    }

    setRouteInfo((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/routes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: patient.latitude, lng: patient.longitude },
          destination: { lat: destination.latitude, lng: destination.longitude },
        }),
      });

      if (!response.ok) {
        throw new Error('Routenberechnung fehlgeschlagen');
      }

      const data = await response.json();

      setRouteInfo({
        duration: Math.round(data.duration / 60), // Convert seconds to minutes
        distance: Math.round(data.distance / 1000 * 10) / 10, // Convert meters to km
        loading: false,
        error: null,
      });

      // Auto-calculate arrival time if pickup time is set
      if (formData.pickupTime && data.duration) {
        const pickupDate = new Date(formData.pickupTime);
        const arrivalDate = new Date(pickupDate.getTime() + (data.duration * 1000) + (5 * 60 * 1000)); // Add 5 min buffer
        setFormData((prev) => ({
          ...prev,
          arrivalTime: arrivalDate.toISOString().slice(0, 16),
        }));
      }
    } catch (err) {
      setRouteInfo((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Routenberechnung fehlgeschlagen',
      }));
    }
  }, [formData.patientId, formData.destinationId, formData.pickupTime, patients, destinations]);

  // Calculate route when patient or destination changes
  useEffect(() => {
    if (formData.patientId && formData.destinationId) {
      calculateRoute();
    }
  }, [formData.patientId, formData.destinationId, calculateRoute]);

  // =============================================================================
  // FORM HANDLERS
  // =============================================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.patientId || !formData.destinationId || !formData.pickupTime || !formData.arrivalTime) {
        throw new Error('Bitte fuellen Sie alle Pflichtfelder aus');
      }

      const input: CreateRideInput = {
        patientId: formData.patientId,
        destinationId: formData.destinationId,
        driverId: formData.driverId || null,
        pickupTime: new Date(formData.pickupTime).toISOString(),
        arrivalTime: new Date(formData.arrivalTime).toISOString(),
        returnTime: formData.returnTime ? new Date(formData.returnTime).toISOString() : null,
        estimatedDuration: routeInfo.duration || null,
        estimatedDistance: routeInfo.distance || null,
        notes: formData.notes || null,
        createReturnRide: formData.createReturnRide,
      };

      if (isEditing) {
        await updateRide(ride.id, input);
        setSuccess('Fahrt erfolgreich aktualisiert');
      } else {
        await createRide(input);
        setSuccess('Fahrt erfolgreich erstellt');
      }

      // Redirect after short delay to show success message
      setTimeout(() => {
        router.push('/rides');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!ride) return;

    setLoading(true);
    setError(null);

    try {
      await cancelRide(ride.id, cancelReason || undefined);
      setSuccess('Fahrt erfolgreich storniert');

      setTimeout(() => {
        router.push('/rides');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stornierung fehlgeschlagen');
    } finally {
      setLoading(false);
      setShowCancelDialog(false);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  const canEdit = !ride || (ride.status !== 'completed' && ride.status !== 'cancelled');
  const canCancel = ride && ride.status !== 'completed' && ride.status !== 'cancelled';

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isEditing ? 'Fahrt bearbeiten' : 'Neue Fahrt'}</CardTitle>
          {ride && (
            <Badge
              variant={
                ride.status === 'completed'
                  ? 'success'
                  : ride.status === 'cancelled'
                  ? 'danger'
                  : ride.status === 'in_progress'
                  ? 'warning'
                  : ride.status === 'confirmed'
                  ? 'info'
                  : 'default'
              }
            >
              {ride.status === 'planned' && 'Geplant'}
              {ride.status === 'confirmed' && 'Bestaetigt'}
              {ride.status === 'in_progress' && 'Unterwegs'}
              {ride.status === 'completed' && 'Abgeschlossen'}
              {ride.status === 'cancelled' && 'Storniert'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Patient *
          </label>
          <select
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            required
            disabled={!canEdit}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Patient auswaehlen</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName} - {patient.city}
              </option>
            ))}
          </select>
        </div>

        {/* Destination Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ziel *
          </label>
          <select
            name="destinationId"
            value={formData.destinationId}
            onChange={handleChange}
            required
            disabled={!canEdit}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Ziel auswaehlen</option>
            {destinations.map((dest) => (
              <option key={dest.id} value={dest.id}>
                {dest.name} - {dest.city}
              </option>
            ))}
          </select>
        </div>

        {/* Route Info */}
        {(routeInfo.duration > 0 || routeInfo.loading) && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            {routeInfo.loading ? (
              <p className="text-sm text-blue-700 dark:text-blue-400">Route wird berechnet...</p>
            ) : (
              <div className="flex gap-6">
                <div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">Dauer:</span>
                  <span className="ml-2 font-medium text-blue-800 dark:text-blue-300">
                    {routeInfo.duration} Min.
                  </span>
                </div>
                <div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">Distanz:</span>
                  <span className="ml-2 font-medium text-blue-800 dark:text-blue-300">
                    {routeInfo.distance} km
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {routeInfo.error && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">{routeInfo.error}</p>
          </div>
        )}

        {/* Time Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Abholzeit *
            </label>
            <input
              type="datetime-local"
              name="pickupTime"
              value={formData.pickupTime}
              onChange={handleChange}
              required
              disabled={!canEdit}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ankunftszeit *
            </label>
            <input
              type="datetime-local"
              name="arrivalTime"
              value={formData.arrivalTime}
              onChange={handleChange}
              required
              disabled={!canEdit}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Driver Selection with Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fahrer {loadingDrivers && <span className="text-gray-400">(Verfuegbarkeit wird geprueft...)</span>}
          </label>
          <select
            name="driverId"
            value={formData.driverId}
            onChange={handleChange}
            disabled={!canEdit}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Fahrer auswaehlen (optional)</option>
            {driversWithAvailability.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.availabilityStatus === 'available' && '● '}
                {driver.availabilityStatus === 'busy' && '◐ '}
                {driver.availabilityStatus === 'unavailable' && '○ '}
                {driver.firstName} {driver.lastName}
                {driver.availabilityStatus === 'busy' && ' (beschaeftigt)'}
                {driver.availabilityStatus === 'unavailable' && ' (nicht verfuegbar)'}
              </option>
            ))}
          </select>

          {/* Legend */}
          {driversWithAvailability.length > 0 && (
            <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Verfuegbar
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" /> Beschaeftigt
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400" /> Nicht verfuegbar
              </span>
            </div>
          )}
        </div>

        {/* Return Ride */}
        {!isEditing && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="createReturnRide"
                checked={formData.createReturnRide}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rueckfahrt erstellen
              </span>
            </label>

            {formData.createReturnRide && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rueckfahrtzeit
                </label>
                <input
                  type="datetime-local"
                  name="returnTime"
                  value={formData.returnTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notizen
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none"
            placeholder="Zusaetzliche Informationen..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {canEdit && (
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          )}

          {canCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCancelDialog(true)}
              disabled={loading}
            >
              Stornieren
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={loading}
          >
            {canEdit ? 'Abbrechen' : 'Zurueck'}
          </Button>
        </div>
      </form>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Fahrt stornieren
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sind Sie sicher, dass Sie diese Fahrt stornieren moechten?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grund (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         resize-none"
                placeholder="z.B. Patient hat abgesagt"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCancel}
                disabled={loading}
                variant="secondary"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Stornieren...' : 'Stornieren'}
              </Button>
              <Button
                onClick={() => setShowCancelDialog(false)}
                variant="ghost"
                disabled={loading}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
