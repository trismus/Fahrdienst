import Link from 'next/link';
import { Button, Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { getPatients } from '@/lib/actions/patients-v2';
import { PatientsMap } from '@/components/maps/patients-map';

interface PageProps {
  searchParams: Promise<{ showInactive?: string }>;
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const showInactive = params.showInactive === 'true';
  const patients = await getPatients(showInactive);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Patienten</h1>
          <span className="text-gray-500 text-sm">
            {patients.length} {showInactive ? 'gesamt' : 'aktiv'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {showInactive ? (
            <Link href="/patients">
              <Button variant="secondary" size="sm">
                Nur aktive anzeigen
              </Button>
            </Link>
          ) : (
            <Link href="/patients?showInactive=true">
              <Button variant="ghost" size="sm">
                Inaktive einblenden
              </Button>
            </Link>
          )}
          <Link href="/patients/new">
            <Button>Neuer Patient</Button>
          </Link>
        </div>
      </div>

      {/* Karte: Abholorte */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Abholorte</h2>
              <span className="text-xs text-neutral-400">
                {patients.filter((p) => p.latitude && p.longitude).length} mit Koordinaten
              </span>
            </div>
            <PatientsMap
              patients={patients
                .filter((p) => p.latitude && p.longitude && p.isActive)
                .map((p) => ({
                  id: p.id,
                  name: `${p.firstName} ${p.lastName}`,
                  address: `${p.street}, ${p.postalCode} ${p.city}`,
                  lat: p.latitude!,
                  lng: p.longitude!,
                }))}
              className="h-64"
            />
          </Card>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card padding="none">
            <div className="px-5 py-3 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Zusammenfassung</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Gesamt aktiv</span>
                <span className="text-sm font-bold text-neutral-900">{patients.filter((p) => p.isActive).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Rollstuhl
                </span>
                <span className="text-sm font-bold text-neutral-900">{patients.filter((p) => p.needsWheelchair).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400" /> Rollator
                </span>
                <span className="text-sm font-bold text-neutral-900">{patients.filter((p) => p.needsWalker).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" /> Hilfe nötig
                </span>
                <span className="text-sm font-bold text-neutral-900">{patients.filter((p) => p.needsAssistance).length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nr.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Beduerfnisse</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  Keine Patienten vorhanden
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id} className={!patient.isActive ? 'opacity-60' : ''}>
                  <TableCell className="text-gray-500 text-sm">
                    {patient.patientNumber || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {patient.lastName}, {patient.firstName}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {patient.street}
                      <br />
                      <span className="text-gray-500">
                        {patient.postalCode} {patient.city}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {patient.needsWheelchair && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Rollstuhl
                        </span>
                      )}
                      {patient.needsWalker && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Rollator
                        </span>
                      )}
                      {patient.needsAssistance && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Hilfe
                        </span>
                      )}
                      {!patient.needsWheelchair && !patient.needsWalker && !patient.needsAssistance && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {patient.isActive ? (
                      <Badge variant="success">Aktiv</Badge>
                    ) : (
                      <Badge variant="danger">Inaktiv</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/patients/${patient.id}`}>
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
