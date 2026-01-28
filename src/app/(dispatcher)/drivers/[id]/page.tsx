import { notFound } from 'next/navigation';
import { DriverForm } from '@/components/forms';
import { getDriverById, getDriverAvailabilityBlocks, getDriverAbsences } from '@/lib/actions/drivers-v2';

interface DriverDetailPageProps {
  params: Promise<{ id: string }>;
}

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
      <div className="max-w-2xl">
        <DriverForm driver={driver} />
      </div>

      {/* Availability and Absences will be shown once the tables are created */}
      {availabilityBlocks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-2">Verfügbarkeit</h3>
          <p className="text-sm text-gray-500">{availabilityBlocks.length} Zeitblöcke definiert</p>
        </div>
      )}

      {absences.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-2">Abwesenheiten</h3>
          <p className="text-sm text-gray-500">{absences.length} Abwesenheiten eingetragen</p>
        </div>
      )}
    </div>
  );
}
