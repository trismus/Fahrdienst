import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { DriverRideDetail } from '@/components/rides';
import { getDriverRide } from '@/lib/actions/rides-driver';
import { getDriverByUserId } from '@/lib/actions/drivers-v2';
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

  // Get driver profile
  const driver = await getDriverByUserId(user.id);

  if (!driver) {
    redirect('/');
  }

  // Get ride with authorization check
  const ride = await getDriverRide(id, driver.id);

  if (!ride) {
    notFound();
  }

  return (
    <div className="pb-8">
      {/* Back Navigation */}
      <div className="mb-6 pt-4">
        <Link href="/my-rides">
          <Button variant="ghost" size="sm" className="gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurueck zur Uebersicht
          </Button>
        </Link>
      </div>

      {/* Ride Detail Component */}
      <DriverRideDetail ride={ride} driverId={driver.id} />
    </div>
  );
}
