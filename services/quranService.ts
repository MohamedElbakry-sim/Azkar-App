import { Ayah, SurahDetail, SearchResult } from '../types';
import * as storage from './storage';

export type { Ayah, SurahDetail, SearchResult };

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  surahName?: string;
  pageNumber: number;
  timestamp: number;
}

const BASE_URL = 'https://api.alquran.cloud/v1';

export const RECITERS = [
  { id: 'ar.alafasy', name: 'مشاري العفاسي' },
  { id: 'ar.abdurrahmaansudais', name: 'عبد الرحمن السديس' },
  { id: 'ar.husary', name: 'محمود خليل الحصري' },
  { id: 'ar.minshawi', name: 'محمد صديق المنشاوي' },
  { id: 'ar.saoodshuraym', name: 'سعود الشريم' },
  { id: 'ar.hudaifi', name: 'علي الحذيفي' },
  { id: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد' }
];

/**
 * Enhanced fetch with timeout
 */
const fetchWithTimeout = async (url: string, options: any = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

export const getSurah = async (surahId: number): Promise<SurahDetail> => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/surah/${surahId}/editions/quran-uthmani,en.sahih,ar.muyassar`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) throw new Error('Invalid API response structure');
    
    const editions = data.data;
    const uthmani = editions[0];
    const translation = editions[1];
    const tafsir = editions[2];

    const ayahs: Ayah[] = uthmani.ayahs.map((ayah: any, index: number) => ({
      number: ayah.number,
      text: ayah.text,
      numberInSurah: ayah.numberInSurah,
      juz: ayah.juz,
      page: ayah.page,
      translation: translation?.ayahs[index]?.text || '',
      tafsir: tafsir?.ayahs[index]?.text || '',
      audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`,
      surah: {
        number: uthmani.number,
        name: uthmani.name,
        englishName: uthmani.englishName,
        englishNameTranslation: uthmani.englishNameTranslation,
        revelationType: uthmani.revelationType,
        numberOfAyahs: uthmani.numberOfAyahs
      }
    }));

    return {
      number: uthmani.number,
      name: uthmani.name,
      englishName: uthmani.englishName,
      revelationType: uthmani.revelationType,
      numberOfAyahs: uthmani.numberOfAyahs,
      ayahs
    };
  } catch (error) {
    console.error("getSurah failed:", error);
    throw new Error('تعذر تحميل بيانات السورة. يرجى التأكد من اتصالك بالإنترنت.');
  }
};

export const getPageContent = async (pageNumber: number): Promise<Ayah[]> => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/page/${pageNumber}/quran-uthmani`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    return data.data.ayahs;
  } catch (error) {
    console.error("getPageContent failed:", error);
    throw new Error('تعذر تحميل محتوى الصفحة.');
  }
};

export const searchQuran = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/search/${encodeURIComponent(query)}/all/ar`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.data || !data.data.matches) return [];
    return data.data.matches.map((match: any) => ({
      surah: match.surah,
      ayah: {
        number: match.number,
        text: match.text,
        numberInSurah: match.numberInSurah
      }
    }));
  } catch (error) {
    console.error("searchQuran failed:", error);
    return [];
  }
};

export const getBookmarks = () => {
    return storage.getQuranBookmarks() as unknown as Bookmark[];
};

export const getLastRead = () => {
    return storage.getQuranLastRead() as unknown as Bookmark | null;
};

export const addBookmark = (bookmark: Bookmark) => {
    storage.saveQuranBookmark({
        surahNumber: bookmark.surahNumber,
        ayahNumber: bookmark.ayahNumber,
        surahName: bookmark.surahName || '',
        timestamp: bookmark.timestamp,
        pageNumber: bookmark.pageNumber
    });
    return getBookmarks();
};

export const removeBookmark = (surahNumber: number, ayahNumber: number) => {
    storage.removeQuranBookmark(surahNumber, ayahNumber);
    return getBookmarks();
};

export const saveLastRead = (bookmark: Bookmark) => {
    storage.saveQuranLastRead({
        surahNumber: bookmark.surahNumber,
        ayahNumber: bookmark.ayahNumber,
        surahName: bookmark.surahName || '',
        timestamp: bookmark.timestamp,
        pageNumber: bookmark.pageNumber
    });
};

export const searchGlobal = async (query: string): Promise<any[]> => {
    try {
        const results = await searchQuran(query);
        return results.map(r => ({
            ...r.ayah,
            surah: r.surah,
            text: r.ayah.text
        }));
    } catch {
        return [];
    }
};

export const searchSurah = async (query: string, surahId: number): Promise<any[]> => {
    const all = await searchGlobal(query);
    return all.filter(r => r.surah.number === surahId);
};
