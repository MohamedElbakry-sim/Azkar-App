export interface Dhikr {
  id: number;
  category: CategoryId;
  text: string;
  count: number;
  source?: string; // e.g., Bukhari
  benefit?: string; // Fadilah
  audioUrl?: string;
}

export type CategoryId = 'sabah' | 'masaa' | 'sleep' | 'waking' | 'prayer';

export interface Category {
  id: CategoryId;
  title: string;
  icon: string;
  description: string;
  color: string;
}

export interface ProgressState {
  [dateKey: string]: {
    [dhikrId: number]: number; // current count
  };
}