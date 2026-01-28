import { notFound } from 'next/navigation';
import { DestinationForm } from '@/components/forms';
import { getDestinationById } from '@/lib/actions/destinations-v2';

interface DestinationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DestinationDetailPage({ params }: DestinationDetailPageProps) {
  const { id } = await params;
  const destination = await getDestinationById(id);

  if (!destination) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <DestinationForm destination={destination} />
    </div>
  );
}
