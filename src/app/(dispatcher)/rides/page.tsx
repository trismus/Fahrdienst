import Link from 'next/link';
import { Button, Card, StatusBadge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { getRides } from '@/lib/actions/rides';

function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function RidesPage() {
  const rides = await getRides();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fahrten</h1>
        <Link href="/rides/new">
          <Button>Neue Fahrt</Button>
        </Link>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Ziel</TableHead>
              <TableHead>Fahrer</TableHead>
              <TableHead>Abholzeit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Keine Fahrten vorhanden
                </TableCell>
              </TableRow>
            ) : (
              rides.map((ride) => (
                <TableRow key={ride.id}>
                  <TableCell className="font-medium">{ride.patient?.name}</TableCell>
                  <TableCell>{ride.destination?.name}</TableCell>
                  <TableCell>{ride.driver?.name || '-'}</TableCell>
                  <TableCell>{formatDateTime(ride.pickup_time)}</TableCell>
                  <TableCell>
                    <StatusBadge status={ride.status} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/rides/${ride.id}`}>
                      <Button variant="ghost" size="sm">
                        Details
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
