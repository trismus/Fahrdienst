import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { CalendarView } from '@/components/calendar';
import { getRides, type RideWithRelations } from '@/lib/actions/rides-v2';

// =============================================================================
// TYPES
// =============================================================================

interface CalendarPageProps {
  searchParams: Promise<{
    view?: 'day' | 'week' | 'month';
    date?: string; // YYYY-MM-DD
  }>;
}

// =============================================================================
// HELPER: Transform RideWithRelations to CalendarView format
// =============================================================================

function transformRidesForCalendar(rides: RideWithRelations[]) {
  // CalendarView expects the legacy format with snake_case and nested objects
  return rides.map((ride) => ({
    id: ride.id,
    patient_id: ride.patientId,
    driver_id: ride.driverId,
    destination_id: ride.destinationId,
    pickup_time: ride.pickupTime,
    arrival_time: ride.arrivalTime,
    return_time: ride.returnTime,
    status: ride.status,
    recurrence_group: ride.recurrenceGroup,
    estimated_duration: ride.estimatedDuration,
    estimated_distance: ride.estimatedDistance,
    created_at: ride.createdAt,
    updated_at: ride.updatedAt,
    patient: ride.patient ? {
      id: ride.patient.id,
      name: `${ride.patient.firstName} ${ride.patient.lastName}`,
      address: `${ride.patient.street}, ${ride.patient.postalCode} ${ride.patient.city}`,
      latitude: ride.patient.latitude || 0,
      longitude: ride.patient.longitude || 0,
      phone: ride.patient.phone,
      special_needs: [
        ride.patient.needsWheelchair ? 'Rollstuhl' : null,
        ride.patient.needsWalker ? 'Rollator' : null,
        ride.patient.needsAssistance ? 'Begleitung' : null,
      ].filter(Boolean).join(', ') || undefined,
      notes: ride.patient.notes || undefined,
      created_at: ride.createdAt,
      updated_at: ride.updatedAt,
    } : undefined,
    driver: ride.driver ? {
      id: ride.driver.id,
      name: `${ride.driver.firstName} ${ride.driver.lastName}`,
      phone: ride.driver.phone,
      email: '',
      created_at: ride.createdAt,
      updated_at: ride.updatedAt,
    } : undefined,
    destination: ride.destination ? {
      id: ride.destination.id,
      name: ride.destination.name,
      address: `${ride.destination.street}, ${ride.destination.postalCode} ${ride.destination.city}`,
      latitude: ride.destination.latitude || 0,
      longitude: ride.destination.longitude || 0,
      arrival_window_start: '08:00',
      arrival_window_end: '18:00',
      created_at: ride.createdAt,
      updated_at: ride.updatedAt,
    } : undefined,
  }));
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;

  // Parse view and date from URL params
  const view = params.view || 'week';
  const dateParam = params.date;
  const initialDate = dateParam ? new Date(dateParam) : new Date();

  // Calculate date range based on view (fetch a bit more to handle edge cases)
  const startDate = new Date(initialDate);
  const endDate = new Date(initialDate);

  if (view === 'day') {
    // For day view, fetch just that day with some buffer
    startDate.setDate(startDate.getDate() - 1);
    endDate.setDate(endDate.getDate() + 1);
  } else if (view === 'week') {
    // For week view, fetch the whole week plus buffer
    startDate.setDate(startDate.getDate() - 7);
    endDate.setDate(endDate.getDate() + 14);
  } else {
    // For month view, fetch the whole month plus buffer
    startDate.setMonth(startDate.getMonth() - 1);
    endDate.setMonth(endDate.getMonth() + 2);
  }

  // Fetch rides for the date range
  const rides = await getRides({
    fromDate: startDate.toISOString(),
    toDate: endDate.toISOString(),
  });

  // Transform to CalendarView format
  const calendarRides = transformRidesForCalendar(rides);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kalender
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Uebersicht aller geplanten Fahrten
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/rides">
            <Button variant="secondary">
              Listenansicht
            </Button>
          </Link>
          <Link href="/rides/new">
            <Button>
              Neue Fahrt
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Fahrten gesamt</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {rides.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Nicht zugewiesen</p>
          <p className="text-2xl font-bold text-orange-600">
            {rides.filter(r => !r.driverId && r.status !== 'cancelled').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Bestaetigt</p>
          <p className="text-2xl font-bold text-blue-600">
            {rides.filter(r => r.status === 'confirmed').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Abgeschlossen</p>
          <p className="text-2xl font-bold text-green-600">
            {rides.filter(r => r.status === 'completed').length}
          </p>
        </Card>
      </div>

      {/* Calendar View */}
      <CalendarView
        rides={calendarRides as Parameters<typeof CalendarView>[0]['rides']}
        initialDate={initialDate}
        initialView={view}
      />

      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Legende
        </h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="text-gray-600 dark:text-gray-400">Geplant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-gray-600 dark:text-gray-400">Bestaetigt</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-gray-600 dark:text-gray-400">Unterwegs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600 dark:text-gray-400">Abgeschlossen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="text-gray-600 dark:text-gray-400">Storniert</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
