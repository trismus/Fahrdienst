import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DriverForm } from '@/components/forms';
import { DriverDeactivateButton } from '@/components/drivers';
import { getDriverById, getDriverAvailabilityBlocks, getDriverAbsences } from '@/lib/actions/drivers-v2';
import { Button, Badge, Card, CardHeader, CardTitle } from '@/components/ui';

interface DriverDetailPageProps {
  params: Promise<{ id: string }>;
}

const WEEKDAY_LABELS: Record<string, string> = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
};

export default async function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { id } = await params;

  const [driver, availabilityBlocks, absences] = await Promise.all([
    getDriverById(id),
    getDriverAvailabilityBlocks(id).catch(() => []),
    getDriverAbsences(id).catch(() => []),
  ]);

  if (!driver) {
    notFound();
  }

  // Filter upcoming absences
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAbsences = absences.filter(
    (a) => new Date(a.toDate) >= today
  );

  // Check if currently absent
  const isCurrentlyAbsent = absences.some((a) => {
    const from = new Date(a.fromDate);
    const to = new Date(a.toDate);
    return from <= today && today <= to;
  });

  return (
    <div className="space-y-6">
      {/* Header with back button and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/drivers">
            <Button variant="ghost" size="sm">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurueck zur Liste
            </Button>
          </Link>
          {!driver.isActive && (
            <Badge variant="danger">Deaktiviert</Badge>
          )}
          {isCurrentlyAbsent && driver.isActive && (
            <Badge variant="warning">Aktuell abwesend</Badge>
          )}
        </div>
        <DriverDeactivateButton driverId={driver.id} isActive={driver.isActive} />
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <DriverForm driver={driver} />
      </div>

      {/* Availability and Absences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Availability Blocks */}
        <Card>
          <CardHeader>
            <CardTitle>Verfuegbarkeit</CardTitle>
            <Link href={`/drivers/${id}/availability`}>
              <Button variant="ghost" size="sm">
                Vollstaendige Ansicht
              </Button>
            </Link>
          </CardHeader>
          <div className="p-4">
            {availabilityBlocks.length === 0 ? (
              <div className="text-center py-4">
                <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500">Keine Verfuegbarkeit definiert</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {availabilityBlocks.slice(0, 5).map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    >
                      <span className="font-medium text-green-800 dark:text-green-300">
                        {WEEKDAY_LABELS[block.weekday]}
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        {block.startTime} - {block.endTime}
                      </span>
                    </div>
                  ))}
                </div>
                {availabilityBlocks.length > 5 && (
                  <Link
                    href={`/drivers/${id}/availability`}
                    className="block text-center text-sm text-blue-600 hover:underline mt-3"
                  >
                    +{availabilityBlocks.length - 5} weitere anzeigen
                  </Link>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Stunden/Woche</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {availabilityBlocks.length * 2}h
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Absences */}
        <Card>
          <CardHeader>
            <CardTitle>Abwesenheiten</CardTitle>
            <Link href={`/drivers/${id}/absences`}>
              <Button variant="ghost" size="sm">
                Vollstaendige Ansicht
              </Button>
            </Link>
          </CardHeader>
          <div className="p-4">
            {upcomingAbsences.length === 0 ? (
              <div className="text-center py-4">
                <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Keine anstehenden Abwesenheiten</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingAbsences.slice(0, 5).map((absence) => {
                  const isCurrent = new Date(absence.fromDate) <= today && today <= new Date(absence.toDate);
                  return (
                    <div
                      key={absence.id}
                      className={`p-3 rounded-lg ${
                        isCurrent
                          ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                          : 'bg-orange-50 dark:bg-orange-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          isCurrent
                            ? 'text-red-800 dark:text-red-300'
                            : 'text-orange-800 dark:text-orange-300'
                        }`}>
                          {new Date(absence.fromDate).toLocaleDateString('de-CH')}
                          {absence.fromDate !== absence.toDate && (
                            <> - {new Date(absence.toDate).toLocaleDateString('de-CH')}</>
                          )}
                        </span>
                        {isCurrent && (
                          <Badge variant="danger">Aktuell</Badge>
                        )}
                      </div>
                      {absence.reason && (
                        <p className={`text-sm mt-1 ${
                          isCurrent
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {absence.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
                {upcomingAbsences.length > 5 && (
                  <Link
                    href={`/drivers/${id}/absences`}
                    className="block text-center text-sm text-blue-600 hover:underline mt-3"
                  >
                    +{upcomingAbsences.length - 5} weitere anzeigen
                  </Link>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
