
import { ProgressState, Dhikr, CategoryId, MissedPrayers } from '../types';

const FAVORITES_KEY = 'nour_favorites_v1';
const PROGRESS_KEY = 'nour_progress_v1'; // Now acts as SESSION storage
const HISTORY_KEY = 'nour_history_v1';   // New PERMANENT storage for stats
const TASBEEH_KEY = 'nour_tasbeeh_count_v1';
const CUSTOM_TARGETS_KEY = 'nour_custom_targets_v1';
const MISSED_PRAYERS_KEY = 'nour_missed_prayers_v1';
const QADA_HISTORY_ID = 9999;
const CUSTOM_DHIKR_KEY = 'nour_custom_dhikr_v1';
const OVERRIDE_DHIKR_KEY = 'nour_override_dhikr_v1';
const DELETED_DEFAULTS_KEY = 'nour_deleted_defaults_v1';
const FONT_SIZE_KEY = 'nour_font_size_v1';
const HIJRI_OFFSET_KEY = 'nour_hijri_offset_v1';
const TUTORIAL_KEY = 'nour_tutorial_seen_v1';
const REMINDERS_KEY = 'nour_reminders_v1';
const NOTIFICATION_SETTINGS_KEY = 'nour_notification_settings_v1';
const HEATMAP_THEME_KEY = 'nour_heatmap_theme_v1';
const ALKAHF_PROMPT_KEY = 'nour_alkahf_prompt_v1';
const DHIKR_ORDER_KEY = 'nour_dhikr_order_v1';
const RADIO_FAVORITES_KEY = 'nour_radio_favorites_v1';

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface Reminder {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  targetPath?: string;
}

export type VibrationType = 'default' | 'short' | 'long' | 'pulse' | 'none';

export interface NotificationSettings {
  soundEnabled: boolean;
  vibrationType: VibrationType;
}

export type HeatmapTheme = 'emerald' | 'blue' | 'flame';

// --- Backup & Restore Logic ---

/**
 * Exports all app data (keys starting with 'nour_') to a JSON string.
 */
export const exportUserData = (): string => {
  const data: Record<string, any> = {};
  const version = "1.0"; // Backup format version
  
  // Iterate over all localStorage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('nour_')) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
            // Try to parse JSON, if fails keep as string
            try {
                data[key] = JSON.parse(value);
            } catch {
                data[key] = value;
            }
        }
      } catch (e) {
        console.warn(`Failed to export key: ${key}`, e);
      }
    }
  }

  const exportObj = {
    meta: {
      appName: "Rayyan",
      version: version,
      timestamp: new Date().toISOString(),
      platform: navigator.userAgent
    },
    data: data
  };

  return JSON.stringify(exportObj, null, 2);
};

/**
 * Imports user data from a JSON string.
 * @param jsonString The raw JSON string from the backup file.
 * @returns {boolean} True if successful.
 */
export const importUserData = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);

    // Basic Validation
    if (!parsed.meta || parsed.meta.appName !== "Rayyan" || !parsed.data) {
      throw new Error("Invalid backup file format");
    }

    const data = parsed.data;

    // Clear existing app data to avoid conflicts, or just overwrite?
    // Safer to overwrite matching keys only, but for a full restore, we usually want the exact state.
    // Let's iterate through the backup data and set items.
    Object.keys(data).forEach(key => {
      if (key.startsWith('nour_')) {
        const value = data[key];
        if (typeof value === 'object') {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          localStorage.setItem(key, String(value));
        }
      }
    });

    return true;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
};

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

export const getHistory = (): ProgressState => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
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

export const incrementHistory = (dhikrId: number, amount: number = 1) => {
  const history = getHistory();
  const today = getTodayKey();
  
  if (!history[today]) {
    history[today] = {};
  }
  
  const current = history[today][dhikrId] || 0;
  history[today][dhikrId] = current + amount;
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const resetTodayProgress = () => {
  try {
    if (!localStorage.getItem(HISTORY_KEY)) {
        const legacyProgress = getProgress();
        localStorage.setItem(HISTORY_KEY, JSON.stringify(legacyProgress));
    }

    const progress = getProgress();
    const today = getTodayKey();
    
    if (progress[today]) {
      delete progress[today];
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }
  } catch (e) {
    console.error("Failed to reset session progress", e);
  }
};

export const markAsSkipped = (dhikrId: number) => {
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

const defaultMissedPrayers: MissedPrayers = {
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
  witr: 0
};

export const getMissedPrayers = (): MissedPrayers => {
  try {
    const stored = localStorage.getItem(MISSED_PRAYERS_KEY);
    return stored ? JSON.parse(stored) : defaultMissedPrayers;
  } catch {
    return defaultMissedPrayers;
  }
};

export const saveMissedPrayers = (data: MissedPrayers) => {
  localStorage.setItem(MISSED_PRAYERS_KEY, JSON.stringify(data));
};

export const updateMissedPrayerCount = (prayer: keyof MissedPrayers, delta: number) => {
  const current = getMissedPrayers();
  const newCount = Math.max(0, (current[prayer] || 0) + delta);
  
  if (delta < 0 && (current[prayer] || 0) > 0) {
      incrementHistory(QADA_HISTORY_ID, 1);
  }
  
  const updated = { ...current, [prayer]: newCount };
  saveMissedPrayers(updated);
  return updated;
};

export const getCustomDhikrs = (): Dhikr[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_DHIKR_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCustomDhikr = (dhikr: Dhikr) => {
  const current = getCustomDhikrs();
  const index = current.findIndex(d => d.id === dhikr.id);
  let updated;
  if (index >= 0) {
    updated = current.map(d => d.id === dhikr.id ? dhikr : d);
  } else {
    updated = [...current, dhikr];
  }
  localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated));
};

export const deleteCustomDhikr = (id: number) => {
  const current = getCustomDhikrs();
  const updated = current.filter(d => d.id !== id);
  localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated));
};

