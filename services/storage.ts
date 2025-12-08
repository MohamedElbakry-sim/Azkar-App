
import { ProgressState } from '../types';

const FAVORITES_KEY = 'nour_favorites_v1';
const PROGRESS_KEY = 'nour_progress_v1';
const TASBEEH_KEY = 'nour_tasbeeh_count';
const CUSTOM_TARGETS_KEY = 'nour_custom_targets_v1';
const HAPTIC_KEY = 'nour_haptic_enabled';
const SHOW_TRANSLATION_KEY = 'nour_show_translation';
const SHOW_TRANSLITERATION_KEY = 'nour_show_transliteration';
const DND_KEY = 'nour_dnd_settings';
const TUTORIAL_KEY = 'nour_tutorial_seen_v1';
const REMINDERS_KEY = 'nour_reminders_v1';
const FONT_SIZE_KEY = 'nour_font_size_v1';

// --- Do Not Disturb Types ---
export interface DNDSettings {
  enabled: boolean;
  endTime: number | null; // Timestamp in ms. null means indefinite if enabled.
}

// --- Reminder Types ---
export interface Reminder {
  id: string;
  label: string;
  time: string; // 24h format "HH:mm"
  enabled: boolean;
}

// --- Font Size Types ---
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

export const getFavorites = (): number[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const toggleFavoriteStorage = (id: number): number[] => {
  const favs = getFavorites();
  const index = favs.indexOf(id);
  let newFavs;
  if (index >= 0) {
    newFavs = favs.filter((f) => f !== id);
  } else {
    newFavs = [...favs, id];
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
  return newFavs;
};

export const getTodayKey = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getProgress = (): ProgressState => {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const saveProgress = (dhikrId: number, count: number) => {
  const progress = getProgress();
  const today = getTodayKey();
  
  if (!progress[today]) {
    progress[today] = {};
  }
  
  progress[today][dhikrId] = count;
  
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const markAsSkipped = (dhikrId: number) => {
  // Use -1 to represent skipped
  saveProgress(dhikrId, -1);
};

export const getTasbeehCount = (): number => {
  try {
    return parseInt(localStorage.getItem(TASBEEH_KEY) || '0', 10);
  } catch {
    return 0;
  }
};

export const saveTasbeehCount = (count: number) => {
  localStorage.setItem(TASBEEH_KEY, count.toString());
};

export const getCustomTargets = (): {[key: number]: number} => {
  try {
    const stored = localStorage.getItem(CUSTOM_TARGETS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const saveCustomTarget = (id: number, target: number) => {
  const targets = getCustomTargets();
  targets[id] = target;
  localStorage.setItem(CUSTOM_TARGETS_KEY, JSON.stringify(targets));
};

export const getHapticEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(HAPTIC_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
};

export const saveHapticEnabled = (enabled: boolean) => {
  localStorage.setItem(HAPTIC_KEY, String(enabled));
};

// --- Do Not Disturb Logic ---

export const getDNDSettings = (): DNDSettings => {
  try {
    const stored = localStorage.getItem(DND_KEY);
    if (!stored) return { enabled: false, endTime: null };
    
    const settings: DNDSettings = JSON.parse(stored);
    
    // Check for expiration
    if (settings.enabled && settings.endTime && Date.now() > settings.endTime) {
      const expiredSettings = { enabled: false, endTime: null };
      saveDNDSettings(expiredSettings);
      return expiredSettings;
    }
    
    return settings;
  } catch {
    return { enabled: false, endTime: null };
  }
};

export const saveDNDSettings = (settings: DNDSettings) => {
  localStorage.setItem(DND_KEY, JSON.stringify(settings));
};

// Helper to determine if vibration should occur
// Returns false if DND is active OR if Haptics are disabled globally
export const shouldTriggerHaptics = (): boolean => {
  const dnd = getDNDSettings();
  if (dnd.enabled) return false;
  return getHapticEnabled();
};

export const getShowTranslation = (): boolean => {
  try {
    return localStorage.getItem(SHOW_TRANSLATION_KEY) === 'true';
  } catch {
    return false;
  }
};

export const saveShowTranslation = (enabled: boolean) => {
  localStorage.setItem(SHOW_TRANSLATION_KEY, String(enabled));
};

export const getShowTransliteration = (): boolean => {
  try {
    return localStorage.getItem(SHOW_TRANSLITERATION_KEY) === 'true';
  } catch {
    return false;
  }
};

export const saveShowTransliteration = (enabled: boolean) => {
  localStorage.setItem(SHOW_TRANSLITERATION_KEY, String(enabled));
};

// --- Font Size Logic ---

export const getFontSize = (): FontSize => {
  try {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    return (stored as FontSize) || 'medium';
  } catch {
    return 'medium';
  }
};

export const saveFontSize = (size: FontSize) => {
  localStorage.setItem(FONT_SIZE_KEY, size);
};

// --- Reminders Logic ---

export const getReminders = (): Reminder[] => {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveReminders = (reminders: Reminder[]) => {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

export const addReminder = (reminder: Reminder) => {
  const current = getReminders();
  saveReminders([...current, reminder]);
};

export const updateReminder = (reminder: Reminder) => {
  const current = getReminders();
  const updated = current.map(r => r.id === reminder.id ? reminder : r);
  saveReminders(updated);
};

export const deleteReminder = (id: string) => {
  const current = getReminders();
  const updated = current.filter(r => r.id !== id);
  saveReminders(updated);
};

// --- Statistics Helpers ---

export interface StatsData {
  totalTasbeeh: number;
  totalDhikrCompleted: number;
  currentStreak: number;
  bestStreak: number;
  todayCount: number;
  weeklyCount: number;
}

export const getStats = (): StatsData => {
  const progress = getProgress();
  const today = getTodayKey();
  const dates = Object.keys(progress).sort();
  
  let totalDhikrCompleted = 0;
  let todayCount = 0;
  let weeklyCount = 0;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  dates.forEach(date => {
    const dayData = progress[date];
    const counts = Object.values(dayData);
    const sum = counts.reduce((a, b) => (b > 0 ? a + b : a), 0);
    
    totalDhikrCompleted += sum;

    if (date === today) {
      todayCount = sum;
    }

    if (new Date(date) >= oneWeekAgo) {
      weeklyCount += sum;
    }
  });

  let streak = 0;
  const todayDate = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(todayDate.getDate() - i);
    const key = d.toISOString().split('T')[0];
    
    if (progress[key] && Object.keys(progress[key]).length > 0) {
      streak++;
    } else if (i === 0 && (!progress[key] || Object.keys(progress[key]).length === 0)) {
      continue; 
    } else {
      break;
    }
  }

  return {
    totalTasbeeh: getTasbeehCount(),
    totalDhikrCompleted,
    currentStreak: streak,
    bestStreak: streak,
    todayCount,
    weeklyCount
  };
};

export const getHeatmapData = () => {
  const progress = getProgress();
  const data: { [date: string]: number } = {};
  
  Object.keys(progress).forEach(date => {
    const dayData = progress[date];
    const total = Object.values(dayData).reduce((a, b) => (b > 0 ? a + b : a), 0);
    if (total > 0) {
      data[date] = total;
    }
  });
  
  return data;
};

// --- Tutorial ---
export const hasSeenTutorial = (): boolean => {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === 'true';
  } catch {
    return false;
  }
};

export const markTutorialAsSeen = () => {
  localStorage.setItem(TUTORIAL_KEY, 'true');
};
