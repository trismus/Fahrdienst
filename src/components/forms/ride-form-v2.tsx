'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import { RoutePreview } from '@/components/maps';
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
// ROUTE PREVIEW SECTION
// =============================================================================

interface RoutePreviewSectionProps {
  patients: Patient[];
  destinations: Destination[];
  patientId: string;
  destinationId: string;
  routeInfo: RouteInfo;
  onRouteCalculated: (info: { distanceKm: number; durationMinutes: number }) => void;
}

function RoutePreviewSection({
  patients,
  destinations,
  patientId,
  destinationId,
  routeInfo,
  onRouteCalculated,
}: RoutePreviewSectionProps) {
  // Find selected patient and destination
  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === patientId),
    [patients, patientId]
  );

  const selectedDestination = useMemo(
    () => destinations.find((d) => d.id === destinationId),
    [destinations, destinationId]
  );

  // Check if we have valid coordinates
  const hasValidCoordinates = useMemo(() => {
    return (
      selectedPatient?.latitude != null &&
      selectedPatient?.longitude != null &&
      selectedDestination?.latitude != null &&
      selectedDestination?.longitude != null
    );
  }, [selectedPatient, selectedDestination]);

  // Show nothing if no patient or destination selected
  if (!patientId || !destinationId) {
    return null;
  }

  // Show error if coordinates are missing
  if (!hasValidCoordinates) {
    return (
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
          Koordinaten fehlen fuer Routenberechnung. Bitte pruefen Sie die Adressen von Patient und Ziel.
        </p>
      </div>
    );
  }

  // Show route info while map loads (from API calculation)
  const showRouteInfoFallback = routeInfo.loading || (routeInfo.duration > 0 && !routeInfo.error);

  return (
    <div className="space-y-3">
      {/* Route Map Preview */}
      <RoutePreview
        patientCoordinates={{
          lat: selectedPatient?.latitude,
          lng: selectedPatient?.longitude,
          label: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : undefined,
        }}
        destinationCoordinates={{
          lat: selectedDestination?.latitude,
          lng: selectedDestination?.longitude,
          label: selectedDestination?.name,
        }}
        onRouteCalculated={onRouteCalculated}
      />

      {/* Route Info Fallback (when map hasn't loaded yet) */}
      {showRouteInfoFallback && routeInfo.loading && (
        <div className="p-4 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-xl">
          <p className="text-sm text-accent-700 dark:text-accent-400">Route wird berechnet...</p>
        </div>
      )}

      {/* Route Error */}
      {routeInfo.error && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">{routeInfo.error}</p>
        </div>
      )}
    </div>
  );
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
  // ROUTE CALCULATION HANDLER
  // =============================================================================

  // Handle route calculation result from RoutePreview
  const handleRouteCalculated = useCallback((info: { distanceKm: number; durationMinutes: number }) => {
    setRouteInfo({
      duration: info.durationMinutes,
      distance: info.distanceKm,
      loading: false,
      error: null,
    });

    // Auto-calculate arrival time if pickup time is set and no arrival time yet
    if (formData.pickupTime && !formData.arrivalTime) {
      const pickupDate = new Date(formData.pickupTime);
      // Add route duration + 5 min buffer
      const arrivalDate = new Date(pickupDate.getTime() + (info.durationMinutes * 60 * 1000) + (5 * 60 * 1000));
      setFormData((prev) => ({
        ...prev,
        arrivalTime: arrivalDate.toISOString().slice(0, 16),
      }));
    }
  }, [formData.pickupTime, formData.arrivalTime]);

  // Reset route info when patient or destination changes
  useEffect(() => {
    if (formData.patientId && formData.destinationId) {
      // Mark as loading while RoutePreview calculates
      setRouteInfo((prev) => ({ ...prev, loading: true, error: null }));
    } else {
      // Reset if either is not selected
      setRouteInfo({ duration: 0, distance: 0, loading: false, error: null });
    }
  }, [formData.patientId, formData.destinationId]);

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

        {/* Route Preview Map */}
        <RoutePreviewSection
          patients={patients}
          destinations={destinations}
          patientId={formData.patientId}
          destinationId={formData.destinationId}
          routeInfo={routeInfo}
          onRouteCalculated={handleRouteCalculated}
        />

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
