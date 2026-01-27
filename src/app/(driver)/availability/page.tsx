import { redirect } from 'next/navigation';
import { AvailabilityGrid, AbsenceList } from '@/components/availability';
import { getDriverWithAvailability } from '@/lib/actions/drivers';
import { createClient } from '@/lib/supabase/server';

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Get driver by user_id
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!driver) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Kein Fahrerprofil gefunden</h1>
        <p className="text-gray-500">
          Bitte kontaktiere einen Administrator, um dein Profil einzurichten.
        </p>
      </div>
    );
  }

  const driverWithAvailability = await getDriverWithAvailability(driver.id);

  if (!driverWithAvailability) {
    return <div>Fahrer nicht gefunden</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meine Verfügbarkeit</h1>

      <AvailabilityGrid
        driverId={driverWithAvailability.id}
        blocks={driverWithAvailability.availability_blocks}
      />

      <AbsenceList
        driverId={driverWithAvailability.id}
        absences={driverWithAvailability.absences}
      />
    </div>
  );
}
