
export interface Dhikr {
  id: number;
  category: CategoryId;
  text: string;
  count: number;
  source?: string;
  benefit?: string;
  transliteration?: string;
  translation?: string;
}

export type CategoryId = 'sabah' | 'masaa' | 'sleep' | 'waking' | 'prayer';

export interface Category {
  id: CategoryId;
  title: string;
  icon: string;
  description: string;
  theme: string;
  imageUrl?: string;
}

export interface ProgressState {
  [dateKey: string]: {
    [dhikrId: number]: number;
  };
}

export interface QuranVerse {
  text: string;
  surah: string;
  ayahNumber: number;
  tafsir?: string;
}

export interface Hadith {
  text: string;
  source: string;
  grade: string;
  explanation?: string;
}

export interface DailyContent {
  date: string;
  verse: QuranVerse;
  hadith: Hadith;
}

export interface Sahabi {
  id: number;
  arabic_name: string;
  name: string;
  description: string;
  notable_facts: string[];
}

export interface NameOfAllah {
  id: number;
  arabic: string;
  transliteration: string;
  meaning: string;
}

export interface SituationalDua {
  text: string;
  source?: string;
}

export interface DuaCategory {
  id: string;
  title: string;
  icon: any;
  color: string;
  items: SituationalDua[];
}

// --- Quran Types ---

export interface Ayah {
  number: number; // Global number (1-6236)
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  translation?: string;
  tafsir?: string;
  audio?: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
  };
}

export interface SurahDetail {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

export interface SearchResult {
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  ayah: {
    number: number;
    text: string;
    numberInSurah: number;
  };
}

// --- Radio Types ---

export interface RadioStation {
  id: number;
  name: string;
  url: string;
  img?: string;
}
