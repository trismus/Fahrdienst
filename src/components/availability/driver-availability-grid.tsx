'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  type AvailabilityBlock,
} from '@/lib/actions/drivers-v2';

// =============================================================================
// CONSTANTS
// =============================================================================

type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
];

const TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: '08-10' },
  { start: '10:00', end: '12:00', label: '10-12' },
  { start: '12:00', end: '14:00', label: '12-14' },
  { start: '14:00', end: '16:00', label: '14-16' },
  { start: '16:00', end: '18:00', label: '16-18' },
];

// =============================================================================
// TYPES
// =============================================================================

interface DriverAvailabilityGridProps {
  driverId: string;
  blocks: AvailabilityBlock[];
}

interface FeedbackState {
  type: 'success' | 'error' | null;
  message: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DriverAvailabilityGrid({ driverId, blocks }: DriverAvailabilityGridProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticBlocks, setOptimisticBlocks] = useState(blocks);
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, message: '' });

  const isSlotActive = (weekday: Weekday, startTime: string) => {
    return optimisticBlocks.some(
      (block) => block.weekday === weekday && block.startTime === startTime
    );
  };

  const getBlockId = (weekday: Weekday, startTime: string) => {
    const block = optimisticBlocks.find(
      (b) => b.weekday === weekday && b.startTime === startTime
    );
    return block?.id;
  };

  const toggleSlot = (weekday: Weekday, startTime: string, endTime: string) => {
    if (isPending) return;

    const isActive = isSlotActive(weekday, startTime);
    const blockId = getBlockId(weekday, startTime);

    // Optimistic update
    if (isActive && blockId) {
      setOptimisticBlocks((prev) => prev.filter((b) => b.id !== blockId));
    } else {
      const newBlock: AvailabilityBlock = {
        id: `temp-${Date.now()}`,
        driverId,
        weekday,
        startTime,
        endTime,
      };
      setOptimisticBlocks((prev) => [...prev, newBlock]);
    }

    // Clear previous feedback
    setFeedback({ type: null, message: '' });

    // Server action
    startTransition(async () => {
      try {
        if (isActive && blockId) {
          await deleteAvailabilityBlock(blockId, driverId);
          setFeedback({ type: 'success', message: 'Verfuegbarkeit entfernt' });
        } else {
          const result = await createAvailabilityBlock({
            driverId,
            weekday,
            startTime,
            endTime,
          });
          // Update with real ID
          setOptimisticBlocks((prev) =>
            prev.map((b) =>
              b.id.startsWith('temp-') && b.weekday === weekday && b.startTime === startTime
                ? result
                : b
            )
          );
          setFeedback({ type: 'success', message: 'Verfuegbarkeit hinzugefuegt' });
        }

        // Clear feedback after 2 seconds
        setTimeout(() => setFeedback({ type: null, message: '' }), 2000);
      } catch (error) {
        // Revert on error
        setOptimisticBlocks(blocks);
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Woechentliche Verfuegbarkeit</CardTitle>
      </CardHeader>

      {/* Feedback Banner */}
      {feedback.type && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Instructions */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Klicke auf die Zeitbloecke, um deine Verfuegbarkeit zu markieren. Gruene Bloecke zeigen an, wann du fuer Fahrten verfuegbar bist.
      </p>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-gray-500 w-28"></th>
              {TIME_SLOTS.map((slot) => (
                <th key={slot.start} className="p-2 text-center text-xs font-medium text-gray-500">
                  {slot.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((day) => (
              <tr key={day.key} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {day.label}
                </td>
                {TIME_SLOTS.map((slot) => {
                  const active = isSlotActive(day.key, slot.start);
                  return (
                    <td key={`${day.key}-${slot.start}`} className="p-1">
                      <button
                        type="button"
                        onClick={() => toggleSlot(day.key, slot.start, slot.end)}
                        disabled={isPending}
                        className={`
                          w-full h-12 rounded-lg transition-all duration-200
                          flex items-center justify-center
                          ${active
                            ? 'bg-green-500 hover:bg-green-600 shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }
                          ${isPending ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                          disabled:cursor-not-allowed
                          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                        `}
                        aria-label={`${day.label} ${slot.label} ${active ? 'verfuegbar' : 'nicht verfuegbar'}`}
                        aria-pressed={active}
                      >
                        {active && (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span>Verfuegbar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></div>
          <span>Nicht verfuegbar</span>
        </div>
      </div>
    </Card>
  );
}
