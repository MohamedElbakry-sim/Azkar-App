
import { SurahData, Ayah, SearchResult, Reciter, Word } from '../types';

const QURAN_CACHE_PREFIX = 'nour_quran_surah_full_v3_';
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
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ar.muyassar,quran-wordbyword-2`);
    if (!response.ok) throw new Error(`Failed to fetch Surah ${surahNumber}`);
    
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
        // Already bookmarked, maybe update timestamp or remove? 
        // For toggling behavior in UI, we usually want to add if not exists.
        // But here we update timestamp to move to top.
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
