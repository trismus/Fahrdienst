/**
 * Google Maps API Loader (Singleton)
 *
 * Ensures Google Maps is loaded only once with all required libraries.
 * Used by RouteMap and AddressAutocomplete components.
 */

// State management for the singleton loader
let googleMapsPromise: Promise<void> | null = null;
let googleMapsLoadError: Error | null = null;

// Libraries we need for the application
const REQUIRED_LIBRARIES = ['places'];

/**
 * Load Google Maps API with all required libraries
 * @returns Promise that resolves when Google Maps is ready
 */
export function loadGoogleMaps(): Promise<void> {
  // Return cached error if loading failed
  if (googleMapsLoadError) {
    return Promise.reject(googleMapsLoadError);
  }

  // Return existing promise if already loading/loaded
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded (possibly by another script)
    if (isGoogleMapsLoaded()) {
      resolve();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      const error = new Error('Google Maps API-Key nicht konfiguriert');
      googleMapsLoadError = error;
      reject(error);
      return;
    }

    // Check if script is already being loaded by another component
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for existing script to load
      waitForGoogleMaps(resolve, reject);
      return;
    }

    // Set up callback for script load
    const callbackName = `initGoogleMapsCallback_${Date.now()}`;
    const win = window as unknown as Window & { [key: string]: (() => void) | undefined };
    win[callbackName] = () => {
      delete win[callbackName];
      resolve();
    };

    // Create and append script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${REQUIRED_LIBRARIES.join(',')}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      const error = new Error('Google Maps konnte nicht geladen werden');
      googleMapsLoadError = error;
      delete win[callbackName];
      reject(error);
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/**
 * Check if Google Maps API is fully loaded with all required features
 */
function isGoogleMapsLoaded(): boolean {
  return !!(
    window.google?.maps &&
    window.google.maps.Map &&
    window.google.maps.DirectionsService &&
    window.google.maps.places?.Autocomplete
  );
}

/**
 * Wait for an existing Google Maps script to finish loading
 */
function waitForGoogleMaps(resolve: () => void, reject: (error: Error) => void): void {
  const checkInterval = 100; // ms
  const maxWaitTime = 15000; // 15 seconds
  let elapsed = 0;

  const checkLoaded = setInterval(() => {
    if (isGoogleMapsLoaded()) {
      clearInterval(checkLoaded);
      resolve();
      return;
    }

    elapsed += checkInterval;
    if (elapsed >= maxWaitTime) {
      clearInterval(checkLoaded);
      const error = new Error('Google Maps Ladezeit ueberschritten');
      googleMapsLoadError = error;
      reject(error);
    }
  }, checkInterval);
}

/**
 * Reset the loader state (useful for testing)
 */
export function resetGoogleMapsLoader(): void {
  googleMapsPromise = null;
  googleMapsLoadError = null;
}
