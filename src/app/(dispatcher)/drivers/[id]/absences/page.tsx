import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import { getDriverById, getDriverAbsences } from '@/lib/actions/drivers-v2';

// =============================================================================
// TYPES
// =============================================================================

interface AbsencesPageProps {
  params: Promise<{ id: string }>;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDuration(fromDate: string, toDate: string): number {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

function isUpcoming(toDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(toDate) >= today;
}

function isCurrent(fromDate: string, toDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return from <= today && today <= to;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function DriverAbsencesPage({ params }: AbsencesPageProps) {
  const { id } = await params;

  const [driver, absences] = await Promise.all([
    getDriverById(id),
    getDriverAbsences(id).catch(() => []),
  ]);

  if (!driver) {
    notFound();
  }

  // Sort and categorize absences
  const sortedAbsences = [...absences].sort(
    (a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
  );

  const currentAbsences = sortedAbsences.filter((a) => isCurrent(a.fromDate, a.toDate));
  const upcomingAbsences = sortedAbsences.filter(
    (a) => isUpcoming(a.toDate) && !isCurrent(a.fromDate, a.toDate)
  );
  const pastAbsences = sortedAbsences.filter((a) => !isUpcoming(a.toDate));

  // Calculate total days absent (upcoming + current)
  const totalAbsentDays = [...currentAbsences, ...upcomingAbsences].reduce(
    (sum, a) => sum + getDuration(a.fromDate, a.toDate),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/drivers/${id}`}>
            <Button variant="ghost" size="sm">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurueck
            </Button>
          </Link>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Abwesenheiten
            </h1>
            <p className="text-sm text-gray-500">
              {driver.firstName} {driver.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`p-4 ${currentAbsences.length > 0 ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10' : ''}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">Aktuell abwesend</p>
          <p className={`text-2xl font-bold ${currentAbsences.length > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
            {currentAbsences.length > 0 ? 'Ja' : 'Nein'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Geplante Abwesenheiten</p>
          <p className="text-2xl font-bold text-orange-600">{upcomingAbsences.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Tage geplant</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAbsentDays}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Vergangene</p>
          <p className="text-2xl font-bold text-gray-500">{pastAbsences.length}</p>
        </Card>
      </div>

      {/* Current Absences */}
      {currentAbsences.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <CardTitle className="text-red-700 dark:text-red-400">Aktuell abwesend</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {currentAbsences.map((absence) => (
              <AbsenceCard key={absence.id} absence={absence} variant="current" />
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Absences */}
      <Card>
        <CardHeader>
          <CardTitle>Geplante Abwesenheiten</CardTitle>
          <Badge variant="warning">{upcomingAbsences.length}</Badge>
        </CardHeader>
        {upcomingAbsences.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">Keine geplanten Abwesenheiten</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAbsences.map((absence) => (
              <AbsenceCard key={absence.id} absence={absence} variant="upcoming" />
            ))}
          </div>
        )}
      </Card>

      {/* Past Absences */}
      {pastAbsences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vergangene Abwesenheiten</CardTitle>
            <Badge variant="default">{pastAbsences.length}</Badge>
          </CardHeader>
          <div className="space-y-3 opacity-60">
            {pastAbsences.slice(0, 10).map((absence) => (
              <AbsenceCard key={absence.id} absence={absence} variant="past" />
            ))}
            {pastAbsences.length > 10 && (
              <p className="text-sm text-gray-500 text-center py-2">
                + {pastAbsences.length - 10} weitere vergangene Abwesenheiten
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
              Hinweis zu Abwesenheiten
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Abwesenheiten werden vom Fahrer selbst eingetragen. Bei Abwesenheiten
              wird der Fahrer bei der Fahrtzuweisung automatisch als &quot;nicht verfuegbar&quot;
              angezeigt. Bitte planen Sie entsprechend.
            </p>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Link href={`/drivers/${id}/availability`}>
          <Button variant="secondary">
            Verfuegbarkeit anzeigen
          </Button>
        </Link>
        <Link href={`/drivers/${id}`}>
          <Button variant="ghost">
            Zur Fahrer-Uebersicht
          </Button>
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// ABSENCE CARD COMPONENT
// =============================================================================

interface AbsenceCardProps {
  absence: {
    id: string;
    fromDate: string;
    toDate: string;
    reason: string | null;
  };
  variant: 'current' | 'upcoming' | 'past';
}

function AbsenceCard({ absence, variant }: AbsenceCardProps) {
  const duration = getDuration(absence.fromDate, absence.toDate);
  const isSingleDay = absence.fromDate === absence.toDate;

  const variantStyles = {
    current: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    upcoming: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    past: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  };

  return (
    <div className={`p-4 rounded-lg border ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium text-gray-900 dark:text-white">
              {isSingleDay ? (
                formatDate(absence.fromDate)
              ) : (
                <>
                  {formatDate(absence.fromDate)} - {formatDate(absence.toDate)}
                </>
              )}
            </span>
          </div>
          {absence.reason && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Grund: {absence.reason}
            </p>
          )}
        </div>
        <Badge variant={variant === 'current' ? 'danger' : variant === 'upcoming' ? 'warning' : 'default'}>
          {duration} {duration === 1 ? 'Tag' : 'Tage'}
        </Badge>
      </div>
    </div>
  );
}
