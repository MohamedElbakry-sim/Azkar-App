
import { RadioStation } from '../types';

const API_URL = 'https://mp3quran.net/api/v3/radios?language=ar';

const CUSTOM_STATIONS: RadioStation[] = [
  {
    id: 10001, 
    name: 'محمد رفعت',
    // Switched to primary domain, often more reliable than backup
    url: 'https://qurango.net/radio/mohammad_refaat'
  }
];

export const getRadioStations = async (): Promise<RadioStation[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      // Fallback if API fails
      return CUSTOM_STATIONS;
    }
    const data = await response.json();
    
    // Map API response to our interface
    // The API usually returns object { radios: [...] }
    const radios = data.radios || [];
    
    const apiStations = radios
      .filter((radio: any) => radio.url && radio.url.trim() !== '') // Filter out empty URLs
      .map((radio: any) => ({
        id: radio.id,
        name: radio.name,
        url: radio.url,
        img: radio.img // Some endpoints provide images, otherwise undefined
      }));

    // Strategy: Prefer API stations if they exist to ensure fresh URLs, 
    // but inject Custom stations if not found in API.
    
    // 1. Identify custom station names
    const customNames = CUSTOM_STATIONS.map(c => c.name);
    
    // 2. Filter API stations that are NOT in custom list (to avoid duplicates if we want to enforce custom)
    const filteredApiStations = apiStations.filter((s: RadioStation) => 
        !customNames.includes(s.name)
    );

    // Combine and sort alphabetically to mix custom stations naturally
    const allStations = [...CUSTOM_STATIONS, ...filteredApiStations];
    
    return allStations.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  } catch (error) {
    console.error('Radio Service Error:', error);
    return CUSTOM_STATIONS;
  }
};
