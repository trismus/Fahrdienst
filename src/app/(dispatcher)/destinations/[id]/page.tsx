import { notFound } from 'next/navigation';
import { DestinationForm } from '@/components/forms';
import { getDestination } from '@/lib/actions/destinations';

interface DestinationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DestinationDetailPage({ params }: DestinationDetailPageProps) {
  const { id } = await params;
  const destination = await getDestination(id);

  if (!destination) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <DestinationForm destination={destination} />
    </div>
  );
}
