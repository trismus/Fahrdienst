import Link from 'next/link';
import { Button, Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { getDestinations } from '@/lib/actions/destinations-v2';

const TYPE_LABELS: Record<string, string> = {
  hospital: 'Spital',
  doctor: 'Arztpraxis',
  therapy: 'Therapie',
  other: 'Sonstiges',
};

const TYPE_COLORS: Record<string, string> = {
  hospital: 'bg-red-100 text-red-800',
  doctor: 'bg-blue-100 text-blue-800',
  therapy: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
};

interface PageProps {
  searchParams: Promise<{ showInactive?: string }>;
}

export default async function DestinationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const showInactive = params.showInactive === 'true';
  const destinations = await getDestinations(showInactive);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Ziele</h1>
          <span className="text-gray-500 text-sm">
            {destinations.length} {showInactive ? 'gesamt' : 'aktiv'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {showInactive ? (
            <Link href="/destinations">
              <Button variant="secondary" size="sm">
                Nur aktive anzeigen
              </Button>
            </Link>
          ) : (
            <Link href="/destinations?showInactive=true">
              <Button variant="ghost" size="sm">
                Inaktive einblenden
              </Button>
            </Link>
          )}
          <Link href="/destinations/new">
            <Button>Neues Ziel</Button>
          </Link>
        </div>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Oeffnungszeiten</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Keine Ziele vorhanden
                </TableCell>
              </TableRow>
            ) : (
              destinations.map((destination) => (
                <TableRow key={destination.id} className={!destination.isActive ? 'opacity-60' : ''}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{destination.name}</div>
                      {destination.department && (
                        <div className="text-sm text-gray-500">{destination.department}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      TYPE_COLORS[destination.destinationType] || TYPE_COLORS.other
                    }`}>
                      {TYPE_LABELS[destination.destinationType] || destination.destinationType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {destination.street}
                      <br />
                      <span className="text-gray-500">
                        {destination.postalCode} {destination.city}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {destination.openingHours || '-'}
                  </TableCell>
                  <TableCell>
                    {destination.isActive ? (
                      <Badge variant="success">Aktiv</Badge>
                    ) : (
                      <Badge variant="danger">Inaktiv</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/destinations/${destination.id}`}>
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
