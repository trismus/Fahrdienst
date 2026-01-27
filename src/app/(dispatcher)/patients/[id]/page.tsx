import { notFound } from 'next/navigation';
import { PatientForm } from '@/components/forms';
import { getPatient } from '@/lib/actions/patients';

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <PatientForm patient={patient} />
    </div>
  );
}
