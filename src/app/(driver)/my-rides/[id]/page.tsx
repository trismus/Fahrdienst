import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { DriverRideDetail } from '@/components/rides';
import { getDriverRide } from '@/lib/actions/rides-driver';
import { getUserProfile } from '@/lib/actions/auth';

interface DriverRideDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DriverRideDetailPage({ params }: DriverRideDetailPageProps) {
  const { id } = await params;

  // Get user profile - this now validates driver access
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'driver') {
    redirect('/dashboard');
  }

  // Get ride with authorization check (driver ID is derived from session in the action)
  const ride = await getDriverRide(id);

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

      {/* Ride Detail Component - driverId is no longer needed as prop */}
      <DriverRideDetail ride={ride} />
    </div>
  );
}
