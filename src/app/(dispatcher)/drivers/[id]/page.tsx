import { notFound } from 'next/navigation';
import { DriverForm } from '@/components/forms';
import { AvailabilityGrid, AbsenceList } from '@/components/availability';
import { getDriverWithAvailability } from '@/lib/actions/drivers';

interface DriverDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { id } = await params;
  const driver = await getDriverWithAvailability(id);

  if (!driver) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <DriverForm driver={driver} />
      </div>

      <AvailabilityGrid
        driverId={driver.id}
        blocks={driver.availability_blocks}
        readonly
      />

      <AbsenceList
        driverId={driver.id}
        absences={driver.absences}
        readonly
      />
    </div>
  );
}
