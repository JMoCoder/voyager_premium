
import { LocationSuggestion } from '../types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const PHOTON_URL = 'https://photon.komoot.io/api/';

export const searchLocations = async (query: string, lang: 'en' | 'zh'): Promise<LocationSuggestion[]> => {
  if (!query || query.length < 2) return [];

  // 1. Try Nominatim (Better language support/accuracy)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s Timeout

    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '10',
      'accept-language': lang === 'zh' ? 'zh-CN,zh;q=0.9,en;q=0.8' : 'en-US,en;q=0.9',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) return data;
    }
  } catch (error) {
    // Silent fail for fallback
  }

  // 2. Fallback: Photon (Fast, reliable, less strict)
  try {
    // Photon queries work best with 'en', 'de', 'fr'. We use 'en' but pass the original query (which may be Chinese).
    // It usually handles Chinese names via OSM name tags correctly.
    const params = new URLSearchParams({
        q: query,
        limit: '10',
        lang: 'en' 
    });

    const response = await fetch(`${PHOTON_URL}?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.features) return [];

    // Map GeoJSON features to our LocationSuggestion format
    return data.features.map((f: any) => {
        const p = f.properties;
        // Construct a decent display name from available properties
        const displayNameParts = [p.name, p.city, p.state, p.country].filter(Boolean);
        // Deduplicate parts (e.g. if city name is same as name)
        const uniqueParts = [...new Set(displayNameParts)];
        
        return {
            place_id: p.osm_id || Math.random(),
            lat: f.geometry.coordinates[1].toString(),
            lon: f.geometry.coordinates[0].toString(),
            display_name: uniqueParts.join(', '),
            address: {
                city: p.city || p.name,
                state: p.state,
                country: p.country,
                town: p.town,
                village: p.village,
                county: p.county
            }
        };
    });

  } catch (error) {
    console.error("All geocoding providers failed", error);
    return [];
  }
};
