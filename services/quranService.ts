
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { SurahData, Ayah, SearchResult, Reciter, Word } from '../types';

const BOOKMARK_KEY = 'nour_quran_bookmark_v1';
const LAST_READ_KEY = 'nour_quran_last_read_v1';
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
 * Reads a JSON file from the device filesystem.
 * Returns null if file does not exist or plugin is unavailable (web fallback).
 */
const readJsonFile = async (filename: string) => {
  try {
    const content = await Filesystem.readFile({
      path: filename,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    // Capacitor returns data in 'data' field
    return JSON.parse(content.data as string);
  } catch (e) {
    return null;
  }
};

/**
 * Writes a JSON file to the device filesystem.
 */
const writeJsonFile = async (filename: string, data: any) => {
  try {
    await Filesystem.writeFile({
      path: filename,
      data: JSON.stringify(data),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
  } catch (e) {
    console.warn('Filesystem Write Error:', e);
  }
};

/**
 * Fetches Surah data with offline caching strategy.
 */
export const getSurah = async (surahNumber: number): Promise<SurahData> => {
  const filename = `surah_${surahNumber}_v2.json`;

  // 1. Try Disk Cache (Filesystem)
  const diskData = await readJsonFile(filename);
  if (diskData) {
    return diskData;
  }

  // 2. Try Web LocalStorage (Fallback for PWA mode)
  const cacheKey = `nour_quran_surah_${surahNumber}`;
  try {
    const webCached = localStorage.getItem(cacheKey);
    if (webCached) {
      // Migrate to Disk if possible
      const parsed = JSON.parse(webCached);
      writeJsonFile(filename, parsed); 
      return parsed;
    }
  } catch (e) { /* Ignore */ }

  // 3. Fetch from Network
  try {
    // Retry logic handled by simple loop
    let response;
    let attempts = 0;
    while (attempts < 3) {
      try {
        response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ar.muyassar,quran-wordbyword-2`);
        if (response.ok) break;
      } catch (err) {}
      attempts++;
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!response || !response.ok) throw new Error("Network Error");
    
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

    // 4. Save to Disk
    await writeJsonFile(filename, finalData);

    return finalData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Fetches Page content (Ayahs) with offline caching strategy.
 */
export const getPageContent = async (pageNumber: number): Promise<Ayah[]> => {
  const filename = `page_${pageNumber}_v1.json`;

  const diskData = await readJsonFile(filename);
  if (diskData) {
    return diskData;
  }

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/editions/quran-uthmani,en.sahih,ar.muyassar,quran-wordbyword-2`);
    if (!response.ok) throw new Error("Network Error");
    
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

    await writeJsonFile(filename, mergedAyahs);

    return mergedAyahs;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Global Search
 */
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

/**
 * Search within a specific Surah
 */
export const searchSurah = async (query: string, surahNumber: number): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 2) return [];
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/${surahNumber}/quran-simple-clean`);
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
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addBookmark = (bookmark: Bookmark) => {
    const bookmarks = getBookmarks();
    const existingIndex = bookmarks.findIndex(b => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber);
    
    let newBookmarks;
    if (existingIndex >= 0) {
        newBookmarks = [...bookmarks]; // Already exists
    } else {
        newBookmarks = [bookmark, ...bookmarks];
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