export const getDhikrOverrides = (): {[id: number]: Dhikr} => {
  try {
    const stored = localStorage.getItem(OVERRIDE_DHIKR_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const saveDhikrOverride = (dhikr: Dhikr) => {
  const overrides = getDhikrOverrides();
  overrides[dhikr.id] = dhikr;
  localStorage.setItem(OVERRIDE_DHIKR_KEY, JSON.stringify(overrides));
};

export const deleteDhikrOverride = (id: number) => {
  const overrides = getDhikrOverrides();
  delete overrides[id];
  localStorage.setItem(OVERRIDE_DHIKR_KEY, JSON.stringify(overrides));
};

export const getDeletedDefaults = (): number[] => {
  try {
    const stored = localStorage.getItem(DELETED_DEFAULTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const markDefaultAsDeleted = (id: number) => {
  const current = getDeletedDefaults();
  if (!current.includes(id)) {
    const updated = [...current, id];
    localStorage.setItem(DELETED_DEFAULTS_KEY, JSON.stringify(updated));
  }
};

export const restoreDefault = (id: number) => {
  const current = getDeletedDefaults();
  const updated = current.filter(i => i !== id);
  localStorage.setItem(DELETED_DEFAULTS_KEY, JSON.stringify(updated));
};

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

export const getHijriOffset = (): number => {
  try {
    const stored = localStorage.getItem(HIJRI_OFFSET_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

export const saveHijriOffset = (offset: number) => {
  localStorage.setItem(HIJRI_OFFSET_KEY, offset.toString());
};

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

export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : { soundEnabled: true, vibrationType: 'default' };
  } catch {
    return { soundEnabled: true, vibrationType: 'default' };
  }
};

export const saveNotificationSettings = (settings: NotificationSettings) => {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
};

export const getVibrationPattern = (type: VibrationType): number[] => {
  switch (type) {
    case 'short': return [100];
    case 'long': return [500];
    case 'pulse': return [100, 50, 100, 50, 100];
    case 'none': return [];
    default: return [200];
  }
};

export const getHeatmapTheme = (): HeatmapTheme => {
  try {
    const stored = localStorage.getItem(HEATMAP_THEME_KEY);
    return (stored as HeatmapTheme) || 'emerald';
  } catch {
    return 'emerald';
  }
};

export const saveHeatmapTheme = (theme: HeatmapTheme) => {
  localStorage.setItem(HEATMAP_THEME_KEY, theme);
};

export interface StatsData {
  totalTasbeeh: number;
  totalDhikrCompleted: number;
  currentStreak: number;
  bestStreak: number;
  todayCount: number;
  weeklyCount: number;
}

export const getStats = (): StatsData => {
  const history = getHistory();
  const today = getTodayKey();
  const dates = Object.keys(history).sort();
  
  let totalDhikrCompleted = 0;
  let todayCount = 0;
  let weeklyCount = 0;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  dates.forEach(date => {
    const dayData = history[date];
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
    
    if (history[key] && Object.keys(history[key]).length > 0) {
      streak++;
    } else if (i === 0 && (!history[key] || Object.keys(history[key]).length === 0)) {
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
  const history = getHistory();
  const data: { [date: string]: number } = {};
  
  Object.keys(history).forEach(date => {
    const dayData = history[date];
    const total = Object.values(dayData).reduce((a, b) => (b > 0 ? a + b : a), 0);
    if (total > 0) {
      data[date] = total;
    }
  });
  
  return data;
};

export const hasSeenAlKahfPrompt = (): boolean => {
  try {
    const today = getTodayKey();
    const stored = localStorage.getItem(ALKAHF_PROMPT_KEY);
    return stored === today;
  } catch {
    return false;
  }
};

export const markAlKahfPromptSeen = () => {
  const today = getTodayKey();
  localStorage.setItem(ALKAHF_PROMPT_KEY, today);
};

// --- Dhikr Ordering ---

export const getDhikrOrder = (categoryId: string): number[] => {
  try {
    const stored = localStorage.getItem(`${DHIKR_ORDER_KEY}_${categoryId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveDhikrOrder = (categoryId: string, order: number[]) => {
  localStorage.setItem(`${DHIKR_ORDER_KEY}_${categoryId}`, JSON.stringify(order));
};

// --- Radio Favorites ---

export const getRadioFavorites = (): number[] => {
  try {
    const stored = localStorage.getItem(RADIO_FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const toggleRadioFavorite = (stationId: number): number[] => {
  const current = getRadioFavorites();
  const index = current.indexOf(stationId);
  let newFavs;
  if (index >= 0) {
    newFavs = current.filter(id => id !== stationId);
  } else {
    newFavs = [...current, stationId];
  }
  localStorage.setItem(RADIO_FAVORITES_KEY, JSON.stringify(newFavs));
  return newFavs;
};
