
import { SurahData, Ayah, SearchResult, Reciter, Word } from '../types';

const QURAN_CACHE_PREFIX = 'nour_quran_surah_full_v3_';
const PAGE_CACHE_PREFIX = 'nour_quran_page_uthmani_v1_';
const BOOKMARK_KEY = 'nour_quran_bookmark_v1'; // Now acts as "Saved/Favorite Verses"
const LAST_READ_KEY = 'nour_quran_last_read_v1'; // New key for auto-save
const PREFERRED_RECITER_KEY = 'nour_preferred_reciter_v1';

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  pageNumber?: number;
  timestamp: number;
  note?: string;
}

export const DEFAULT_RECITER_ID = 'alafasy';

export const RECITERS: Reciter[] = [
  { id: 'alafasy', name: 'مشاري العفاسي', subpath: 'Alafasy_128kbps' },
  { id: 'husary', name: 'محمود خليل الحصري', subpath: 'Husary_128kbps' },
  { id: 'sudais', name: 'عبد الرحمن السديس', subpath: 'Abdurrahmaan_As-Sudais_64kbps' },
  { id: 'shuraym', name: 'سعود الشريم', subpath: 'Saood_ash-Shuraym_128kbps' },
  { id: 'maher', name: 'ماهر المعيقلي', subpath: 'MaherAlMuaiqly_64kbps' },
  { id: 'ghamadi', name: 'سعد الغامدي', subpath: 'Ghamadi_40kbps' },
];

/**
 * Helper: Fetch with exponential backoff retry
 */
const fetchWithRetry = async (url: string, retries = 3, backoff = 500): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      
      // If 404 or client error, don't retry, just throw
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      throw new Error(`Server error: ${response.status}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Fetch failed, retrying (${i + 1}/${retries})...`, err);
      await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(1.5, i)));
    }
  }
  throw new Error('Max retries reached');
};

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
    const response = await fetchWithRetry(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ar.muyassar,quran-wordbyword-2`);
    
    const json = await response.json();
    const editions = json.data;
    
    const uthmaniData = editions.find((e: any) => e.edition.identifier === 'quran-uthmani');
    const translationData = editions.find((e: any) => e.edition.identifier === 'en.sahih');
    const tafsirData = editions.find((e: any) => e.edition.identifier === 'ar.muyassar');
    
    if (!uthmaniData) throw new Error("Base Quran text missing");

    const mergedAyahs: Ayah[] = uthmaniData.ayahs.map((ayah: any, index: number) => {
        const words: Word[] = ayah.text.split(' ').map((w: string) => ({
            text: w,
            translation: '',
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
 * Fetches specific page content (Ayahs) for Mushaf View.
 */
export const getPageContent = async (pageNumber: number): Promise<Ayah[]> => {
  const cacheKey = `${PAGE_CACHE_PREFIX}${pageNumber}`;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) { /* ignore */ }

  try {
    // Fetch specifically the Uthmani script for the page
    const response = await fetchWithRetry(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
    
    const json = await response.json();
    const ayahs = json.data.ayahs;

    if (!ayahs || !Array.isArray(ayahs)) throw new Error("Invalid page data");

    try {
      localStorage.setItem(cacheKey, JSON.stringify(ayahs));
    } catch (e) {
      // If quota exceeded, clear old page caches to make room
      console.warn("Storage full, clearing page cache");
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(PAGE_CACHE_PREFIX) && key !== cacheKey) {
          localStorage.removeItem(key);
        }
      });
      try { localStorage.setItem(cacheKey, JSON.stringify(ayahs)); } catch(e2) {}
    }

    return ayahs;
  } catch (e) {
    console.error(`Failed to fetch page ${pageNumber}`, e);
    throw e; // Throw so UI handles error state
  }
};

export const getJuz = async (juzNumber: number) => {
    try {
        const response = await fetchWithRetry(`https://api.alquran.cloud/v1/juz/${juzNumber}/quran-uthmani`);
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

// --- Bookmarking (Favorites) Logic ---

export const getBookmarks = (): Bookmark[] => {
  try {
    const stored = localStorage.getItem(BOOKMARK_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    
    // Migration helper
    if (!Array.isArray(parsed) && parsed.surahNumber) {
        const migrated = [parsed];
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(migrated));
        return migrated;
    }
    
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.timestamp - a.timestamp) : [];
  } catch {
    return [];
  }
};

export const addBookmark = (bookmark: Bookmark) => {
    const bookmarks = getBookmarks();
    const existingIndex = bookmarks.findIndex(b => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber);
    
    let newBookmarks;
    if (existingIndex >= 0) {
        const existing = bookmarks[existingIndex];
        newBookmarks = [
            { ...existing, timestamp: Date.now() }, 
            ...bookmarks.filter((_, i) => i !== existingIndex)
        ];
    } else {
        newBookmarks = [bookmark, ...bookmarks].slice(0, 100);
    }
    
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(newBookmarks));
    return newBookmarks;
};

export const removeBookmark = (surah: number, ayah: number) => {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter(b => !(b.surahNumber === surah && b.ayahNumber === ayah));
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(filtered));
    return filtered;
};

// --- Last Read (Auto-Save) Logic ---

export const saveLastRead = (bookmark: Bookmark) => {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify(bookmark));
};

export const getLastRead = (): Bookmark | null => {
    try {
        const stored = localStorage.getItem(LAST_READ_KEY);
        // Fallback to legacy single bookmark if LAST_READ_KEY is empty
        if (!stored) {
             const legacy = getBookmarks();
             return legacy.length > 0 ? legacy[0] : null;
        }
        return JSON.parse(stored);
    } catch {
        return null;
    }
};

// Legacy compatibility
export const getBookmark = (): Bookmark | null => getLastRead();

export const getPreferredReciter = (): string => {
    return localStorage.getItem(PREFERRED_RECITER_KEY) || DEFAULT_RECITER_ID;
};

export const savePreferredReciter = (id: string) => {
    localStorage.setItem(PREFERRED_RECITER_KEY, id);
};

export const getPageUrl = (pageNumber: number) => {
    const paddedPage = pageNumber.toString().padStart(3, '0');
    return `https://static.quran.com/images/v4/pages/${paddedPage}.png`;
};
