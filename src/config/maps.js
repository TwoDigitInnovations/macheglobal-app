// Configuration for Google Maps API
// TODO: Move API key to environment variables in production
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: 'AIzaSyCre5Sym7PzqWQjHoNz7A3Z335oqtkUa9k', // Should be moved to .env file
  DIRECTIONS_API_URL: 'https://maps.googleapis.com/maps/api/directions/json',
  DEFAULT_REGION: {
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
};

// Helper function to construct directions API URL
export const buildDirectionsURL = (origin, destination, waypoints, apiKey = GOOGLE_MAPS_CONFIG.API_KEY) => {
  const waypointsParam = waypoints.length > 0 ? `&waypoints=optimize:true|${waypoints}` : '';
  return `${GOOGLE_MAPS_CONFIG.DIRECTIONS_API_URL}?origin=${origin}&destination=${destination}${waypointsParam}&key=${apiKey}`;
};
