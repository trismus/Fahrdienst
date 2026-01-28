import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { getDriverById, getDriverAbsences } from '@/lib/actions/drivers-v2';
import { DriverAbsenceList } from '@/components/availability/driver-absence-list';

// =============================================================================
// TYPES
// =============================================================================

interface AbsencesPageProps {
  params: Promise<{ id: string }>;
}

// =============================================================================
// HELPERS
// =============================================================================

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

      {/* Absences List - Editable */}
      <DriverAbsenceList driverId={id} absences={absences} />

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
