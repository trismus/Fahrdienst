import Link from 'next/link';
import { CalendarView } from '@/components/calendar';
import { Card, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { ActiveRidesCard, LiveActivityPanel, DashboardAutoRefresh } from '@/components/dashboard';
import { getRides, getRideStats, type RideStatus } from '@/lib/actions/rides-v2';

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

export default async function DashboardPage() {
  // Get this week's date range
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
  endOfWeek.setHours(23, 59, 59, 999);

  // Fetch data
  const [weekRides, todayStats] = await Promise.all([
    getRides({
      fromDate: startOfWeek.toISOString(),
      toDate: endOfWeek.toISOString(),
    }),
    getRideStats(), // Today's stats by default
  ]);

  // Filter today's rides
  const todayStr = today.toISOString().split('T')[0];
  const todaysRides = weekRides.filter((ride) =>
    ride.pickupTime.startsWith(todayStr)
  );

  // Get unassigned rides
  const unassignedRides = weekRides.filter(
    (ride) => !ride.driverId && ride.status !== 'cancelled' && ride.status !== 'completed'
  );

  // Sort today's rides by pickup time, then by status (in_progress first)
  const sortedTodaysRides = [...todaysRides].sort((a, b) => {
    // Active rides first
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
    // Then by pickup time
    return new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
  });

  return (
    <DashboardAutoRefresh>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {today.toLocaleDateString('de-CH', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <Link href="/rides/new">
            <Button size="lg">Neue Fahrt</Button>
          </Link>
        </div>

        {/* Stats Row 1 - Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Fahrten heute */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Fahrten heute
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {todayStats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Aktive Fahrten (Real-time) */}
          <ActiveRidesCard initialCount={todayStats.inProgress} />

          {/* Nicht zugewiesen */}
          <Card className={`p-6 ${unassignedRides.length > 0 ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Nicht zugewiesen
                </p>
                <p className={`text-4xl font-bold tabular-nums ${unassignedRides.length > 0 ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
                  {unassignedRides.length}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${unassignedRides.length > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <svg className={`w-6 h-6 ${unassignedRides.length > 0 ? 'text-orange-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Abgeschlossen */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Abgeschlossen
                </p>
                <p className="text-4xl font-bold text-green-600 tabular-nums">
                  {todayStats.completed}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Two Column Layout: Unassigned + Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned rides alert */}
          {unassignedRides.length > 0 ? (
            <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <CardTitle className="text-orange-700 dark:text-orange-400">
                    Nicht zugewiesene Fahrten
                  </CardTitle>
                </div>
              </CardHeader>
              <div className="px-6 pb-6 space-y-2">
                {unassignedRides.slice(0, 5).map((ride) => (
                  <Link
                    key={ride.id}
                    href={`/rides/${ride.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-base font-bold text-blue-600 tabular-nums">
                        {new Date(ride.pickupTime).toLocaleTimeString('de-CH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {ride.patient.firstName} {ride.patient.lastName}
                        </span>
                        <span className="text-gray-400 mx-2">-</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {ride.destination.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ride.pickupTime).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
                  </Link>
                ))}
                {unassignedRides.length > 5 && (
                  <Link
                    href="/rides?driver=unassigned"
                    className="block text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium pt-2"
                  >
                    Alle {unassignedRides.length} anzeigen
                  </Link>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Alle Fahrten zugewiesen
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Keine offenen Zuweisungen
                </p>
              </div>
            </Card>
          )}

          {/* Live Activity Panel */}
          <LiveActivityPanel />
        </div>

        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Wochenuebersicht
            </h2>
            <Link href="/rides">
              <Button variant="ghost" size="sm">
                Alle Fahrten
              </Button>
            </Link>
          </div>
          <CalendarView
            rides={weekRides.map((ride) => ({
              id: ride.id,
              patient_id: ride.patientId,
              driver_id: ride.driverId || undefined,
              destination_id: ride.destinationId,
              pickup_time: ride.pickupTime,
              arrival_time: ride.arrivalTime,
              return_time: ride.returnTime || undefined,
              status: ride.status,
              created_at: ride.createdAt,
              updated_at: ride.updatedAt,
              patient: {
                id: ride.patient.id,
                name: `${ride.patient.firstName} ${ride.patient.lastName}`,
                address: `${ride.patient.street}, ${ride.patient.city}`,
                latitude: 0,
                longitude: 0,
                phone: ride.patient.phone,
                created_at: '',
                updated_at: '',
              },
              driver: ride.driver ? {
                id: ride.driver.id,
                name: `${ride.driver.firstName} ${ride.driver.lastName}`,
                phone: ride.driver.phone,
                email: '',
                created_at: '',
                updated_at: '',
              } : undefined,
              destination: {
                id: ride.destination.id,
                name: ride.destination.name,
                address: `${ride.destination.street}, ${ride.destination.city}`,
                latitude: 0,
                longitude: 0,
                arrival_window_start: '',
                arrival_window_end: '',
                created_at: '',
                updated_at: '',
              },
            }))}
          />
        </div>

        {/* Today's rides list */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Fahrten heute
          </h2>
          {sortedTodaysRides.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">
                  Keine Fahrten fuer heute geplant
                </p>
                <Link href="/rides/new">
                  <Button>Fahrt erstellen</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedTodaysRides.map((ride) => (
                <Link key={ride.id} href={`/rides/${ride.id}`}>
                  <Card className={`hover:shadow-md transition-all ${
                    ride.status === 'in_progress' ? 'border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-900/10' : ''
                  }`}>
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-5 flex-1">
                        <div className={`text-2xl font-bold tabular-nums min-w-[64px] ${
                          ride.status === 'in_progress' ? 'text-purple-600' : 'text-blue-600'
                        }`}>
                          {new Date(ride.pickupTime).toLocaleTimeString('de-CH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="h-12 w-px bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white text-base">
                            {ride.patient.firstName} {ride.patient.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {ride.destination.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {ride.driver ? (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                            {ride.driver.firstName} {ride.driver.lastName}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                            Nicht zugewiesen
                          </span>
                        )}
                        <StatusBadge status={ride.status} />
                        {ride.status === 'in_progress' && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardAutoRefresh>
  );
}
