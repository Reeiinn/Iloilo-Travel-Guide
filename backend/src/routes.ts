// PUJ route data. To update routes, replace backend/data/routes.json (same format).
import routesData from "../data/routes.json";

const POLYLINE_PRECISION = 1_000_000;

function decodeSingleValue(encoded: string, startIndex: number) {
  let result = 0;
  let shift = 0;
  let index = startIndex;

  while (true) {
    // A truncated polyline would otherwise read NaN forever and hang the page
    if (index >= encoded.length) {
      throw new Error("Truncated polyline");
    }
    const byte = encoded.charCodeAt(index++) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;

    if (byte < 0x20) {
      break;
    }
  }

  return {
    value: (result & 1) ? ~(result >> 1) : (result >> 1),
    nextIndex: index,
  };
}

export function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    const latResult = decodeSingleValue(encoded, index);
    lat += latResult.value;
    index = latResult.nextIndex;

    const lngResult = decodeSingleValue(encoded, index);
    lng += lngResult.value;
    index = lngResult.nextIndex;

    coordinates.push([lat / POLYLINE_PRECISION, lng / POLYLINE_PRECISION]);
  }

  return coordinates;
}

export interface RouteData {
  id: string;
  routeNumber: string;
  routeName: string;
  routeColor: string;
  routeDetails: string;
  availableFrom: string;
  availableTo: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  points: {
    polylineGoingTo?: string;
    goingTo?: Array<{
      id: string;
      sequence: number;
      address: string;
      point: [number, number];
    }>;
    polylineGoingBack?: string;
    returning?: Array<{
      id: string;
      sequence: number;
      address: string;
      point: [number, number];
    }>;
  };
}

export interface DecodedRoute {
  id: string;
  routeNumber: string;
  routeName: string;
  routeColor: string;
  vehicleTypeName: string;
  goingToCoordinates: [number, number][];
  returningCoordinates: [number, number][];
  stops: Array<{
    id: string;
    sequence: number;
    address: string;
    point: [number, number];
  }>;
}

function isRoutesPayload(data: unknown): data is { ok: boolean; data: { routes: RouteData[] } } {
  if (!data || typeof data !== "object") return false;

  const payload = data as { ok?: unknown; data?: { routes?: unknown } };
  return Boolean(payload.ok) && Array.isArray(payload.data?.routes);
}

function decodeRoute(route: RouteData): DecodedRoute | null {
  try {
    const goingToCoordinates = route.points.polylineGoingTo
      ? decodePolyline(route.points.polylineGoingTo)
      : [];

    let returningCoordinates = route.points.polylineGoingBack
      ? decodePolyline(route.points.polylineGoingBack)
      : [];

    if (returningCoordinates.length === 0 && goingToCoordinates.length > 0) {
      returningCoordinates = [...goingToCoordinates].reverse();
    }

    return {
      id: route.id,
      routeNumber: route.routeNumber,
      routeName: route.routeName,
      routeColor: route.routeColor,
      vehicleTypeName: route.vehicleTypeName,
      goingToCoordinates,
      returningCoordinates,
      stops: route.points.goingTo || [],
    };
  } catch (error) {
    console.error("Error decoding route:", route.routeNumber, route.routeName, error);
    return null;
  }
}

function decodeRoutesPayload(data: unknown): DecodedRoute[] {
  if (!isRoutesPayload(data)) {
    console.error("Invalid route data format");
    return [];
  }

  return data.data.routes
    .map(decodeRoute)
    .filter((route): route is DecodedRoute => route !== null);
}

let cachedRoutes: DecodedRoute[] | null = null;

// Decoding ~27 polylines is not free, so do it once per page load and share the result
export async function loadAndDecodeRoutes(): Promise<DecodedRoute[]> {
  if (!cachedRoutes) {
    cachedRoutes = decodeRoutesPayload(routesData);
  }
  return cachedRoutes;
}
