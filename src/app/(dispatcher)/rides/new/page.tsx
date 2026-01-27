import { RideForm } from '@/components/forms';
import { getPatients } from '@/lib/actions/patients';
import { getDrivers } from '@/lib/actions/drivers';
import { getDestinations } from '@/lib/actions/destinations';

export default async function NewRidePage() {
  const [patients, drivers, destinations] = await Promise.all([
    getPatients(),
    getDrivers(),
    getDestinations(),
  ]);

  return (
    <div className="max-w-2xl">
      <RideForm
        patients={patients}
        drivers={drivers}
        destinations={destinations}
      />
    </div>
  );
}
