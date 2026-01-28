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

  return (
    <div className="space-y-6">
      {/* Header with back button and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/drivers">
            <Button variant="ghost" size="sm">
              Zurueck zur Liste
            </Button>
          </Link>
          {!driver.isActive && (
            <Badge variant="danger">Deaktiviert</Badge>
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
          </CardHeader>
          <div className="p-4">
            {availabilityBlocks.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Verfuegbarkeit definiert</p>
            ) : (
              <div className="space-y-2">
                {availabilityBlocks.map((block) => (
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
            )}
          </div>
        </Card>

        {/* Absences */}
        <Card>
          <CardHeader>
            <CardTitle>Abwesenheiten</CardTitle>
          </CardHeader>
          <div className="p-4">
            {absences.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Abwesenheiten eingetragen</p>
            ) : (
              <div className="space-y-2">
                {absences.map((absence) => (
                  <div
                    key={absence.id}
                    className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-red-800 dark:text-red-300">
                        {new Date(absence.fromDate).toLocaleDateString('de-CH')}
                        {absence.fromDate !== absence.toDate && (
                          <> - {new Date(absence.toDate).toLocaleDateString('de-CH')}</>
                        )}
                      </span>
                    </div>
                    {absence.reason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {absence.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
