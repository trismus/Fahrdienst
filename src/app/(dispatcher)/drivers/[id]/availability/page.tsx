import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle } from '@/components/ui';
import { getDriverById, getDriverAvailabilityBlocks } from '@/lib/actions/drivers-v2';

// =============================================================================
// TYPES
// =============================================================================

interface AvailabilityPageProps {
  params: Promise<{ id: string }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const WEEKDAYS: { key: string; label: string }[] = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
];

const TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: '08:00 - 10:00' },
  { start: '10:00', end: '12:00', label: '10:00 - 12:00' },
  { start: '12:00', end: '14:00', label: '12:00 - 14:00' },
  { start: '14:00', end: '16:00', label: '14:00 - 16:00' },
  { start: '16:00', end: '18:00', label: '16:00 - 18:00' },
];

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function DriverAvailabilityPage({ params }: AvailabilityPageProps) {
  const { id } = await params;

  const [driver, blocks] = await Promise.all([
    getDriverById(id),
    getDriverAvailabilityBlocks(id).catch(() => []),
  ]);

  if (!driver) {
    notFound();
  }

  // Create a map for quick lookup
  const availabilityMap = new Map<string, boolean>();
  for (const block of blocks) {
    const key = `${block.weekday}-${block.startTime}`;
    availabilityMap.set(key, true);
  }

  const isSlotActive = (weekday: string, startTime: string) => {
    return availabilityMap.has(`${weekday}-${startTime}`);
  };

  // Count available blocks
  const totalAvailableBlocks = blocks.length;
  const totalPossibleBlocks = WEEKDAYS.length * TIME_SLOTS.length;

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
              Verfuegbarkeit
            </h1>
            <p className="text-sm text-gray-500">
              {driver.firstName} {driver.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Verfuegbare Bloecke</p>
          <p className="text-2xl font-bold text-green-600">{totalAvailableBlocks}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Moegliche Bloecke</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPossibleBlocks}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Auslastung</p>
          <p className="text-2xl font-bold text-blue-600">
            {totalPossibleBlocks > 0
              ? Math.round((totalAvailableBlocks / totalPossibleBlocks) * 100)
              : 0}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Stunden/Woche</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalAvailableBlocks * 2}h
          </p>
        </Card>
      </div>

      {/* Availability Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Woechentliche Verfuegbarkeit</CardTitle>
          <span className="text-sm text-gray-500 dark:text-gray-400">Nur-Lesen Ansicht</span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-500"></th>
                {TIME_SLOTS.map((slot) => (
                  <th key={slot.start} className="p-3 text-center text-xs font-medium text-gray-500">
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((day) => (
                <tr key={day.key} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-3 text-sm font-medium text-gray-900 dark:text-white">
                    {day.label}
                  </td>
                  {TIME_SLOTS.map((slot) => {
                    const active = isSlotActive(day.key, slot.start);
                    return (
                      <td key={`${day.key}-${slot.start}`} className="p-2">
                        <div
                          className={`
                            w-full h-12 rounded-lg flex items-center justify-center
                            ${active
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }
                          `}
                          title={`${day.label} ${slot.label}: ${active ? 'Verfuegbar' : 'Nicht verfuegbar'}`}
                        >
                          {active && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Verfuegbar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></div>
            <span>Nicht verfuegbar</span>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
              Hinweis zur Verfuegbarkeit
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Die Verfuegbarkeit wird vom Fahrer selbst gepflegt. Als Dispatcher koennen Sie
              die Verfuegbarkeit hier einsehen, aber nicht bearbeiten. Bei Fragen wenden
              Sie sich bitte direkt an den Fahrer.
            </p>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Link href={`/drivers/${id}/absences`}>
          <Button variant="secondary">
            Abwesenheiten anzeigen
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
