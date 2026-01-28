import { RideFormV2 } from '@/components/forms/ride-form-v2';
import { getPatients } from '@/lib/actions/patients-v2';
import { getDestinations } from '@/lib/actions/destinations-v2';

export default async function NewRidePage() {
  let patients: Awaited<ReturnType<typeof getPatients>> = [];
  let destinations: Awaited<ReturnType<typeof getDestinations>> = [];
  let loadError: string | null = null;

  try {
    patients = await getPatients();
  } catch (err) {
    loadError = `Patienten: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    destinations = await getDestinations();
  } catch (err) {
    const destErr = `Ziele: ${err instanceof Error ? err.message : String(err)}`;
    loadError = loadError ? `${loadError} | ${destErr}` : destErr;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Neue Fahrt erstellen
      </h1>
      {loadError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">Fehler beim Laden:</p>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1 font-mono break-all">{loadError}</p>
        </div>
      )}
      <RideFormV2
        patients={patients}
        destinations={destinations}
        mode="create"
      />
    </div>
  );
}
