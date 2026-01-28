import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { RideDetailCard } from '@/components/rides';
import { Button } from '@/components/ui';
import { getRide } from '@/lib/actions/rides';
import { createClient } from '@/lib/supabase/server';

interface DriverRideDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DriverRideDetailPage({ params }: DriverRideDetailPageProps) {
  const { id } = await params;

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
    redirect('/');
  }

  const ride = await getRide(id);

  if (!ride) {
    notFound();
  }

  // Verify this ride belongs to the driver
  if (ride.driver_id !== driver.id) {
    notFound();
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/my-rides">
          <Button variant="ghost" size="sm">
            ← Zurück zur Übersicht
          </Button>
        </Link>
      </div>

      <RideDetailCard ride={ride} showActions isDriver />
    </div>
  );
}
