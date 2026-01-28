import { redirect } from 'next/navigation';
import Link from 'next/link';
import { RideList } from '@/components/rides';
import { Card, StatusBadge } from '@/components/ui';
import { getRidesForDriver } from '@/lib/actions/rides';
import { createClient } from '@/lib/supabase/server';

export default async function DriverRidesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Get driver by user_id
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, name')
    .eq('user_id', user.id)
    .single();

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Kein Fahrerprofil gefunden</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">
          Bitte kontaktiere einen Administrator, um dein Profil einzurichten.
        </p>
      </div>
    );
  }

  const rides = await getRidesForDriver(driver.id);

  // Split into categories
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pendingRides = rides.filter((r) => r.status === 'planned');
  const todaysRides = rides.filter((r) => {
    const pickupDate = new Date(r.pickup_time);
    return pickupDate >= today && pickupDate < tomorrow && r.status !== 'completed' && r.status !== 'cancelled';
  });
  const upcomingRides = rides.filter((r) => {
    const pickupDate = new Date(r.pickup_time);
    return pickupDate >= tomorrow && r.status !== 'completed' && r.status !== 'cancelled';
  });

  // Get next ride (earliest pending or today's ride)
  const nextRide = [...pendingRides, ...todaysRides].sort((a, b) =>
    new Date(a.pickup_time).getTime() - new Date(b.pickup_time).getTime()
  )[0];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pt-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Hallo {driver.name.split(' ')[0]}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          {todaysRides.length > 0
            ? `Du hast ${todaysRides.length} ${todaysRides.length === 1 ? 'Fahrt' : 'Fahrten'} für heute`
            : 'Keine Fahrten für heute geplant'}
        </p>
      </div>

      {/* Next Ride Hero */}
      {nextRide && (
        <Link href={`/my-rides/${nextRide.id}`}>
          <Card hover padding="none" className="overflow-hidden border-2 border-accent">
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wide mb-1">
                    {nextRide.status === 'planned' ? 'Bestätigung erforderlich' : 'Nächste Fahrt'}
                  </p>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {new Date(nextRide.pickup_time).toLocaleTimeString('de-CH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </h2>
                </div>
                <StatusBadge status={nextRide.status} />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Patient</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {nextRide.patient?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Ziel</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {nextRide.destination?.name}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Pending confirmation */}
      {pendingRides.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Ausstehende Bestätigungen
            </h2>
            <span className="ml-auto text-sm font-semibold text-warning-dark bg-warning-light px-2 py-1 rounded-full">
              {pendingRides.length}
            </span>
          </div>
          <RideList rides={pendingRides} linkPrefix="/my-rides" />
        </div>
      )}

      {/* Today */}
      {todaysRides.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Heute
          </h2>
          <RideList
            rides={todaysRides}
            emptyMessage="Keine Fahrten für heute"
            linkPrefix="/my-rides"
          />
        </div>
      )}

      {/* Upcoming */}
      {upcomingRides.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Kommende Fahrten
          </h2>
          <RideList rides={upcomingRides} linkPrefix="/my-rides" />
        </div>
      )}

      {/* Empty state when no rides at all */}
      {rides.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Keine Fahrten zugewiesen
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
            Du hast aktuell keine zugewiesenen Fahrten. Sobald dir Fahrten zugewiesen werden, erscheinen sie hier.
          </p>
        </div>
      )}
    </div>
  );
}
