'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui';

interface RouteMapProps {
  origin: { lat: number; lng: number; label?: string };
  destination: { lat: number; lng: number; label?: string };
  className?: string;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export function RouteMap({ origin, destination, className = '' }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    loadGoogleMaps()
      .then(() => {
        if (!mounted || !mapRef.current) return;

        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
          zoom: 12,
          center: origin,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapInstanceRef.current = map;

        // Initialize directions renderer
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#2563eb',
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
                setRouteInfo({
                  distance: leg.distance?.text || '',
                  duration: leg.duration?.text || '',
                });
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
        setError(err.message);
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [origin, destination]);

  if (error) {
    return (
      <Card className={className}>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          {error}
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none" className={className}>
      <div className="relative">
        <div
          ref={mapRef}
          className="h-[300px] rounded-t-lg"
          style={{ minHeight: '300px' }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-t-lg">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
      {routeInfo && (
        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-gray-500">Entfernung</div>
              <div className="font-semibold">{routeInfo.distance}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Fahrzeit</div>
              <div className="font-semibold">{routeInfo.duration}</div>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            In Google Maps öffnen →
          </a>
        </div>
      )}
    </Card>
  );
}
