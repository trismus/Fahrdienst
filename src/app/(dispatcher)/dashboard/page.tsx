import Link from 'next/link';
import { CalendarView } from '@/components/calendar';
import { Card, CardHeader, CardTitle, Button, StatusBadge } from '@/components/ui';
import { getRides } from '@/lib/actions/rides';

export default async function DashboardPage() {
  const rides = await getRides();

  // Get today's rides
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysRides = rides.filter((ride) => {
    const pickupDate = new Date(ride.pickup_time);
    return pickupDate >= today && pickupDate < tomorrow;
  });

  // Get unassigned rides
  const unassignedRides = rides.filter(
    (ride) => !ride.driver_id && ride.status === 'planned'
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/rides/new">
          <Button>Neue Fahrt</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-500 dark:text-gray-400">Fahrten heute</div>
          <div className="text-3xl font-bold">{todaysRides.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 dark:text-gray-400">Nicht zugewiesen</div>
          <div className="text-3xl font-bold text-orange-600">{unassignedRides.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 dark:text-gray-400">Gesamt diese Woche</div>
          <div className="text-3xl font-bold">{rides.length}</div>
        </Card>
      </div>

      {/* Unassigned rides alert */}
      {unassignedRides.length > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">
              Nicht zugewiesene Fahrten
            </CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {unassignedRides.slice(0, 5).map((ride) => (
              <Link
                key={ride.id}
                href={`/rides/${ride.id}`}
                className="flex items-center justify-between p-2 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30"
              >
                <div>
                  <span className="font-medium">{ride.patient?.name}</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span>{ride.destination?.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(ride.pickup_time).toLocaleDateString('de-CH')}
                </div>
              </Link>
            ))}
            {unassignedRides.length > 5 && (
              <Link href="/rides" className="text-sm text-orange-600 hover:underline">
                Alle {unassignedRides.length} anzeigen
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Calendar */}
      <CalendarView rides={rides} />

      {/* Today's rides list */}
      <Card>
        <CardHeader>
          <CardTitle>Fahrten heute</CardTitle>
        </CardHeader>
        {todaysRides.length === 0 ? (
          <p className="text-gray-500">Keine Fahrten für heute geplant</p>
        ) : (
          <div className="space-y-3">
            {todaysRides.map((ride) => (
              <Link
                key={ride.id}
                href={`/rides/${ride.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="text-lg font-medium">
                    {new Date(ride.pickup_time).toLocaleTimeString('de-CH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div>
                    <div className="font-medium">{ride.patient?.name}</div>
                    <div className="text-sm text-gray-500">
                      {ride.destination?.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {ride.driver ? (
                    <span className="text-sm text-gray-600">{ride.driver.name}</span>
                  ) : (
                    <span className="text-sm text-orange-600">Nicht zugewiesen</span>
                  )}
                  <StatusBadge status={ride.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
