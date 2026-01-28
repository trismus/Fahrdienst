import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { LiveActivityPanel, DashboardAutoRefresh } from '@/components/dashboard';
import { getRides, getRideStats, type RideWithRelations } from '@/lib/actions/rides-v2';
import { getDriverAvailabilityStats, getDrivers } from '@/lib/actions/drivers-v2';
import { ActiveRidesIndicator } from './active-rides-indicator';

// =============================================================================
// QUICK STATS BAR
// Priorität 1 info: Nicht zugewiesen, Aktiv, Verfügbar — eine Zeile, kein Card
// =============================================================================

function QuickStatsBar({
  unassignedCount,
  inProgressCount,
  availableDrivers,
  totalDrivers,
}: {
  unassignedCount: number;
  inProgressCount: number;
  availableDrivers: number;
  totalDrivers: number;
}) {
  return (
    <div className="flex items-center gap-6">
      {/* Nicht zugewiesen — prominent wenn >0 */}
      <Link
        href="/rides?driver=unassigned"
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
          unassignedCount > 0
            ? 'bg-warning-light text-warning-dark hover:bg-orange-100'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
      >
        <span className="text-lg tabular-nums">{unassignedCount}</span>
        <span>Nicht zugewiesen</span>
      </Link>

      {/* Aktiv — Inline LIVE-Indikator */}
      <ActiveRidesIndicator initialCount={inProgressCount} />

      {/* Fahrer verfügbar */}
      <Link
        href="/drivers"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors"
      >
        <span className="text-lg tabular-nums">{availableDrivers}<span className="text-sm font-normal text-neutral-400">/{totalDrivers}</span></span>
        <span>Fahrer</span>
      </Link>
    </div>
  );
}

// =============================================================================
// AKTION-ZONE: Nicht zugewiesene Fahrten mit direktem Zuweisungs-Link
// Das Herzstück des Dashboards — Priorität 1 Aktion
// =============================================================================

