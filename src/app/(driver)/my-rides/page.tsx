import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, StatusBadge } from '@/components/ui';
import { DriverRideList } from '@/components/rides';
import { getDriverRides } from '@/lib/actions/rides-driver';
import { getUserProfile } from '@/lib/actions/auth';
import { getDriverById } from '@/lib/actions/drivers-v2';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getDateRanges() {
  const now = new Date();

  // Today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Tomorrow
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  // This week (rest of week after tomorrow)
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    today: { start: todayStart.toISOString(), end: todayEnd.toISOString() },
    tomorrow: { start: tomorrowStart.toISOString(), end: tomorrowEnd.toISOString() },
    week: { start: tomorrowEnd.toISOString(), end: weekEnd.toISOString() },
  };
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function DriverRidesPage() {
  // Get user profile - this validates authentication and role
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'driver') {
    redirect('/dashboard');
  }

  if (!profile.driverId) {
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

  // Get driver record for display name
  const driver = await getDriverById(profile.driverId);

  if (!driver) {
    redirect('/');
  }

  // Get all rides for the driver (driver ID derived from session in the action)
  const allRides = await getDriverRides();
  const dateRanges = getDateRanges();

  // Categorize rides
  const pendingRides = allRides.filter((r) => r.status === 'planned');

  const todaysRides = allRides.filter((r) => {
    const pickupDate = new Date(r.pickupTime);
    return pickupDate >= new Date(dateRanges.today.start) &&
           pickupDate <= new Date(dateRanges.today.end) &&
           r.status !== 'completed' &&
           r.status !== 'cancelled';
  });

  const tomorrowsRides = allRides.filter((r) => {
    const pickupDate = new Date(r.pickupTime);
    return pickupDate >= new Date(dateRanges.tomorrow.start) &&
           pickupDate <= new Date(dateRanges.tomorrow.end) &&
           r.status !== 'completed' &&
           r.status !== 'cancelled';
  });

  const upcomingRides = allRides.filter((r) => {
    const pickupDate = new Date(r.pickupTime);
    return pickupDate > new Date(dateRanges.tomorrow.end) &&
           r.status !== 'completed' &&
           r.status !== 'cancelled';
  });

  // Get next ride (earliest pending or today's ride)
  const activeRides = [...todaysRides].filter(
    (r) => r.status === 'planned' || r.status === 'confirmed' || r.status === 'in_progress'
  ).sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime());

  const nextRide = activeRides[0];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pt-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Hallo {driver.firstName}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          {todaysRides.length > 0
            ? `Du hast ${todaysRides.length} ${todaysRides.length === 1 ? 'Fahrt' : 'Fahrten'} fuer heute`
            : 'Keine Fahrten fuer heute geplant'}
        </p>
      </div>

      {/* Next Ride Hero Card */}
      {nextRide && (
        <Link href={`/my-rides/${nextRide.id}`}>
          <Card hover padding="none" className="overflow-hidden border-2 border-accent">
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wide mb-1">
                    {nextRide.status === 'planned' ? 'Bestaetigung erforderlich' :
                     nextRide.status === 'confirmed' ? 'Naechste Fahrt' :
                     nextRide.status === 'in_progress' ? 'Aktive Fahrt' : 'Naechste Fahrt'}
                  </p>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {formatTime(nextRide.pickupTime)}
                  </h2>
                </div>
                <StatusBadge status={nextRide.status} />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Patient</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {nextRide.patient.firstName} {nextRide.patient.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Ziel</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {nextRide.destination.name}
                  </p>
                </div>
                {/* Special needs indicator */}
                {(nextRide.patient.needsWheelchair || nextRide.patient.needsWalker || nextRide.patient.needsAssistance) && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded-full">
                      <span>!</span>
                      {nextRide.patient.needsWheelchair && 'Rollstuhl'}
                      {nextRide.patient.needsWheelchair && nextRide.patient.needsWalker && ' + '}
                      {nextRide.patient.needsWalker && 'Rollator'}
                      {(nextRide.patient.needsWheelchair || nextRide.patient.needsWalker) && nextRide.patient.needsAssistance && ' + '}
                      {nextRide.patient.needsAssistance && 'Begleitung'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Pending Confirmations */}
      {pendingRides.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Ausstehende Bestaetigungen
            </h2>
            <span className="ml-auto text-sm font-semibold text-warning-dark bg-warning-light px-2 py-1 rounded-full">
              {pendingRides.length}
            </span>
          </div>
          <DriverRideList rides={pendingRides} />
        </div>
      )}

      {/* Today's Rides */}
      {todaysRides.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Heute
          </h2>
          <DriverRideList rides={todaysRides} emptyMessage="Keine Fahrten fuer heute" />
        </div>
      )}

      {/* Tomorrow's Rides */}
      {tomorrowsRides.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Morgen
          </h2>
          <DriverRideList rides={tomorrowsRides} />
        </div>
      )}

      {/* Upcoming Rides */}
      {upcomingRides.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Kommende Fahrten
          </h2>
          <DriverRideList rides={upcomingRides} />
        </div>
      )}

      {/* Empty State */}
      {allRides.length === 0 && (
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
