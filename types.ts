
export interface Dhikr {
  id: number;
  category: CategoryId;
  text: string;
  count: number;
  source?: string; // e.g., Bukhari
  benefit?: string; // Fadilah
  transliteration?: string;
  translation?: string;
}

export type CategoryId = 'sabah' | 'masaa' | 'sleep' | 'waking' | 'prayer' | 'quran';

export interface Category {
  id: CategoryId;
  title: string;
  icon: string;
  description: string;
  theme: string; // e.g., 'orange', 'blue'
  imageUrl?: string; // URL for image-based icon (supports lazy loading)
}

export interface ProgressState {
  [dateKey: string]: {
    [dhikrId: number]: number; // current count
  };
}

// --- Daily Wisdom Types ---

export interface QuranVerse {
  text: string;
  surah: string;
  ayahNumber: number;
  tafsir?: string; // or translation
}

export interface Hadith {
  text: string;
  source: string; // Book & Number
  grade: string;
  explanation?: string;
}

export interface DailyContent {
  date: string; // YYYY-MM-DD
  verse: QuranVerse;
  hadith: Hadith;
}

// --- Sahaba Types ---
export interface Sahabi {
  id: number;
  arabic_name: string;
  name: string; // English Name
  description: string;
  notable_facts: string[];
}

// --- 99 Names Types ---
export interface NameOfAllah {
  id: number;
  arabic: string;
  transliteration: string;
  meaning: string;
}