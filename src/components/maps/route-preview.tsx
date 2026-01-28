'use client';

import { useMemo } from 'react';
import { RouteMap } from './route-map';

// =============================================================================
// TYPES
// =============================================================================

interface RoutePreviewProps {
  /** Patient coordinates (origin) */
  patientCoordinates: {
    lat: number | null | undefined;
    lng: number | null | undefined;
    label?: string;
  };
  /** Destination coordinates */
  destinationCoordinates: {
    lat: number | null | undefined;
    lng: number | null | undefined;
    label?: string;
  };
  /** Callback when route info is calculated */
  onRouteCalculated?: (info: {
    distanceKm: number;
    durationMinutes: number;
    distanceText: string;
    durationText: string;
  }) => void;
  /** Optional className for styling */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * RoutePreview - Kompakte Kartenvorschau fuer Formulare
 *
 * Zeigt eine Route zwischen Patient und Ziel an, wenn beide
 * gueltige Koordinaten haben. Optimiert fuer Inline-Darstellung
 * in Formularen mit kompakter Hoehe und minimalem Design.
 */
export function RoutePreview({
  patientCoordinates,
  destinationCoordinates,
  onRouteCalculated,
  className = '',
}: RoutePreviewProps) {
  // Check if we have valid coordinates for both points
  const hasValidCoordinates = useMemo(() => {
    return (
      typeof patientCoordinates.lat === 'number' &&
      typeof patientCoordinates.lng === 'number' &&
      typeof destinationCoordinates.lat === 'number' &&
      typeof destinationCoordinates.lng === 'number' &&
      !isNaN(patientCoordinates.lat) &&
      !isNaN(patientCoordinates.lng) &&
      !isNaN(destinationCoordinates.lat) &&
      !isNaN(destinationCoordinates.lng)
    );
  }, [
    patientCoordinates.lat,
    patientCoordinates.lng,
    destinationCoordinates.lat,
    destinationCoordinates.lng,
  ]);

  // Handle route calculation callback
  const handleRouteCalculated = useMemo(() => {
    if (!onRouteCalculated) return undefined;

    return (info: { distance: string; duration: string; distanceMeters: number; durationSeconds: number }) => {
      onRouteCalculated({
        distanceKm: Math.round(info.distanceMeters / 100) / 10, // Round to 1 decimal
        durationMinutes: Math.round(info.durationSeconds / 60),
        distanceText: info.distance,
        durationText: info.duration,
      });
    };
  }, [onRouteCalculated]);

  // Don't render if coordinates are invalid
  if (!hasValidCoordinates) {
    return null;
  }

  return (
    <div className={`mt-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
          <svg className="w-3 h-3 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Routenvorschau
        </span>
      </div>
      <RouteMap
        origin={{
          lat: patientCoordinates.lat as number,
          lng: patientCoordinates.lng as number,
          label: patientCoordinates.label,
        }}
        destination={{
          lat: destinationCoordinates.lat as number,
          lng: destinationCoordinates.lng as number,
          label: destinationCoordinates.label,
        }}
        compact
        height={250}
        onRouteCalculated={handleRouteCalculated}
      />
    </div>
  );
}
