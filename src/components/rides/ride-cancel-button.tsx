'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Textarea } from '@/components/ui';
import { cancelRide } from '@/lib/actions/rides-v2';

interface RideCancelButtonProps {
  rideId: string;
  rideStatus: string;
}

export function RideCancelButton({ rideId, rideStatus }: RideCancelButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Cannot cancel completed or already cancelled rides
  const canCancel = rideStatus !== 'completed' && rideStatus !== 'cancelled';

  if (!canCancel) {
    return null;
  }

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      try {
        await cancelRide(rideId, reason || undefined);
        setShowDialog(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Stornieren');
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setShowDialog(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        Stornieren
      </Button>

      {/* Modal Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isPending && setShowDialog(false)}
          />

          {/* Dialog */}
          <Card className="relative z-10 w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Fahrt stornieren
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sind Sie sicher, dass Sie diese Fahrt stornieren moechten?
              Diese Aktion kann nicht rueckgaengig gemacht werden.
            </p>

            <div className="mb-4">
              <Textarea
                label="Grund (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="z.B. Patient hat abgesagt, Termin verschoben..."
                rows={3}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDialog(false)}
                disabled={isPending}
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleCancel}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {isPending ? 'Wird storniert...' : 'Stornieren'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
