import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DestinationForm } from '@/components/forms';
import { DestinationDeactivateButton } from '@/components/destinations';
import { getDestinationById } from '@/lib/actions/destinations-v2';
import { Button, Badge } from '@/components/ui';

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
    <div className="space-y-6">
      {/* Header with back button and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/destinations">
            <Button variant="ghost" size="sm">
              Zurueck zur Liste
            </Button>
          </Link>
          {!destination.isActive && (
            <Badge variant="danger">Deaktiviert</Badge>
          )}
        </div>
        <DestinationDeactivateButton destinationId={destination.id} isActive={destination.isActive} />
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <DestinationForm destination={destination} />
      </div>
    </div>
  );
}
