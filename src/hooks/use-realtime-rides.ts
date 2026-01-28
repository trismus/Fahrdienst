'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { RideStatus, RideSubstatus } from '@/lib/actions/rides-v2';

// =============================================================================
// TYPES
// =============================================================================

export interface RealtimeRide {
  id: string;
  patientId: string;
  driverId: string | null;
  destinationId: string;
  pickupTime: string;
  arrivalTime: string;
  returnTime: string | null;
  status: RideStatus;
  substatus: RideSubstatus | null;
  startedAt: string | null;
  pickedUpAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface RideChangeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  ride: RealtimeRide;
  oldRide?: RealtimeRide;
  timestamp: Date;
}

interface UseRealtimeRidesOptions {
  /** Only subscribe to rides for a specific date (YYYY-MM-DD) */
  date?: string;
  /** Only subscribe to rides assigned to a specific driver */
  driverId?: string;
  /** Filter by status */
  statuses?: RideStatus[];
  /** Callback when ride changes occur */
  onRideChange?: (event: RideChangeEvent) => void;
  /** Enable/disable the subscription */
  enabled?: boolean;
}

interface UseRealtimeRidesReturn {
  /** Connection status */
  isConnected: boolean;
  /** Recent change events */
  recentChanges: RideChangeEvent[];
  /** Number of active rides (in_progress) */
  activeRideCount: number;
  /** Clear recent changes */
  clearChanges: () => void;
  /** Force reconnect */
  reconnect: () => void;
}

// =============================================================================
// DATABASE ROW TYPES
// =============================================================================

interface RideRow {
  id: string;
  patient_id: string;
  driver_id: string | null;
  destination_id: string;
  pickup_time: string;
  arrival_time: string;
  return_time: string | null;
  status: RideStatus;
  substatus: RideSubstatus | null;
  started_at: string | null;
  picked_up_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function transformRideRow(row: RideRow): RealtimeRide {
  return {
    id: row.id,
    patientId: row.patient_id,
    driverId: row.driver_id,
    destinationId: row.destination_id,
    pickupTime: row.pickup_time,
    arrivalTime: row.arrival_time,
    returnTime: row.return_time,
    status: row.status,
    substatus: row.substatus,
    startedAt: row.started_at,
    pickedUpAt: row.picked_up_at,
    arrivedAt: row.arrived_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// HOOK
// =============================================================================

export function useRealtimeRides(options: UseRealtimeRidesOptions = {}): UseRealtimeRidesReturn {
  const { date, driverId, statuses, onRideChange, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [recentChanges, setRecentChanges] = useState<RideChangeEvent[]>([]);
  const [activeRideCount, setActiveRideCount] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());
  const onRideChangeRef = useRef(onRideChange);

  // Keep callback ref updated
  useEffect(() => {
    onRideChangeRef.current = onRideChange;
  }, [onRideChange]);

  // Handle payload from Supabase
  const handlePayload = useCallback(
    (payload: RealtimePostgresChangesPayload<RideRow>) => {
      const eventType = payload.eventType;
      const newRow = payload.new as RideRow | undefined;
      const oldRow = payload.old as RideRow | undefined;

      // Skip if no new data (shouldn't happen but be safe)
      if (!newRow && eventType !== 'DELETE') return;

      // Apply client-side filters
      if (date && newRow) {
        const rideDate = newRow.pickup_time.split('T')[0];
        if (rideDate !== date) return;
      }

      if (driverId && newRow?.driver_id !== driverId) return;

      if (statuses && statuses.length > 0 && newRow) {
        if (!statuses.includes(newRow.status)) return;
      }

      const ride = newRow ? transformRideRow(newRow) : transformRideRow(oldRow as RideRow);
      const oldRide = oldRow ? transformRideRow(oldRow) : undefined;

      const event: RideChangeEvent = {
        type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        ride,
        oldRide,
        timestamp: new Date(),
      };

      // Update recent changes (keep last 10)
      setRecentChanges((prev) => [event, ...prev].slice(0, 10));

      // Update active ride count
      if (eventType === 'UPDATE' && newRow) {
        if (oldRow?.status !== 'in_progress' && newRow.status === 'in_progress') {
          setActiveRideCount((prev) => prev + 1);
        } else if (oldRow?.status === 'in_progress' && newRow.status !== 'in_progress') {
          setActiveRideCount((prev) => Math.max(0, prev - 1));
        }
      }

      // Call external callback
      if (onRideChangeRef.current) {
        onRideChangeRef.current(event);
      }
    },
    [date, driverId, statuses]
  );

  // Setup subscription
  const setupSubscription = useCallback(() => {
    if (!enabled) return;

    // Cleanup existing channel
    if (channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current);
    }

    // Create new channel with unique name
    const channelName = `rides-realtime-${Date.now()}`;
    const channel = supabaseRef.current
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
        },
        handlePayload
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;
  }, [enabled, handlePayload]);

  // Effect to manage subscription
  useEffect(() => {
    setupSubscription();

    return () => {
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupSubscription]);

  // Fetch initial active ride count
  useEffect(() => {
    if (!enabled) return;

    const fetchActiveCount = async () => {
      let query = supabaseRef.current
        .from('rides')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      if (date) {
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;
        query = query.gte('pickup_time', startOfDay).lte('pickup_time', endOfDay);
      }

      if (driverId) {
        query = query.eq('driver_id', driverId);
      }

      const { count } = await query;
      setActiveRideCount(count || 0);
    };

    fetchActiveCount();
  }, [enabled, date, driverId]);

  const clearChanges = useCallback(() => {
    setRecentChanges([]);
  }, []);

  const reconnect = useCallback(() => {
    setupSubscription();
  }, [setupSubscription]);

  return {
    isConnected,
    recentChanges,
    activeRideCount,
    clearChanges,
    reconnect,
  };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook specifically for the dispatcher dashboard.
 * Subscribes to all ride changes for today.
 */
export function useDashboardRealtime(onRideChange?: (event: RideChangeEvent) => void) {
  const today = new Date().toISOString().split('T')[0];

  return useRealtimeRides({
    date: today,
    onRideChange,
    enabled: true,
  });
}

/**
 * Hook specifically for a driver's rides.
 * Subscribes to changes for rides assigned to the driver.
 */
export function useDriverRealtime(driverId: string, onRideChange?: (event: RideChangeEvent) => void) {
  return useRealtimeRides({
    driverId,
    onRideChange,
    enabled: !!driverId,
  });
}
