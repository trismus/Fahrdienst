import Link from 'next/link';
import { Card } from '@/components/ui';
import { getPatients } from '@/lib/actions/patients-v2';
import { getDrivers, getDriverAvailabilityStats } from '@/lib/actions/drivers-v2';
import { getRides, getRideStats } from '@/lib/actions/rides-v2';

// =============================================================================
// PAGE
// =============================================================================

export default async function OverviewPage() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Week range (Mon–Sun)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Parallel fetch
  const [patients, drivers, weekRides, todayStats, driverStats] = await Promise.all([
    getPatients(),
    getDrivers(),
    getRides({ fromDate: startOfWeek.toISOString(), toDate: endOfWeek.toISOString() }),
    getRideStats(),
    getDriverAvailabilityStats(),
  ]);

  // Week calendar data
  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const weekDays = dayLabels.map((label, idx) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + idx);
    const dateStr = date.toISOString().split('T')[0];
    const dayRides = weekRides.filter((r) => r.pickupTime.startsWith(dateStr));
    const isToday = dateStr === todayStr;
    return {
      label,
      isToday,
      total: dayRides.length,
      planned: dayRides.filter((r) => r.status === 'planned').length,
      confirmed: dayRides.filter((r) => r.status === 'confirmed').length,
      inProgress: dayRides.filter((r) => r.status === 'in_progress').length,
      completed: dayRides.filter((r) => r.status === 'completed').length,
    };
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Übersicht</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {today.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Card 1: Patienten */}
        <Link href="/patients">
          <Card padding="none" hover className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Patienten</p>
                  <p className="text-4xl font-bold text-neutral-900 mt-1 tabular-nums">{patients.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <span className="w-2 h-2 rounded-full bg-success-DEFAULT" />
                  <span>{patients.length} aktiv</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        {/* Card 2: Fahrer */}
        <Link href="/drivers">
          <Card padding="none" hover className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Fahrer</p>
                  <p className="text-4xl font-bold text-neutral-900 mt-1 tabular-nums">{drivers.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-success-DEFAULT" />
                  <span className="text-neutral-500">{driverStats.availableToday} verfügbar</span>
                </div>
                {driverStats.absentToday > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-neutral-300" />
                    <span className="text-neutral-500">{driverStats.absentToday} abwesend</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Link>

        {/* Card 3: Fahrten */}
        <Link href="/rides">
          <Card padding="none" hover className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Fahrten heute</p>
                  <p className="text-4xl font-bold text-neutral-900 mt-1 tabular-nums">{todayStats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-3 flex-wrap">
                {todayStats.planned > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="w-2 h-2 rounded-full bg-neutral-300" />
                    <span className="text-neutral-500">{todayStats.planned} geplant</span>
                  </div>
                )}
                {todayStats.confirmed > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="w-2 h-2 rounded-full bg-accent-400" />
                    <span className="text-neutral-500">{todayStats.confirmed} bestätigt</span>
                  </div>
                )}
                {todayStats.inProgress > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="w-2 h-2 rounded-full bg-warning-DEFAULT" />
                    <span className="text-neutral-500">{todayStats.inProgress} unterwegs</span>
                  </div>
                )}
                {todayStats.completed > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="w-2 h-2 rounded-full bg-success-DEFAULT" />
                    <span className="text-neutral-500">{todayStats.completed} fertig</span>
                  </div>
                )}
                {todayStats.total === 0 && (
                  <span className="text-sm text-neutral-400">Keine Fahrten heute</span>
                )}
              </div>
            </div>
          </Card>
        </Link>

        {/* Card 4: Woche */}
        <Link href="/rides">
          <Card padding="none" hover className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Diese Woche</p>
                  <p className="text-4xl font-bold text-neutral-900 mt-1 tabular-nums">{weekRides.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Mini week bar */}
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map(({ label, isToday, total, inProgress, completed }) => (
                  <div
                    key={label}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg ${isToday ? 'bg-accent-50' : ''}`}
                  >
                    <span
                      className={`text-xs font-medium ${isToday ? 'text-accent-600' : 'text-neutral-400'}`}
                    >
                      {label}
                    </span>
                    <span
                      className={`text-sm font-bold tabular-nums ${isToday ? 'text-accent-600' : 'text-neutral-700'}`}
                    >
                      {total}
                    </span>
                    {/* Status dots */}
                    <div className="flex gap-0.5 h-1.5">
                      {inProgress > 0 && <span className="w-1.5 h-1.5 rounded-full bg-warning-DEFAULT" />}
                      {completed > 0 && <span className="w-1.5 h-1.5 rounded-full bg-success-DEFAULT" />}
                      {total > 0 && total === (total - inProgress - completed) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
