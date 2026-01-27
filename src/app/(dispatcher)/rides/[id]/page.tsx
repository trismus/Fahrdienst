import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RideForm } from '@/components/forms';
import { RideDetailCard } from '@/components/rides';
import { Button } from '@/components/ui';
import { getRide } from '@/lib/actions/rides';
import { getPatients } from '@/lib/actions/patients';
import { getDrivers } from '@/lib/actions/drivers';
import { getDestinations } from '@/lib/actions/destinations';

interface RideDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function RideDetailPage({ params, searchParams }: RideDetailPageProps) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [ride, patients, drivers, destinations] = await Promise.all([
    getRide(id),
    getPatients(),
    getDrivers(),
    getDestinations(),
  ]);

  if (!ride) {
    notFound();
  }

  const isEditMode = edit === 'true';

  if (isEditMode) {
    return (
      <div>
        <div className="mb-4">
          <Link href={`/rides/${id}`}>
            <Button variant="ghost" size="sm">
              ← Zurück zu Details
            </Button>
          </Link>
        </div>
        <div className="max-w-2xl">
          <RideForm
            ride={ride}
            patients={patients}
            drivers={drivers}
            destinations={destinations}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/rides">
          <Button variant="ghost" size="sm">
            ← Zurück zur Übersicht
          </Button>
        </Link>
        <Link href={`/rides/${id}?edit=true`}>
          <Button variant="secondary">Bearbeiten</Button>
        </Link>
      </div>

      <RideDetailCard ride={ride} showActions showEditLink={false} />
    </div>
  );
}
