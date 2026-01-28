import Link from 'next/link';
import { Button, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { getDrivers } from '@/lib/actions/drivers-v2';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: 'PKW',
  van: 'Van',
  accessible_van: 'Rollstuhltransporter',
};

export default async function DriversPage() {
  const drivers = await getDrivers();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fahrer</h1>
        <Link href="/drivers/new">
          <Button>Neuer Fahrer</Button>
        </Link>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Fahrzeug</TableHead>
              <TableHead>Kennzeichen</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Keine Fahrer vorhanden
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="text-gray-500 text-sm font-mono">
                    {driver.driverCode || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {driver.lastName}, {driver.firstName}
                  </TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      driver.vehicleType === 'accessible_van'
                        ? 'bg-blue-100 text-blue-800'
                        : driver.vehicleType === 'van'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {VEHICLE_TYPE_LABELS[driver.vehicleType] || driver.vehicleType}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {driver.vehiclePlate || '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/drivers/${driver.id}`}>
                      <Button variant="ghost" size="sm">
                        Bearbeiten
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