function AktionZone({ rides }: { rides: RideWithRelations[] }) {
  if (rides.length === 0) {
    return (
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-8 h-8 rounded-full bg-success-light flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-success-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Alle Fahrten zugewiesen</p>
          <p className="text-xs text-neutral-500">Keine offenen Zuweisungen</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {rides.slice(0, 6).map((ride, index) => (
        <div
          key={ride.id}
          className={`flex items-center justify-between px-5 py-3 ${
            index < rides.length - 1 && index < 5 ? 'border-b border-neutral-100' : ''
          }`}
        >
          <Link href={`/rides/${ride.id}`} className="flex items-center gap-4 flex-1 group">
            {/* Uhrzeit */}
            <span className="text-sm font-bold text-accent-500 tabular-nums min-w-[48px]">
              {new Date(ride.pickupTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {/* Patient + Ziel */}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-neutral-900 group-hover:text-accent-600 transition-colors">
                {ride.patient.firstName} {ride.patient.lastName}
              </span>
              <span className="text-neutral-400 mx-2">→</span>
              <span className="text-sm text-neutral-500">
                {ride.destination.name}
              </span>
            </div>
          </Link>
          {/* Zuweisen-Aktion */}
          <Link
            href={`/rides/${ride.id}`}
            className="flex-shrink-0 px-3 py-1.5 rounded-md bg-accent-50 text-accent-600 text-xs font-semibold hover:bg-accent-100 hover:text-accent-700 transition-colors"
            aria-label={`Fahrt für ${ride.patient.firstName} ${ride.patient.lastName} zuweisen`}
          >
            Zuweisen
          </Link>
        </div>
      ))}
      {rides.length > 6 && (
        <div className="px-5 pt-2 pb-3">
          <Link
            href="/rides?driver=unassigned"
            className="text-xs font-semibold text-warning-dark hover:underline"
          >
            Noch {rides.length - 6} weitere anzeigen
          </Link>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// AKTIVE FAHRTEN SECTION: in_progress Fahrten mit Substatus
// Priorität 2 — Feld-Monitoring
// =============================================================================

function AktiverFahrtCard({ ride }: { ride: RideWithRelations }) {
  const substatusLabel: Record<string, string> = {
    waiting: 'Wartend',
    en_route_pickup: 'Zur Abholung',
    at_pickup: 'Bei Patient',
    en_route_destination: 'Zum Ziel',
    at_destination: 'Am Ziel',
    completed: 'Fertig',
  };

  const substatusColor: Record<string, string> = {
    waiting: 'bg-neutral-100 text-neutral-600',
    en_route_pickup: 'bg-accent-50 text-accent-600',
    at_pickup: 'bg-warning-light text-warning-dark',
    en_route_destination: 'bg-accent-50 text-accent-600',
    at_destination: 'bg-success-light text-success-dark',
    completed: 'bg-success-light text-success-dark',
  };

  const substatus = ride.substatus || 'waiting';

  return (
    <Link
      href={`/rides/${ride.id}`}
      className="flex items-center gap-4 px-5 py-3 hover:bg-neutral-50 transition-colors group"
    >
      {/* Status-Dot */}
      <div className="w-2 h-2 rounded-full bg-warning-DEFAULT animate-pulse flex-shrink-0" />
      {/* Substatus Badge */}
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full min-w-[80px] text-center flex-shrink-0 ${substatusColor[substatus] || 'bg-neutral-100 text-neutral-600'}`}>
        {substatusLabel[substatus] || substatus}
      </span>
      {/* Patient */}
      <span className="text-sm font-semibold text-neutral-900 group-hover:text-accent-600 transition-colors truncate">
        {ride.patient.firstName} {ride.patient.lastName}
      </span>
      <span className="text-neutral-300">→</span>
      {/* Ziel */}
      <span className="text-sm text-neutral-500 truncate flex-1">
        {ride.destination.name}
      </span>
      {/* Fahrer */}
      {ride.driver && (
        <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full flex-shrink-0">
          {ride.driver.firstName} {ride.driver.lastName}
        </span>
      )}
    </Link>
  );
}

// =============================================================================
// ZEITSTRAHL HEUTE: Visuelle Tages-Übersicht
// Kompakt, eine Zeile, scan in < 2 Sekunden
// =============================================================================

function ZeitstrahlHeute({ rides }: { rides: RideWithRelations[] }) {
  // Zeitfenster: 08:00 - 18:00, 1-Stunden-Raster
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8..18

  // Gruppiere Fahrten nach Stunde
  const ridesByHour: Record<number, RideWithRelations[]> = {};
  rides.forEach((ride) => {
    const hour = new Date(ride.pickupTime).getHours();
    if (hour >= 8 && hour <= 18) {
      if (!ridesByHour[hour]) ridesByHour[hour] = [];
      ridesByHour[hour].push(ride);
    }
  });

  // Aktuelle Stunde
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutePercent = (now.getMinutes() / 60) * 100;

  return (
    <div className="px-5 py-4">
      <div className="relative">
        {/* Stunden-Labels */}
        <div className="flex justify-between mb-2">
          {hours.map((hour) => (
            <span key={hour} className={`text-xs tabular-nums flex-1 text-center ${hour === currentHour ? 'text-accent-600 font-semibold' : 'text-neutral-400'}`}>
              {hour.toString().padStart(2, '0')}
            </span>
          ))}
        </div>
        {/* Zeitachse mit Punkten */}
        <div className="relative h-8 border-b border-neutral-200">
          <div className="flex justify-between h-full">
            {hours.map((hour) => {
              const hourRides = ridesByHour[hour] || [];

              return (
                <div key={hour} className="flex-1 flex flex-col items-center justify-end pb-1 gap-0.5">
                  {hourRides.map((ride) => {
                    // Farbecodierung: Aktiv = Orange, Nicht zugewiesen = Gelb, Rest = Blau
                    const dotColor =
                      ride.status === 'in_progress'
                        ? 'bg-warning-DEFAULT'
                        : ride.status === 'cancelled'
                        ? 'bg-error-light'
                        : ride.status === 'completed'
                        ? 'bg-success-DEFAULT'
                        : !ride.driverId
                        ? 'bg-accent-300'
                        : 'bg-accent-500';

                    return (
                      <Link
                        key={ride.id}
                        href={`/rides/${ride.id}`}
                        className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-150 ${dotColor}`}
                        title={`${new Date(ride.pickupTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} — ${ride.patient.firstName} ${ride.patient.lastName}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          {/* Aktuelle Zeit - Linie */}
          {currentHour >= 8 && currentHour <= 18 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-accent-400"
              style={{ left: `${((currentHour - 8 + currentMinutePercent / 100) / 10) * 100}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-accent-400 -ml-0.75 -mt-1" />
            </div>
          )}
        </div>
        {/* Legende */}
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-warning-DEFAULT" />
            Aktiv
          </span>
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-accent-300" />
            Nicht zugewiesen
          </span>
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-accent-500" />
            Zugewiesen
          </span>
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-success-DEFAULT" />
            Fertig
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// WOCHENBALKEN: Kompakte Wochenübersicht
// Klickbar auf volle CalendarView
// =============================================================================

function WochenbalkenCompact({ rides }: { rides: RideWithRelations[] }) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const isToday = day.toDateString() === today.toDateString();
          const dayStr = day.toISOString().split('T')[0];
          const dayRides = rides.filter((r) => r.pickupTime.startsWith(dayStr));
          const activeCount = dayRides.filter((r) => r.status === 'in_progress').length;
          const unassignedCount = dayRides.filter((r) => !r.driverId && r.status !== 'cancelled' && r.status !== 'completed').length;

          return (
            <Link
              key={i}
              href={`/rides`}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isToday ? 'bg-accent-50' : 'hover:bg-neutral-50'
              }`}
            >
              <span className={`text-xs ${isToday ? 'text-accent-600 font-semibold' : 'text-neutral-500'}`}>
                {dayLabels[i]}
              </span>
              <span className={`text-lg font-bold tabular-nums ${isToday ? 'text-accent-600' : 'text-neutral-700'}`}>
                {dayRides.length}
              </span>
              {/* Mini Status-Dots */}
              <div className="flex gap-0.5 h-1.5">
                {activeCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-warning-DEFAULT" />}
                {unassignedCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent-300" />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// FAHRER HEUTE: Kompichte Fahrer-Status-Liste
// =============================================================================

interface DriverTodayInfo {
  id: string;
  firstName: string;
  lastName: string;
  status: 'available' | 'in_use' | 'absent';
  rideCount: number;
}

function FahrerHeuteList({ drivers }: { drivers: DriverTodayInfo[] }) {
  if (drivers.length === 0) {
    return (
      <div className="px-5 py-6 text-center">
        <p className="text-sm text-neutral-500">Keine Fahrer konfiguriert</p>
      </div>
    );
  }

  return (
    <div>
      {drivers.slice(0, 5).map((driver, index) => (
        <Link
          key={driver.id}
          href={`/drivers/${driver.id}`}
          className={`flex items-center gap-3 px-5 py-2.5 hover:bg-neutral-50 transition-colors ${
            index < drivers.length - 1 && index < 4 ? 'border-b border-neutral-50' : ''
          }`}
        >
          {/* Status Dot */}
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            driver.status === 'available' ? 'bg-success-DEFAULT' :
            driver.status === 'in_use' ? 'bg-warning-DEFAULT' :
            'bg-neutral-300'
          }`} />
          {/* Name */}
          <span className="text-sm font-medium text-neutral-800 flex-1">
            {driver.firstName} {driver.lastName}
          </span>
          {/* Status-Label */}
          <span className={`text-xs ${
            driver.status === 'available' ? 'text-success-dark' :
            driver.status === 'in_use' ? 'text-warning-dark' :
            'text-neutral-400'
          }`}>
            {driver.status === 'available' ? 'Verfügbar' :
             driver.status === 'in_use' ? `${driver.rideCount} Fahrt${driver.rideCount > 1 ? 'en' : ''}` :
             'Abwesend'}
          </span>
        </Link>
      ))}
      {drivers.length > 5 && (
        <div className="px-5 pt-1.5 pb-2">
          <Link href="/drivers" className="text-xs font-semibold text-neutral-500 hover:text-accent-600 transition-colors">
            Alle {drivers.length} Fahrer →
          </Link>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function DashboardPage() {
  const today = new Date();

  // Wochenbereich für CalendarView-Daten
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Parallel fetching
  const [weekRides, todayStats, driverStats, allDrivers] = await Promise.all([
    getRides({
      fromDate: startOfWeek.toISOString(),
      toDate: endOfWeek.toISOString(),
    }),
    getRideStats(),
    getDriverAvailabilityStats(),
    getDrivers(),
  ]);

  // Heutige Fahrten filtern
  const todayStr = today.toISOString().split('T')[0];
  const todaysRides = weekRides.filter((ride) => ride.pickupTime.startsWith(todayStr));

  // Nicht zugewiesene Fahrten (die eine Aktion brauchen)
  const unassignedRides = todaysRides
    .filter((ride) => !ride.driverId && ride.status !== 'cancelled' && ride.status !== 'completed')
    .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime());

  // Aktive Fahrten (in_progress)
  const activeRides = todaysRides
    .filter((ride) => ride.status === 'in_progress')
    .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime());

  // Fahrer-Status für heute zusammenstellen
  const todaysRidesForDrivers = weekRides.filter((r) => r.pickupTime.startsWith(todayStr) && r.driverId && r.status !== 'cancelled');
  const driverRideCounts: Record<string, number> = {};
  todaysRidesForDrivers.forEach((r) => {
    if (r.driverId) {
      driverRideCounts[r.driverId] = (driverRideCounts[r.driverId] || 0) + 1;
    }
  });

  // Abwesende Fahrer-IDs aus den Rides ableiten (vereinfacht — hat keine direkte Absent-Info hier)
  // Wir nutzen driverStats.absentToday als Zahl, aber für die Liste verwenden wir den Availability-Check
  const driverTodayInfo: DriverTodayInfo[] = allDrivers.map((driver) => {
    const hasRides = driverRideCounts[driver.id] && driverRideCounts[driver.id] > 0;
    // Vereinfacht: Fahrer mit Fahrten heute = in_use, Fahrer ohne = available
    // (Abwesende werden durch getDriverAvailabilityStats gezählt, aber hier ohne direkte Absent-Prüfung)
    return {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      status: hasRides ? 'in_use' : 'available',
      rideCount: driverRideCounts[driver.id] || 0,
    };
  });

  // Sortierung: In Einsatz zuerst, dann Verfügbar, dann Abwesend
  driverTodayInfo.sort((a, b) => {
    const order = { in_use: 0, available: 1, absent: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <DashboardAutoRefresh>
      <div className="space-y-6 pb-8">
        {/* ================================================================
            HEADER: Datum + Quick Stats + CTA
            Sticky, kompakt, eine Zeile
            ================================================================ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                {today.toLocaleDateString('de-CH', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            {/* Quick Stats — inline, kein Card */}
            <QuickStatsBar
              unassignedCount={unassignedRides.length}
              inProgressCount={todayStats.inProgress}
              availableDrivers={driverStats.availableToday}
              totalDrivers={driverStats.totalActive}
            />
          </div>
          <Link href="/rides/new">
            <Button size="md">Neue Fahrt</Button>
          </Link>
        </div>

        {/* ================================================================
            HAUPTGRID: 2-Spalten Layout
            Spalte A (~58%): Aktionsrelevant — Zuweisung + Monitoring
            Spalte B (~42%): Kontext — Woche + Fahrer + Live
            ================================================================ */}
        <div className="grid grid-cols-12 gap-6">

          {/* ============================================================
              SPALTE A — Aktionsrelevant
              ============================================================ */}
          <div className="col-span-7 space-y-4">

            {/* --- AKTION-ZONE: Nicht zugewiesene Fahrten --- */}
            <Card padding="none">
              <div className="px-5 py-3 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Braucht Zuweisung
                  </h2>
                  {unassignedRides.length > 0 && (
                    <span className="text-xs font-semibold text-warning-dark bg-warning-light px-2 py-0.5 rounded-full">
                      {unassignedRides.length}
                    </span>
                  )}
                </div>
              </div>
              <AktionZone rides={unassignedRides} />
            </Card>

            {/* --- AKTIVE FAHRTEN: in_progress Monitoring --- */}
            {activeRides.length > 0 && (
              <Card padding="none">
                <div className="px-5 py-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning-DEFAULT animate-pulse" />
                    <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                      Aktuell Unterwegs
                    </h2>
                    <span className="text-xs font-semibold text-warning-dark bg-warning-light px-2 py-0.5 rounded-full ml-auto">
                      {activeRides.length}
                    </span>
                  </div>
                </div>
                <div>
                  {activeRides.map((ride, index) => (
                    <div key={ride.id} className={index < activeRides.length - 1 ? 'border-b border-neutral-50' : ''}>
                      <AktiverFahrtCard ride={ride} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* --- ZEITSTRAHL HEUTE --- */}
            <Card padding="none">
              <div className="px-5 py-3 border-b border-neutral-100">
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  Zeitstrahl Heute
                </h2>
              </div>
              <ZeitstrahlHeute rides={todaysRides} />
            </Card>
          </div>

          {/* ============================================================
              SPALTE B — Kontext
              ============================================================ */}
          <div className="col-span-5 space-y-4">

            {/* --- WOCHENBALKEN (kompakt) --- */}
            <Card padding="none">
              <div className="px-5 py-3 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Diese Woche
                  </h2>
                  <Link href="/rides" className="text-xs text-accent-600 hover:text-accent-700 font-semibold transition-colors">
                    Kalender →
                  </Link>
                </div>
              </div>
              <WochenbalkenCompact rides={weekRides} />
            </Card>

            {/* --- FAHRER HEUTE --- */}
            <Card padding="none">
              <div className="px-5 py-3 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Fahrer Heute
                  </h2>
                  {driverStats.absentToday > 0 && (
                    <span className="text-xs text-warning-dark">
                      {driverStats.absentToday} abwesend
                    </span>
                  )}
                </div>
              </div>
              <FahrerHeuteList drivers={driverTodayInfo} />
            </Card>

            {/* --- LIVE AKTIVITÄT --- */}
            <LiveActivityPanel />
          </div>
        </div>
      </div>
    </DashboardAutoRefresh>
  );
}
