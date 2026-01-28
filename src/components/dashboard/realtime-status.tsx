'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardRealtime, type RideChangeEvent } from '@/hooks/use-realtime-rides';

// =============================================================================
// CONNECTION INDICATOR
// =============================================================================

interface ConnectionIndicatorProps {
  isConnected: boolean;
}

export function ConnectionIndicator({ isConnected }: ConnectionIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}

// =============================================================================
// LIVE ACTIVITY FEED
// =============================================================================

interface LiveActivityFeedProps {
  maxItems?: number;
}

function formatEventTime(date: Date): string {
  return date.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getEventDescription(event: RideChangeEvent): string {
  const statusLabels: Record<string, string> = {
    planned: 'Geplant',
    confirmed: 'Bestaetigt',
    in_progress: 'Unterwegs',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
  };

  const substatusLabels: Record<string, string> = {
    waiting: 'Warten auf Start',
    en_route_pickup: 'Auf dem Weg zur Abholung',
    at_pickup: 'Bei Patient',
    en_route_destination: 'Auf dem Weg zum Ziel',
    at_destination: 'Am Ziel angekommen',
    completed: 'Abgeschlossen',
  };

  if (event.type === 'INSERT') {
    return 'Neue Fahrt erstellt';
  }

  if (event.type === 'DELETE') {
    return 'Fahrt geloescht';
  }

  // UPDATE event
  const oldStatus = event.oldRide?.status;
  const newStatus = event.ride.status;
  const oldSubstatus = event.oldRide?.substatus;
  const newSubstatus = event.ride.substatus;

  // Status change
  if (oldStatus !== newStatus) {
    return `Status: ${statusLabels[newStatus] || newStatus}`;
  }

  // Substatus change
  if (oldSubstatus !== newSubstatus && newSubstatus) {
    return substatusLabels[newSubstatus] || newSubstatus;
  }

  return 'Fahrt aktualisiert';
}

function getEventIcon(event: RideChangeEvent): React.ReactNode {
  const status = event.ride.status;

  if (status === 'completed') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === 'in_progress') {
    return (
      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
        <svg className="w-4 h-4 text-purple-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

export function LiveActivityFeed({ maxItems = 5 }: LiveActivityFeedProps) {
  const router = useRouter();
  const [events, setEvents] = useState<RideChangeEvent[]>([]);

  const { isConnected, recentChanges } = useDashboardRealtime(() => {
    // Trigger a page refresh to update stats
    router.refresh();
  });

  // Update local events when recentChanges updates
  useEffect(() => {
    setEvents(recentChanges.slice(0, maxItems));
  }, [recentChanges, maxItems]);

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <ConnectionIndicator isConnected={isConnected} />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Warten auf Aktivitaet...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Live Aktivitaet
        </h3>
        <ConnectionIndicator isConnected={isConnected} />
      </div>

      <div className="space-y-2">
        {events.map((event, index) => (
          <div
            key={`${event.ride.id}-${event.timestamp.getTime()}`}
            className={`flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 ${
              index === 0 ? 'animate-fade-in' : ''
            }`}
          >
            {getEventIcon(event)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getEventDescription(event)}
              </p>
              <p className="text-xs text-gray-500">
                {formatEventTime(event.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ACTIVE RIDES COUNTER
// =============================================================================

interface ActiveRidesCounterProps {
  initialCount?: number;
}

export function ActiveRidesCounter({ initialCount = 0 }: ActiveRidesCounterProps) {
  const { activeRideCount } = useDashboardRealtime();
  const [displayCount, setDisplayCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (activeRideCount !== displayCount) {
      setIsAnimating(true);
      setDisplayCount(activeRideCount);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [activeRideCount, displayCount]);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`text-4xl font-bold tabular-nums transition-transform ${
          isAnimating ? 'scale-110' : ''
        } ${activeRideCount > 0 ? 'text-purple-600' : 'text-gray-900 dark:text-white'}`}
      >
        {displayCount}
      </div>
      {activeRideCount > 0 && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs text-purple-600 font-medium">LIVE</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DASHBOARD REALTIME WRAPPER
// =============================================================================

interface DashboardRealtimeWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that provides real-time updates context to the dashboard.
 * Automatically refreshes the page when significant changes occur.
 */
export function DashboardRealtimeWrapper({ children }: DashboardRealtimeWrapperProps) {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { isConnected } = useDashboardRealtime((event) => {
    // Only refresh for significant events to avoid too many refreshes
    const now = new Date();
    const timeSinceLastRefresh = now.getTime() - lastRefresh.getTime();

    // Debounce: at least 2 seconds between refreshes
    if (timeSinceLastRefresh < 2000) return;

    // Significant events that warrant a refresh
    const isSignificant =
      event.type === 'INSERT' ||
      event.ride.status === 'in_progress' ||
      event.ride.status === 'completed' ||
      event.ride.status === 'cancelled' ||
      (event.oldRide?.status !== event.ride.status);

    if (isSignificant) {
      setLastRefresh(now);
      router.refresh();
    }
  });

  return (
    <div className="relative">
      {/* Connection status in corner */}
      <div className="absolute top-0 right-0 z-10">
        <ConnectionIndicator isConnected={isConnected} />
      </div>
      {children}
    </div>
  );
}

// =============================================================================
// CSS FOR ANIMATIONS (add to globals.css or use inline)
// =============================================================================

// Add this to your globals.css:
// @keyframes fade-in {
//   from { opacity: 0; transform: translateY(-10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in {
//   animation: fade-in 0.3s ease-out;
// }
