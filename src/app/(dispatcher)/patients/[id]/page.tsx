import { notFound } from 'next/navigation';
import { PatientForm } from '@/components/forms';
import { getPatientById } from '@/lib/actions/patients-v2';

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
    <div className="max-w-2xl">
      <PatientForm patient={patient} />
    </div>
  );
}
