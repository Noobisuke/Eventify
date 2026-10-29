/**
 * Uses OpenStreetMap's free Nominatim API for address search (geocoding)
 * and reverse geocoding. No API key required, but Nominatim's usage policy
 * asks for a descriptive User-Agent and reasonable request rates -
 * fine for an app this size.
 */
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export const geocodingService = {
  /**
   * Search for a place/address by free-text query.
   * Returns an array of { label, latitude, longitude }.
   */
  searchAddress: async (query) => {
    if (!query || query.trim().length < 3) return [];
    const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=6`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) throw new Error('Address search failed');
    const data = await res.json();
    return data.map((item) => ({
      label: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  },

  /**
   * Reverse geocode coordinates into a human-readable address.
   */
  reverseGeocode: async (latitude, longitude) => {
    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) throw new Error('Reverse geocoding failed');
    const data = await res.json();
    return data.display_name || '';
  },
};
