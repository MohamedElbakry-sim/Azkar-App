
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

export interface MissedPrayers {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
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

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Word {
  text: string;
  translation: string;
  transliteration?: string;
}

export interface Ayah {
  number: number; // Global number
  text: string;
  translation?: string;
  tafsir?: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | any;
  audio?: string; // URL for specific ayah audio
  words?: Word[]; // Breakdown for word-by-word
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

export interface SearchResult {
  number: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
  };
  numberInSurah: number;
}

export interface Reciter {
  id: string; // EveryAyah identifier
  name: string;
  subpath?: string; // e.g. "Alafasy_128kbps"
}

export type ReadingMode = 'text' | 'page';

// --- Radio Types ---

export interface RadioStation {
  id: number;
  name: string;
  url: string;
  img?: string;
}

// --- Habit Types ---

export type HabitType = 'boolean' | 'numeric' | 'timer';
export type HabitCategory = 'spiritual' | 'health' | 'personal' | 'sunnah';
export type SystemHabitType = 'none' | 'salah_fajr' | 'salah_dhuhr' | 'salah_asr' | 'salah_maghrib' | 'salah_isha' | 'quran_reading' | 'azkar_sabah' | 'azkar_masaa';

export interface Habit {
  id: string;
  title: string;
  type: HabitType;
  category: HabitCategory;
  systemType: SystemHabitType;
  goal: number;
  unit: string;
  color: string;
  icon: string;
  frequency: number[];
  streak: number;
  bestStreak: number;
  totalCompletions: number;
  archived: boolean;
  reminderTime?: string;
}

export interface HabitLog {
  [dateKey: string]: {
    [habitId: string]: number;
  };
}

export interface HabitUserStats {
  xp: number;
  level: number;
  totalCompletions: number;
  badges: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: HabitUserStats) => boolean;
  unlocked: boolean;
}