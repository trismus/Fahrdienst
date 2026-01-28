'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { deactivateDestination, reactivateDestination } from '@/lib/actions/destinations-v2';

interface DestinationDeactivateButtonProps {
  destinationId: string;
  isActive: boolean;
}

export function DestinationDeactivateButton({ destinationId, isActive }: DestinationDeactivateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isActive) {
        await deactivateDestination(destinationId);
      } else {
        await reactivateDestination(destinationId);
      }
      router.refresh();
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to toggle destination status:', error);
      alert(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  if (isActive) {
    return (
      <>
        <Button
          variant="secondary"
          onClick={() => setShowConfirm(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Deaktivieren
        </Button>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ziel deaktivieren
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sind Sie sicher, dass Sie dieses Ziel deaktivieren moechten?
                Das Ziel wird nicht mehr in der aktiven Liste angezeigt und kann
                fuer keine neuen Fahrten verwendet werden.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Hinweis: Das Ziel kann jederzeit wieder aktiviert werden.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleToggle}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? 'Deaktivieren...' : 'Deaktivieren'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Reactivate button for inactive destinations
  return (
    <Button
      variant="secondary"
      onClick={handleToggle}
      disabled={loading}
      className="text-green-600 hover:text-green-700 hover:bg-green-50"
    >
      {loading ? 'Aktivieren...' : 'Wieder aktivieren'}
    </Button>
  );
}
