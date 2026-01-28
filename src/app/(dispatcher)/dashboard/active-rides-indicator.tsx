'use client';

import { useDashboardRealtime } from '@/hooks/use-realtime-rides';
import { useRouter } from 'next/navigation';

/**
 * Kompaktes Inline-Component für die Quick Stats Bar.
 * Zeigt Aktive-Fahrten-Zahl + LIVE-Indikator ohne Card-Wrapper.
 * Nutzt warning-orange statt purple für Konsistenz mit dem Status-Color-System.
 */
interface ActiveRidesIndicatorProps {
  initialCount: number;
}

export function ActiveRidesIndicator({ initialCount }: ActiveRidesIndicatorProps) {
  const router = useRouter();
  const { activeRideCount, isConnected } = useDashboardRealtime((event) => {
    if (
      event.ride.status === 'in_progress' ||
      event.oldRide?.status === 'in_progress'
    ) {
      router.refresh();
    }
  });

  const count = activeRideCount > 0 ? activeRideCount : initialCount;
  const hasActive = count > 0;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      hasActive
        ? 'bg-warning-light text-warning-dark'
        : 'bg-neutral-100 text-neutral-600'
    }`}>
      <span className="text-lg tabular-nums">{count}</span>
      <span>Aktiv</span>
      {hasActive && isConnected && (
        <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-warning-DEFAULT/10">
          <span className="w-1.5 h-1.5 rounded-full bg-warning-DEFAULT animate-pulse" />
          <span className="text-xs font-bold text-warning-dark">LIVE</span>
        </span>
      )}
    </div>
  );
}
