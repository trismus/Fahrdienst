'use client';

import { useEffect, useRef, useState } from 'react';

interface PatientPin {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface PatientsMapProps {
  patients: PatientPin[];
  className?: string;
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export function PatientsMap({ patients, className = '' }: PatientsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (patients.length === 0) {
      setIsLoading(false);
      return;
    }

    loadGoogleMaps()
      .then(() => {
        if (!mounted || !mapRef.current) return;

        // Initialize map centered on Switzerland
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 47.0, lng: 8.0 },
          zoom: 9,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // Clear old markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const bounds = new google.maps.LatLngBounds();

        patients.forEach((patient) => {
          const position = { lat: patient.lat, lng: patient.lng };
          bounds.extend(position);

          const marker = new google.maps.Marker({
            position,
            map,
            title: patient.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#0066FF',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
              scale: 7,
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px 4px; max-width: 180px; font-family: system-ui, sans-serif;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #212121;">${patient.name}</p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #757575;">${patient.address}</p>
              </div>
            `,
            maxWidth: 200,
          });

          marker.addListener('click', () => {
            infoWindow.open({ map, anchor: marker });
          });

          markersRef.current.push(marker);
        });

        // Fit map to all markers
        if (patients.length === 1) {
          map.setCenter(bounds.getCenter());
          map.setZoom(14);
        } else {
          map.fitBounds(bounds, { top: 16, bottom: 16, left: 16, right: 16 });
        }

        setIsLoading(false);
      })
      .catch(() => {
        if (mounted) {
          setError('Karte konnte nicht geladen werden');
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [patients]);

  if (patients.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-neutral-50 rounded-xl border border-neutral-200 ${className}`}>
        <div className="text-center py-8">
          <svg className="w-8 h-8 text-neutral-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-neutral-400">Keine Koordinaten vorhanden</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden border border-neutral-200" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 rounded-xl">
          <p className="text-sm text-neutral-400">Karte wird geladen...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 rounded-xl">
          <p className="text-sm text-error-dark">{error}</p>
        </div>
      )}
    </div>
  );
}
