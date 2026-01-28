import Link from 'next/link';
import { Button, Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { getRides, getRideStats, type RideStatus } from '@/lib/actions/rides-v2';
import { getDrivers } from '@/lib/actions/drivers-v2';

// =============================================================================
// HELPERS
// =============================================================================

function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

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

interface PageProps {
  searchParams: Promise<{
    date?: string;
    status?: RideStatus;
    driver?: string;
  }>;
}

export default async function RidesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Get today's date as default
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = params.date || today;
  const selectedStatus = params.status;
  const selectedDriver = params.driver;

  // Fetch data
  const [rides, stats, drivers] = await Promise.all([
    getRides({
      date: selectedDate,
      status: selectedStatus,
      driverId: selectedDriver === 'unassigned' ? undefined : selectedDriver,
    }),
    getRideStats(selectedDate),
    getDrivers(),
  ]);

  // Filter unassigned if requested
  const filteredRides = selectedDriver === 'unassigned'
    ? rides.filter(r => !r.driverId)
    : rides;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fahrten</h1>
        <Link href="/rides/new">
          <Button>Neue Fahrt</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Gesamt</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Geplant</p>
          <p className="text-2xl font-bold text-gray-600">{stats.planned}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Bestaetigt</p>
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unterwegs</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Abgeschlossen</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ohne Fahrer</p>
          <p className="text-2xl font-bold text-orange-600">{stats.unassigned}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form className="flex flex-wrap gap-4 items-end">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Datum
            </label>
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              defaultValue={selectedStatus || ''}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Alle</option>
              <option value="planned">Geplant</option>
              <option value="confirmed">Bestaetigt</option>
              <option value="in_progress">Unterwegs</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>

          {/* Driver Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fahrer
            </label>
            <select
              name="driver"
              defaultValue={selectedDriver || ''}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Alle</option>
              <option value="unassigned">Nicht zugewiesen</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.firstName} {driver.lastName}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="secondary">
            Filtern
          </Button>

          <Link href="/rides">
            <Button type="button" variant="ghost">
              Zuruecksetzen
            </Button>
          </Link>
        </form>
      </Card>

      {/* Rides Table */}
      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zeit</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Von</TableHead>
              <TableHead>Nach</TableHead>
              <TableHead>Fahrer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                  <div className="space-y-2">
                    <p className="text-lg">Keine Fahrten gefunden</p>
                    <p className="text-sm">
                      {selectedDate === today
                        ? 'Es sind keine Fahrten fuer heute geplant.'
                        : `Es sind keine Fahrten fuer den ${formatDate(selectedDate)} geplant.`
                      }
                    </p>
                    <Link href="/rides/new">
                      <Button size="sm" className="mt-2">Fahrt erstellen</Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRides.map((ride) => (
                <TableRow key={ride.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <div className="font-medium">
                      {new Date(ride.pickupTime).toLocaleTimeString('de-CH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(ride.pickupTime)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {ride.patient.firstName} {ride.patient.lastName}
                    </div>
                    <div className="text-sm text-gray-500 flex gap-2">
                      {ride.patient.needsWheelchair && (
                        <span title="Rollstuhl">Rollstuhl</span>
                      )}
                      {ride.patient.needsWalker && (
                        <span title="Rollator">Rollator</span>
                      )}
                      {ride.patient.needsAssistance && (
                        <span title="Begleitung">Begleitung</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {ride.patient.city}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ride.destination.name}</div>
                    <div className="text-sm text-gray-500">{ride.destination.city}</div>
                  </TableCell>
                  <TableCell>
                    {ride.driver ? (
                      <span className="font-medium">
                        {ride.driver.firstName} {ride.driver.lastName}
                      </span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400">
                        Nicht zugewiesen
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ride.status} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/rides/${ride.id}`}>
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
