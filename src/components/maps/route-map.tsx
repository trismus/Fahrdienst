'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Card } from '@/components/ui';
import { loadGoogleMaps } from './google-maps-loader';

// =============================================================================
// TYPES
// =============================================================================

interface Coordinates {
  lat: number;
  lng: number;
  label?: string;
}

interface RouteMapProps {
  origin: Coordinates;
  destination: Coordinates;
  className?: string;
  /** Compact mode for inline display (smaller height, no external link) */
  compact?: boolean;
  /** Custom height in pixels (default: 300, compact: 250) */
  height?: number;
  /** Hide the route info panel below the map */
  hideRouteInfo?: boolean;
  /** Callback when route info is calculated */
  onRouteCalculated?: (info: { distance: string; duration: string; distanceMeters: number; durationSeconds: number }) => void;
}

interface RouteInfo {
  distance: string;
  duration: string;
  distanceMeters: number;
  durationSeconds: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RouteMap({
  origin,
  destination,
  className = '',
  compact = false,
  height,
  hideRouteInfo = false,
  onRouteCalculated,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize coordinates to prevent unnecessary re-renders
  const originKey = useMemo(() => `${origin.lat},${origin.lng}`, [origin.lat, origin.lng]);
  const destinationKey = useMemo(() => `${destination.lat},${destination.lng}`, [destination.lat, destination.lng]);

  // Calculate map height
  const mapHeight = height ?? (compact ? 250 : 300);

  useEffect(() => {
    let mounted = true;

    // Reset state on coordinate change
    setIsLoading(true);
    setError(null);

    loadGoogleMaps()
      .then(() => {
        if (!mounted || !mapRef.current) return;

        // Clean up previous map instance
        if (mapInstanceRef.current) {
          // Google Maps doesn't have a destroy method, but we can clear references
          mapInstanceRef.current = null;
        }
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
          directionsRendererRef.current = null;
        }

        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
          zoom: 12,
          center: { lat: origin.lat, lng: origin.lng },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: !compact,
          zoomControl: !compact,
          gestureHandling: compact ? 'cooperative' : 'greedy',
        });
        mapInstanceRef.current = map;

        // Initialize directions renderer
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#0066FF', // accent color from design system
            strokeWeight: 4,
          },
        });
        directionsRendererRef.current = directionsRenderer;

        // Calculate route
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (!mounted) return;

            if (status === google.maps.DirectionsStatus.OK && result) {
              directionsRenderer.setDirections(result);

              const leg = result.routes[0]?.legs[0];
              if (leg) {
                const info: RouteInfo = {
                  distance: leg.distance?.text || '',
                  duration: leg.duration?.text || '',
                  distanceMeters: leg.distance?.value || 0,
                  durationSeconds: leg.duration?.value || 0,
                };
                setRouteInfo(info);
                onRouteCalculated?.(info);
              }
            } else {
              setError('Route konnte nicht berechnet werden');
            }
            setIsLoading(false);
          }
        );
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        setIsLoading(false);
      });

    return () => {
      mounted = false;
      // Clean up on unmount
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [originKey, destinationKey, compact, onRouteCalculated, origin.lat, origin.lng, destination.lat, destination.lng]);

  if (error) {
    return (
      <Card className={className} padding="none">
        <div
          className="flex items-center justify-center text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-xl"
          style={{ height: mapHeight }}
        >
          <div className="text-center px-4">
            <svg className="w-8 h-8 mx-auto mb-2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const showRouteInfoPanel = !hideRouteInfo && routeInfo;

  return (
    <Card padding="none" className={className}>
      <div className="relative">
        <div
          ref={mapRef}
          className={showRouteInfoPanel ? 'rounded-t-xl' : 'rounded-xl'}
          style={{ height: mapHeight }}
        />
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 ${showRouteInfoPanel ? 'rounded-t-xl' : 'rounded-xl'}`}>
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-neutral-300 dark:border-neutral-600 border-t-accent-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Route wird berechnet...</p>
            </div>
          </div>
        )}
      </div>
      {showRouteInfoPanel && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Entfernung</div>
              <div className="font-semibold text-neutral-900 dark:text-white">{routeInfo.distance}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Fahrzeit</div>
              <div className="font-semibold text-neutral-900 dark:text-white">{routeInfo.duration}</div>
            </div>
          </div>
          {!compact && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 text-sm font-medium flex items-center gap-1"
            >
              In Google Maps
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
