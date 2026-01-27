'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, Button } from '@/components/ui';
import { setAvailabilityBlock, deleteAvailabilityBlock } from '@/lib/actions/drivers';
import type { AvailabilityBlock, Weekday } from '@/types';

const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
];

const TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: '08:00 - 10:00' },
  { start: '10:00', end: '12:00', label: '10:00 - 12:00' },
  { start: '12:00', end: '14:00', label: '12:00 - 14:00' },
  { start: '14:00', end: '16:00', label: '14:00 - 16:00' },
  { start: '16:00', end: '18:00', label: '16:00 - 18:00' },
];

interface AvailabilityGridProps {
  driverId: string;
  blocks: AvailabilityBlock[];
  readonly?: boolean;
}

export function AvailabilityGrid({ driverId, blocks, readonly = false }: AvailabilityGridProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticBlocks, setOptimisticBlocks] = useState(blocks);

  const isSlotActive = (weekday: Weekday, startTime: string) => {
    return optimisticBlocks.some(
      (block) => block.weekday === weekday && block.start_time === startTime
    );
  };

  const getBlockId = (weekday: Weekday, startTime: string) => {
    const block = optimisticBlocks.find(
      (b) => b.weekday === weekday && b.start_time === startTime
    );
    return block?.id;
  };

  const toggleSlot = (weekday: Weekday, startTime: string, endTime: string) => {
    if (readonly || isPending) return;

    const isActive = isSlotActive(weekday, startTime);
    const blockId = getBlockId(weekday, startTime);

    // Optimistic update
    if (isActive && blockId) {
      setOptimisticBlocks((prev) => prev.filter((b) => b.id !== blockId));
    } else {
      const newBlock: AvailabilityBlock = {
        id: `temp-${Date.now()}`,
        driver_id: driverId,
        weekday,
        start_time: startTime,
        end_time: endTime,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setOptimisticBlocks((prev) => [...prev, newBlock]);
    }

    // Server action
    startTransition(async () => {
      try {
        if (isActive && blockId) {
          await deleteAvailabilityBlock(blockId, driverId);
        } else {
          await setAvailabilityBlock({
            driver_id: driverId,
            weekday,
            start_time: startTime,
            end_time: endTime,
          });
        }
      } catch (error) {
        // Revert on error
        setOptimisticBlocks(blocks);
        console.error('Failed to update availability:', error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wöchentliche Verfügbarkeit</CardTitle>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-gray-500"></th>
              {TIME_SLOTS.map((slot) => (
                <th key={slot.start} className="p-2 text-center text-xs font-medium text-gray-500">
                  {slot.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((day) => (
              <tr key={day.key} className="border-t">
                <td className="p-2 text-sm font-medium">{day.label}</td>
                {TIME_SLOTS.map((slot) => {
                  const active = isSlotActive(day.key, slot.start);
                  return (
                    <td key={`${day.key}-${slot.start}`} className="p-1">
                      <button
                        type="button"
                        onClick={() => toggleSlot(day.key, slot.start, slot.end)}
                        disabled={readonly || isPending}
                        className={`
                          w-full h-10 rounded-lg transition-colors
                          ${active
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }
                          ${readonly ? 'cursor-default' : 'cursor-pointer'}
                          ${isPending ? 'opacity-50' : ''}
                          disabled:cursor-not-allowed
                        `}
                        aria-label={`${day.label} ${slot.label} ${active ? 'verfügbar' : 'nicht verfügbar'}`}
                      >
                        {active && (
                          <span className="text-white text-xs font-medium">✓</span>
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

      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>Verfügbar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border"></div>
          <span>Nicht verfügbar</span>
        </div>
      </div>
    </Card>
  );
}
