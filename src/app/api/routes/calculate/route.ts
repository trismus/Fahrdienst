import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { origin, destination } = (await request.json()) as RouteRequest;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
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
      console.error('Google Directions API error:', data.status, data.error_message);
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
    console.error('Route calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate route' },
      { status: 500 }
    );
  }
}

// Distance Matrix API for batch calculations
export async function PUT(request: NextRequest) {
  try {
    const { origins, destinations } = await request.json();

    if (!origins?.length || !destinations?.length) {
      return NextResponse.json(
        { error: 'Origins and destinations arrays are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
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
    console.error('Distance matrix error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate distance matrix' },
      { status: 500 }
    );
  }
}
