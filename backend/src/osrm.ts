const OSRM_BASE_URL = "https://router.project-osrm.org";

export interface OSRMCoordinate {
  lat: number;
  lng: number;
}

export interface OSRMStep {
  distance: number; // meters
  duration: number; // seconds
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number]; // [lng, lat]
    bearing_before: number;
    bearing_after: number;
  };
  geometry: string; // encoded polyline
}

export interface OSRMLeg {
  distance: number; // meters
  duration: number; // seconds
  summary: string;
  steps: OSRMStep[];
}

export interface OSRMRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: string; // encoded polyline
  legs: OSRMLeg[];
}

export interface OSRMResponse {
  code: string;
  routes: OSRMRoute[];
  waypoints: Array<{
    name: string;
    location: [number, number]; // [lng, lat]
    hint: string;
  }>;
}

export interface DirectionsResult {
  success: boolean;
  error?: string;
  route?: {
    coordinates: [number, number][]; // [lat, lng] pairs
    distance: number; // meters
    duration: number; // seconds
    steps: Array<{
      instruction: string;
      distance: number;
      duration: number;
      coordinates: [number, number][]; // [lat, lng] pairs
    }>;
  };
}

/**
 * Decode a polyline string into coordinates
 * OSRM uses polyline6 (precision 6), so we divide by 1e6
 */
function decodePolyline(encoded: string, precision = 6): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    // Decode latitude
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    // Decode longitude
    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

/**
 * Generate a human-readable instruction from OSRM maneuver data
 */
function getInstructionText(step: OSRMStep): string {
  const { type, modifier } = step.maneuver;
  const streetName = step.name || "the road";

  const directions: Record<string, Record<string, string>> = {
    turn: {
      left: `Turn left onto ${streetName}`,
      right: `Turn right onto ${streetName}`,
      "slight left": `Turn slightly left onto ${streetName}`,
      "slight right": `Turn slightly right onto ${streetName}`,
      "sharp left": `Turn sharply left onto ${streetName}`,
      "sharp right": `Turn sharply right onto ${streetName}`,
      uturn: `Make a U-turn onto ${streetName}`,
      straight: `Continue straight onto ${streetName}`,
    },
    "new name": {
      default: `Continue onto ${streetName}`,
    },
    depart: {
      default: `Head toward ${streetName}`,
    },
    arrive: {
      default: "You have arrived at your destination",
    },
    merge: {
      default: `Merge onto ${streetName}`,
    },
    "on ramp": {
      default: `Take the ramp onto ${streetName}`,
    },
    "off ramp": {
      default: `Take the exit onto ${streetName}`,
    },
    fork: {
      left: `Keep left onto ${streetName}`,
      right: `Keep right onto ${streetName}`,
      "slight left": `Keep slightly left onto ${streetName}`,
      "slight right": `Keep slightly right onto ${streetName}`,
      default: `Continue onto ${streetName}`,
    },
    "end of road": {
      left: `Turn left onto ${streetName}`,
      right: `Turn right onto ${streetName}`,
      default: `Continue onto ${streetName}`,
    },
    continue: {
      default: `Continue on ${streetName}`,
    },
    roundabout: {
      default: `Enter the roundabout and take the exit onto ${streetName}`,
    },
    rotary: {
      default: `Enter the rotary and take the exit onto ${streetName}`,
    },
    "roundabout turn": {
      left: `At the roundabout, turn left onto ${streetName}`,
      right: `At the roundabout, turn right onto ${streetName}`,
      default: `At the roundabout, continue onto ${streetName}`,
    },
    notification: {
      default: `Continue on ${streetName}`,
    },
  };

  if (directions[type]) {
    if (modifier && directions[type][modifier]) {
      return directions[type][modifier];
    }
    return directions[type].default || `Continue on ${streetName}`;
  }

  return `Continue on ${streetName}`;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Get driving directions between two points using OSRM
 */
export async function getDirections(
  from: OSRMCoordinate,
  to: OSRMCoordinate
): Promise<DirectionsResult> {
  try {
    // OSRM expects coordinates as lng,lat
    const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=polyline6&steps=true`;

    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        success: false,
        error: `OSRM request failed with status ${response.status}`,
      };
    }

    const data: OSRMResponse = await response.json();

    if (data.code !== "Ok" || !data.routes.length) {
      return {
        success: false,
        error: data.code === "NoRoute" 
          ? "No route found between these locations"
          : `Routing error: ${data.code}`,
      };
    }

    const route = data.routes[0];
    const routeCoordinates = decodePolyline(route.geometry);

    // Process steps from all legs
    const steps = route.legs.flatMap((leg) =>
      leg.steps.map((step) => ({
        instruction: getInstructionText(step),
        distance: step.distance,
        duration: step.duration,
        coordinates: decodePolyline(step.geometry),
      }))
    );

    return {
      success: true,
      route: {
        coordinates: routeCoordinates,
        distance: route.distance,
        duration: route.duration,
        steps,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get route between multiple waypoints
 */
export async function getRouteWithWaypoints(
  waypoints: OSRMCoordinate[]
): Promise<DirectionsResult> {
  if (waypoints.length < 2) {
    return {
      success: false,
      error: "At least two waypoints are required",
    };
  }

  try {
    const coordinates = waypoints
      .map((wp) => `${wp.lng},${wp.lat}`)
      .join(";");
    
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=polyline6&steps=true`;

    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        success: false,
        error: `OSRM request failed with status ${response.status}`,
      };
    }

    const data: OSRMResponse = await response.json();

    if (data.code !== "Ok" || !data.routes.length) {
      return {
        success: false,
        error: data.code === "NoRoute"
          ? "No route found between these locations"
          : `Routing error: ${data.code}`,
      };
    }

    const route = data.routes[0];
    const routeCoordinates = decodePolyline(route.geometry);

    const steps = route.legs.flatMap((leg) =>
      leg.steps.map((step) => ({
        instruction: getInstructionText(step),
        distance: step.distance,
        duration: step.duration,
        coordinates: decodePolyline(step.geometry),
      }))
    );

    return {
      success: true,
      route: {
        coordinates: routeCoordinates,
        distance: route.distance,
        duration: route.duration,
        steps,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
