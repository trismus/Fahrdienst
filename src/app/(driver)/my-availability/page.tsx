import { redirect } from 'next/navigation';
import { DriverAvailabilityGrid } from '@/components/availability/driver-availability-grid';
import { DriverAbsenceList } from '@/components/availability/driver-absence-list';
import {
  getDriverByUserId,
  getDriverAvailabilityBlocks,
  getDriverAbsences,
} from '@/lib/actions/drivers-v2';
import { createClient } from '@/lib/supabase/server';

export default async function DriverAvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Get driver profile
  const driver = await getDriverByUserId(user.id);

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
          Kein Fahrerprofil gefunden
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">
          Bitte kontaktiere einen Administrator, um dein Profil einzurichten.
        </p>
      </div>
    );
  }

  // Get availability blocks and absences
  const [availabilityBlocks, absences] = await Promise.all([
    getDriverAvailabilityBlocks(driver.id),
    getDriverAbsences(driver.id),
  ]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pt-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Meine Verfuegbarkeit
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Verwalte deine woechentliche Verfuegbarkeit und plane Abwesenheiten.
        </p>
      </div>

      {/* Availability Grid */}
      <DriverAvailabilityGrid
        driverId={driver.id}
        blocks={availabilityBlocks}
      />

      {/* Absence List */}
      <DriverAbsenceList
        driverId={driver.id}
        absences={absences}
      />
    </div>
  );
}
