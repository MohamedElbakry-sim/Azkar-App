
import { RadioStation } from '../types';

const API_URL = 'https://mp3quran.net/api/v3/radios?language=ar';

export const getRadioStations = async (): Promise<RadioStation[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch radio stations');
    }
    const data = await response.json();
    
    // Map API response to our interface
    // The API usually returns object { radios: [...] }
    const radios = data.radios || [];
    
    return radios
      .filter((radio: any) => radio.url && radio.url.trim() !== '') // Filter out empty URLs
      .map((radio: any) => ({
        id: radio.id,
        name: radio.name,
        url: radio.url,
        img: radio.img // Some endpoints provide images, otherwise undefined
      }));
  } catch (error) {
    console.error('Radio Service Error:', error);
    return [];
  }
};
