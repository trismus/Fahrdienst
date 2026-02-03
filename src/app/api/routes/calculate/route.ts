import { NextRequest, NextResponse } from 'next/server';
import { getAllowedOrigins } from '@/lib/utils/validate-env';
import { checkRateLimit, createRateLimitKey, RATE_LIMITS, getRateLimitHeaders } from '@/lib/utils/rate-limit';

interface RouteRequest {
  origin: { lat: number; lng: number } | string;
  destination: { lat: number; lng: number } | string;
}

interface RouteResponse {
  distance: {
    value: number; // meters
    text: string;
  };
  duration: {
    value: number; // seconds
    text: string;
  };
  polyline?: string;
}

/**
 * Validates the request origin for CSRF/security purposes.
 * Returns null if valid, or an error response if invalid.
 */
function validateOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // In development, be more lenient
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  // Get allowed origins
  const allowedOrigins = getAllowedOrigins();

  // Check origin header
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`[API] Rejected request from unauthorized origin: ${origin}`);
    return NextResponse.json(
      { error: 'Unauthorized origin' },
      { status: 403 }
    );
  }

  // If no origin, check referer as fallback
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      if (!allowedOrigins.includes(refererOrigin)) {
        console.warn(`[API] Rejected request from unauthorized referer: ${refererOrigin}`);
        return NextResponse.json(
          { error: 'Unauthorized origin' },
          { status: 403 }
        );
      }
    } catch {
      // Invalid referer URL
      console.warn('[API] Invalid referer header');
    }
  }

  return null;
}

/**
 * Gets the Google Maps API key for server-side operations.
 * NEVER falls back to client key - this prevents key abuse.
 */
function getServerApiKey(): string | null {
  const serverKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;

  if (serverKey) {
    return serverKey;
  }

  // Log warning but don't fall back to client key
  console.error(
    '[API] GOOGLE_MAPS_SERVER_API_KEY not configured. ' +
      'Route calculations are disabled. Please configure a server-side API key.'
  );

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Validate origin
    const originError = validateOrigin(request);
    if (originError) {
      return originError;
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = createRateLimitKey(null, 'api-route-calculate', ip);
    const rateLimitResult = await checkRateLimit(rateLimitKey, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const { origin, destination } = (await request.json()) as RouteRequest;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    // Get server API key - NEVER use client key
    const apiKey = getServerApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Format origin and destination for the API
    const formatLocation = (loc: { lat: number; lng: number } | string): string => {
      if (typeof loc === 'string') return encodeURIComponent(loc);
      return `${loc.lat},${loc.lng}`;
    };

    const originStr = formatLocation(origin);
    const destinationStr = formatLocation(destination);

    // Call Google Directions API
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=driving&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      // Don't log full error details (may contain sensitive info)
      console.error('[API] Google Directions API error:', data.status);
      return NextResponse.json(
        { error: `Route calculation failed: ${data.status}` },
        { status: 400 }
      );
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    const result: RouteResponse = {
      distance: {
        value: leg.distance.value,
        text: leg.distance.text,
      },
      duration: {
        value: leg.duration.value,
        text: leg.duration.text,
      },
      polyline: route.overview_polyline?.points,
    };

    return NextResponse.json(result);
  } catch (error) {
    // Don't expose internal error details
    console.error('[API] Route calculation error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to calculate route' },
      { status: 500 }
    );
  }
}

// Distance Matrix API for batch calculations
export async function PUT(request: NextRequest) {
  try {
    // Validate origin
    const originError = validateOrigin(request);
    if (originError) {
      return originError;
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = createRateLimitKey(null, 'api-route-matrix', ip);
    const rateLimitResult = await checkRateLimit(rateLimitKey, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const { origins, destinations } = await request.json();

    if (!origins?.length || !destinations?.length) {
      return NextResponse.json(
        { error: 'Origins and destinations arrays are required' },
        { status: 400 }
      );
    }

    // Get server API key - NEVER use client key
    const apiKey = getServerApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const formatLocations = (locs: Array<{ lat: number; lng: number } | string>): string => {
      return locs
        .map((loc) => (typeof loc === 'string' ? loc : `${loc.lat},${loc.lng}`))
        .join('|');
    };

    const originsStr = formatLocations(origins);
    const destinationsStr = formatLocations(destinations);

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originsStr)}&destinations=${encodeURIComponent(destinationsStr)}&mode=driving&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[API] Distance matrix API error:', data.status);
      return NextResponse.json(
        { error: `Distance matrix calculation failed: ${data.status}` },
        { status: 400 }
      );
    }

    // Transform the matrix response
    const matrix = data.rows.map((row: { elements: Array<{ status: string; distance?: { value: number; text: string }; duration?: { value: number; text: string } }> }) =>
      row.elements.map((element) => ({
        status: element.status,
        distance: element.distance,
        duration: element.duration,
      }))
    );

    return NextResponse.json({
      origin_addresses: data.origin_addresses,
      destination_addresses: data.destination_addresses,
      matrix,
    });
  } catch (error) {
    console.error('[API] Distance matrix error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to calculate distance matrix' },
      { status: 500 }
    );
  }
}
