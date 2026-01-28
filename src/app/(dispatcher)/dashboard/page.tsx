import Link from 'next/link';
import { CalendarView } from '@/components/calendar';
import { Card, CardHeader, CardTitle, Button, StatusBadge } from '@/components/ui';
import { getRides } from '@/lib/actions/rides';

export default async function DashboardPage() {
  const rides = await getRides();

  // Get today's rides
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysRides = rides.filter((ride) => {
    const pickupDate = new Date(ride.pickup_time);
    return pickupDate >= today && pickupDate < tomorrow;
  });

  // Get unassigned rides
  const unassignedRides = rides.filter(
    (ride) => !ride.driver_id && ride.status === 'planned'
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center pt-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
            Dashboard
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            {new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/rides/new">
          <Button size="lg">Neue Fahrt</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Fahrten heute
              </p>
              <p className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {todaysRides.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card padding="lg" className={unassignedRides.length > 0 ? 'border-warning bg-warning-light/30 dark:bg-warning-dark/10' : ''}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Nicht zugewiesen
              </p>
              <p className={`text-4xl font-bold tabular-nums ${unassignedRides.length > 0 ? 'text-warning-dark' : 'text-neutral-900 dark:text-neutral-100'}`}>
                {unassignedRides.length}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${unassignedRides.length > 0 ? 'bg-warning-light' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
              <svg className={`w-6 h-6 ${unassignedRides.length > 0 ? 'text-warning-dark' : 'text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Gesamt diese Woche
              </p>
              <p className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {rides.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Unassigned rides alert */}
      {unassignedRides.length > 0 && (
        <Card className="border-2 border-warning bg-warning-light/20 dark:bg-warning-dark/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <CardTitle className="text-warning-dark dark:text-warning">
                Nicht zugewiesene Fahrten
              </CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-2">
            {unassignedRides.slice(0, 5).map((ride) => (
              <Link
                key={ride.id}
                href={`/rides/${ride.id}`}
                className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-neutral-900 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="text-base font-bold text-primary tabular-nums">
                    {new Date(ride.pickup_time).toLocaleTimeString('de-CH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700"></div>
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{ride.patient?.name}</span>
                    <span className="text-neutral-400 mx-2">→</span>
                    <span className="text-neutral-600 dark:text-neutral-400">{ride.destination?.name}</span>
                  </div>
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {new Date(ride.pickup_time).toLocaleDateString('de-CH', { day: '2-digit', month: 'short' })}
                </div>
              </Link>
            ))}
            {unassignedRides.length > 5 && (
              <Link href="/rides" className="block text-sm text-warning-dark dark:text-warning hover:underline font-medium pt-2">
                Alle {unassignedRides.length} anzeigen →
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Calendar */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Kalenderübersicht
        </h2>
        <CalendarView rides={rides} />
      </div>

      {/* Today's rides list */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Fahrten heute
        </h2>
        {todaysRides.length === 0 ? (
          <Card padding="lg">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">Keine Fahrten für heute geplant</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {todaysRides.map((ride) => (
              <Link key={ride.id} href={`/rides/${ride.id}`}>
                <Card hover padding="none">
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-5 flex-1">
                      <div className="text-2xl font-bold text-primary tabular-nums min-w-[64px]">
                        {new Date(ride.pickup_time).toLocaleTimeString('de-CH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="h-12 w-px bg-neutral-200 dark:bg-neutral-700"></div>
                      <div className="flex-1">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
                          {ride.patient?.name}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {ride.destination?.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {ride.driver ? (
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                          {ride.driver.name}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-warning-dark bg-warning-light px-3 py-1 rounded-full">
                          Nicht zugewiesen
                        </span>
                      )}
                      <StatusBadge status={ride.status} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
