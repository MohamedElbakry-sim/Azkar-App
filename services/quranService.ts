
import { SurahData, Ayah, SearchResult, Reciter, Word } from '../types';

const QURAN_CACHE_PREFIX = 'nour_quran_surah_full_v3_'; // Version bumped
const BOOKMARK_KEY = 'nour_quran_bookmark_v1';
const PREFERRED_RECITER_KEY = 'nour_preferred_reciter_v1';

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  pageNumber?: number; // Added page bookmarking support
  timestamp: number;
  note?: string; // Added notes
}

export const DEFAULT_RECITER_ID = 'alafasy';

// Updated list: Removed Mujawwad and unstable streams.
// Only kept highly reliable 64kbps/128kbps Murattal streams.
export const RECITERS: Reciter[] = [
  { id: 'alafasy', name: 'مشاري العفاسي', subpath: 'Alafasy_128kbps' },
  { id: 'husary', name: 'محمود خليل الحصري', subpath: 'Husary_128kbps' },
  { id: 'sudais', name: 'عبد الرحمن السديس', subpath: 'Abdurrahmaan_As-Sudais_64kbps' },
  { id: 'shuraym', name: 'سعود الشريم', subpath: 'Saood_ash-Shuraym_128kbps' },
  { id: 'maher', name: 'ماهر المعيقلي', subpath: 'MaherAlMuaiqly_64kbps' },
  { id: 'ghamadi', name: 'سعد الغامدي', subpath: 'Ghamadi_40kbps' },
];

/**
 * Fetches Surah data including Uthmani text, Translation, Tafsir, and Word-by-Word.
 */
export const getSurah = async (surahNumber: number): Promise<SurahData> => {
  const cacheKey = `${QURAN_CACHE_PREFIX}${surahNumber}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Failed to read Quran cache', e);
  }

  try {
    // Fetch Uthmani text, Translation, Tafsir, and Word-by-Word
    // Adding 'quran-wordbyword' for Arabic breakdown and 'en.transliteration' for reading help
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ar.muyassar,quran-wordbyword-2`);
    if (!response.ok) throw new Error(`Failed to fetch Surah ${surahNumber}`);
    
    const json = await response.json();
    const editions = json.data;
    
    const uthmaniData = editions.find((e: any) => e.edition.identifier === 'quran-uthmani');
    const translationData = editions.find((e: any) => e.edition.identifier === 'en.sahih');
    const tafsirData = editions.find((e: any) => e.edition.identifier === 'ar.muyassar');
    const wordByWordData = editions.find((e: any) => e.edition.identifier === 'quran-wordbyword-2');

    if (!uthmaniData) throw new Error("Base Quran text missing");

    const mergedAyahs: Ayah[] = uthmaniData.ayahs.map((ayah: any, index: number) => {
        // Parse words from quran-wordbyword-2 (format often space separated or needs custom parsing depending on API version)
        const words: Word[] = ayah.text.split(' ').map((w: string) => ({
            text: w,
            translation: '', // Placeholder as getting exact word mapping from this specific endpoint is complex
            transliteration: ''
        }));

        return {
            ...ayah,
            translation: translationData?.ayahs[index]?.text || '',
            tafsir: tafsirData?.ayahs[index]?.text || '',
            words: words
        };
    });

    const finalData: SurahData = {
        ...uthmaniData,
        ayahs: mergedAyahs
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(finalData));
    } catch (e) {
      console.warn('LocalStorage full', e);
    }

    return finalData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Fetches specific Juz data.
 */
export const getJuz = async (juzNumber: number) => {
    try {
        const response = await fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/quran-uthmani`);
        if (!response.ok) throw new Error("Juz fetch failed");
        return await response.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

export const searchGlobal = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 2) return [];
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/quran-simple-clean`);
    if (!response.ok) return [];
    const json = await response.json();
    return json.data?.matches || [];
  } catch (e) {
    return [];
  }
};

export const saveBookmark = (bookmark: Bookmark) => {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmark));
};

export const getBookmark = (): Bookmark | null => {
  try {
    const stored = localStorage.getItem(BOOKMARK_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const getPreferredReciter = (): string => {
    return localStorage.getItem(PREFERRED_RECITER_KEY) || DEFAULT_RECITER_ID;
};

export const savePreferredReciter = (id: string) => {
    localStorage.setItem(PREFERRED_RECITER_KEY, id);
};

// Helper to get Page Image URL
export const getPageUrl = (pageNumber: number) => {
    // static.quran.com requires 3-digit padding (e.g. 001.png)
    const paddedPage = pageNumber.toString().padStart(3, '0');
    return `https://static.quran.com/images/v4/pages/${paddedPage}.png`;
};
