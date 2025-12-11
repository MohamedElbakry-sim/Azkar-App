import { SurahData, Ayah, SearchResult } from '../types';

const QURAN_CACHE_PREFIX = 'nour_quran_surah_full_v1_';
const BOOKMARK_KEY = 'nour_quran_bookmark_v1';

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number; // The verse number within the surah
  scrollPosition?: number; // Optional: pixel offset
  timestamp: number;
}

/**
 * Fetches Surah data including Translation (en.sahih) and Tafsir (ar.muyassar).
 * Tries LocalStorage first, then API.
 */
export const getSurah = async (surahNumber: number): Promise<SurahData> => {
  const cacheKey = `${QURAN_CACHE_PREFIX}${surahNumber}`;

  // 1. Try Cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Failed to read Quran cache', e);
  }

  // 2. Fetch from API (Multi-edition)
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ar.muyassar`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Surah ${surahNumber}`);
    }
    const json = await response.json();
    
    // API returns data array: [0]: Uthmani, [1]: Sahih (Translation), [2]: Muyassar (Tafsir)
    // We need to map these based on identifier to be safe
    const editions = json.data;
    const uthmaniData = editions.find((e: any) => e.edition.identifier === 'quran-uthmani');
    const translationData = editions.find((e: any) => e.edition.identifier === 'en.sahih');
    const tafsirData = editions.find((e: any) => e.edition.identifier === 'ar.muyassar');

    if (!uthmaniData) throw new Error("Base Quran text missing");

    // Merge Data
    const mergedAyahs: Ayah[] = uthmaniData.ayahs.map((ayah: any, index: number) => ({
        ...ayah,
        translation: translationData?.ayahs[index]?.text || '',
        tafsir: tafsirData?.ayahs[index]?.text || ''
    }));

    const finalData: SurahData = {
        ...uthmaniData,
        ayahs: mergedAyahs
    };

    // 3. Save to Cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify(finalData));
    } catch (e) {
      // Storage might be full, handle gracefully
      console.warn('LocalStorage full, could not cache Surah', e);
    }

    return finalData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Searches the entire Quran using the API.
 * Uses 'quran-simple-clean' edition to allow matching text without diacritics.
 * @param query The search term
 * @returns Array of matches
 */
export const searchGlobal = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 2) return [];
  
  try {
    // We search in 'quran-simple-clean' because users typically search without tashkeel.
    // This increases the hit rate significantly.
    const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/quran-simple-clean`);
    
    if (!response.ok) {
        // API might return 404 or 400 if nothing found or invalid query
        return [];
    }
    
    const json = await response.json();
    return json.data?.matches || [];
  } catch (e) {
    console.warn("Global search error:", e);
    return [];
  }
};

/**
 * Saves the current reading position.
 */
export const saveBookmark = (bookmark: Bookmark) => {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmark));
};

/**
 * Retrieves the saved reading position.
 */
export const getBookmark = (): Bookmark | null => {
  try {
    const stored = localStorage.getItem(BOOKMARK_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};