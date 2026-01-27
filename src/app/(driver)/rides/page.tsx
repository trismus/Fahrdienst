import { redirect } from 'next/navigation';
import { RideList } from '@/components/rides';
import { Button } from '@/components/ui';
import { getRidesForDriver } from '@/lib/actions/rides';
import { createClient } from '@/lib/supabase/server';

export default async function DriverRidesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Get driver by user_id
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, name')
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

  const rides = await getRidesForDriver(driver.id);

  // Split into categories
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pendingRides = rides.filter((r) => r.status === 'planned');
  const todaysRides = rides.filter((r) => {
    const pickupDate = new Date(r.pickup_time);
    return pickupDate >= today && pickupDate < tomorrow && r.status !== 'completed' && r.status !== 'cancelled';
  });
  const upcomingRides = rides.filter((r) => {
    const pickupDate = new Date(r.pickup_time);
    return pickupDate >= tomorrow && r.status !== 'completed' && r.status !== 'cancelled';
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meine Fahrten</h1>

      {/* Pending confirmation */}
      {pendingRides.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-orange-600">
            Ausstehende Bestätigungen ({pendingRides.length})
          </h2>
          <RideList rides={pendingRides} linkPrefix="/rides" />
        </div>
      )}

      {/* Today */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Heute ({todaysRides.length})</h2>
        <RideList
          rides={todaysRides}
          emptyMessage="Keine Fahrten für heute"
          linkPrefix="/rides"
        />
      </div>

      {/* Upcoming */}
      {upcomingRides.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Kommende Fahrten</h2>
          <RideList rides={upcomingRides} linkPrefix="/rides" />
        </div>
      )}
    </div>
  );
}
