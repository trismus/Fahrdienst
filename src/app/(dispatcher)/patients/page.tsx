import Link from 'next/link';
import { Button, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { getPatients } from '@/lib/actions/patients-v2';

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patienten</h1>
        <Link href="/patients/new">
          <Button>Neuer Patient</Button>
        </Link>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nr.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Bedürfnisse</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Keine Patienten vorhanden
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
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
                    <div className="flex gap-1">
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
