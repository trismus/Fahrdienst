import { RideFormV2 } from '@/components/forms/ride-form-v2';
import { getPatients } from '@/lib/actions/patients-v2';
import { getDestinations } from '@/lib/actions/destinations-v2';

export default async function NewRidePage() {
  const [patients, destinations] = await Promise.all([
    getPatients(),
    getDestinations(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Neue Fahrt erstellen
      </h1>
      <RideFormV2
        patients={patients}
        destinations={destinations}
        mode="create"
      />
    </div>
  );
}
