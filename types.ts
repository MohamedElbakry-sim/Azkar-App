
export interface Dhikr {
  id: number;
  category: CategoryId;
  text: string;
  count: number;
  source?: string; // e.g., Bukhari
  benefit?: string; // Fadilah
  audioUrl?: string;
  transliteration?: string;
  translation?: string;
}

export type CategoryId = 'sabah' | 'masaa' | 'sleep' | 'waking' | 'prayer';

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