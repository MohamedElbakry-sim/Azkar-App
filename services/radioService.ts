import { RadioStation } from '../types';

const API_URL = 'https://mp3quran.net/api/v3/radios?language=ar';

const CUSTOM_STATIONS: RadioStation[] = [
  {
    id: 10001, 
    name: 'محمد رفعت',
    url: 'https://qurango.net/radio/mohammad_refaat'
  }
];

export const getRadioStations = async (): Promise<RadioStation[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return CUSTOM_STATIONS;
    }
    const data = await response.json();
    
    const radios = data.radios || [];
    
    const apiStations = radios
      .filter((radio: any) => radio.url && radio.url.trim() !== '')
      .map((radio: any) => ({
        id: radio.id,
        name: radio.name,
        url: radio.url,
        img: radio.img
      }));

    const customNames = CUSTOM_STATIONS.map(c => c.name);
    const filteredApiStations = apiStations.filter((s: RadioStation) => 
        !customNames.includes(s.name)
    );

    const allStations = [...CUSTOM_STATIONS, ...filteredApiStations];
    return allStations.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  } catch (error) {
    console.error('Radio Service Error:', error);
    // Return custom stations as fallback on any failure
    return CUSTOM_STATIONS;
  }
};
