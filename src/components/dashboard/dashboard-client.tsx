'use client';

import { useRouter } from 'next/navigation';
import { useDashboardRealtime, type RideChangeEvent } from '@/hooks/use-realtime-rides';
import { Card } from '@/components/ui';

// =============================================================================
// CONNECTION STATUS BADGE
// =============================================================================

function ConnectionBadge({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        {isConnected && (
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-pulse-ring" />
        )}
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {isConnected ? 'Live' : 'Verbindung wird hergestellt...'}
      </span>
    </div>
  );
}

// =============================================================================
// LIVE RIDES COUNTER
// =============================================================================

interface LiveCounterProps {
  initialCount: number;
  label: string;
  icon: React.ReactNode;
  colorClass?: string;
}

export function LiveCounter({ initialCount, label, icon, colorClass = '' }: LiveCounterProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          {label}
        </p>
        <p className={`text-4xl font-bold tabular-nums ${colorClass || 'text-gray-900 dark:text-white'}`}>
          {initialCount}
        </p>
      </div>
      {icon}
    </div>
  );
}

// =============================================================================
// ACTIVE RIDES CARD WITH REAL-TIME
// =============================================================================

interface ActiveRidesCardProps {
  initialCount: number;
}

export function ActiveRidesCard({ initialCount }: ActiveRidesCardProps) {
  const router = useRouter();
  const { activeRideCount, isConnected } = useDashboardRealtime((event) => {
    // Refresh when rides change status
    if (
      event.ride.status === 'in_progress' ||
      event.oldRide?.status === 'in_progress'
    ) {
      router.refresh();
    }
  });

  const count = activeRideCount > 0 ? activeRideCount : initialCount;
  const hasActiveRides = count > 0;

  return (
    <Card className={`p-6 ${hasActiveRides ? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/10' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Aktive Fahrten
          </p>
          <div className="flex items-center gap-3">
            <p className={`text-4xl font-bold tabular-nums ${hasActiveRides ? 'text-purple-600' : 'text-gray-900 dark:text-white'}`}>
              {count}
            </p>
            {hasActiveRides && isConnected && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">LIVE</span>
              </div>
            )}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasActiveRides ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <svg className={`w-6 h-6 ${hasActiveRides ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// LIVE ACTIVITY PANEL
// =============================================================================

interface LiveActivityPanelProps {
  onEventClick?: (rideId: string) => void;
}

function getStatusConfig(status: string): { color: string; bg: string; label: string } {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    planned: { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Geplant' },
    confirmed: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Bestaetigt' },
    in_progress: { color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Unterwegs' },
    completed: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Abgeschlossen' },
    cancelled: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Storniert' },
  };
  return configs[status] || { color: 'text-gray-600', bg: 'bg-gray-100', label: status };
}

function formatEventMessage(event: RideChangeEvent): string {
  if (event.type === 'INSERT') {
    return 'Neue Fahrt erstellt';
  }
  if (event.type === 'DELETE') {
    return 'Fahrt geloescht';
  }

  // Status change
  if (event.oldRide?.status !== event.ride.status) {
    const config = getStatusConfig(event.ride.status);
    return `Status geaendert: ${config.label}`;
  }

  // Driver assignment
  if (!event.oldRide?.driverId && event.ride.driverId) {
    return 'Fahrer zugewiesen';
  }
  if (event.oldRide?.driverId && !event.ride.driverId) {
    return 'Fahrer entfernt';
  }

  return 'Fahrt aktualisiert';
}

export function LiveActivityPanel({ onEventClick }: LiveActivityPanelProps) {
  const { recentChanges, isConnected } = useDashboardRealtime();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Live Aktivitaet
        </h3>
        <ConnectionBadge isConnected={isConnected} />
      </div>

      {recentChanges.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Warten auf Aktivitaet...
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Aenderungen werden hier live angezeigt
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {recentChanges.slice(0, 10).map((event, index) => {
            const config = getStatusConfig(event.ride.status);
            return (
              <button
                key={`${event.ride.id}-${event.timestamp.getTime()}`}
                onClick={() => onEventClick?.(event.ride.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left ${
                  index === 0 ? 'animate-slide-in-right' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {formatEventMessage(event)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Fahrt #{event.ride.id.slice(0, 8)}... - {event.timestamp.toLocaleTimeString('de-CH', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// =============================================================================
// DASHBOARD AUTO-REFRESH WRAPPER
// =============================================================================

interface DashboardAutoRefreshProps {
  children: React.ReactNode;
  refreshInterval?: number; // milliseconds, 0 to disable
}

export function DashboardAutoRefresh({ children, refreshInterval = 0 }: DashboardAutoRefreshProps) {
  const router = useRouter();

  // Real-time subscription handles refresh automatically
  useDashboardRealtime((event) => {
    // Only refresh for significant events
    const isSignificant =
      event.type === 'INSERT' ||
      event.ride.status === 'in_progress' ||
      event.ride.status === 'completed' ||
      event.ride.status === 'cancelled';

    if (isSignificant) {
      router.refresh();
    }
  });

  return <>{children}</>;
}
