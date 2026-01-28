import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PatientForm } from '@/components/forms';
import { PatientDeactivateButton } from '@/components/patients/patient-deactivate-button';
import { getPatientById } from '@/lib/actions/patients-v2';
import { Button, Badge } from '@/components/ui';

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patients">
            <Button variant="ghost" size="sm">
              Zurueck zur Liste
            </Button>
          </Link>
          {!patient.isActive && (
            <Badge variant="danger">Deaktiviert</Badge>
          )}
        </div>
        <PatientDeactivateButton patientId={patient.id} isActive={patient.isActive} />
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <PatientForm patient={patient} />
      </div>
    </div>
  );
}
