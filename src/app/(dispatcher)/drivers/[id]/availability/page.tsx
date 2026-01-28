import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { getDriverById, getDriverAvailabilityBlocks } from '@/lib/actions/drivers-v2';
import { DriverAvailabilityGrid } from '@/components/availability/driver-availability-grid';

// =============================================================================
// TYPES
// =============================================================================

interface AvailabilityPageProps {
  params: Promise<{ id: string }>;
}

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

  // Count available blocks
  const totalAvailableBlocks = blocks.length;
  const totalPossibleBlocks = 25; // 5 days * 5 time slots

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

      {/* Availability Grid - Editable */}
      <DriverAvailabilityGrid driverId={id} blocks={blocks} />

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
