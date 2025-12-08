

import { ProgressState, Dhikr, CategoryId, MissedPrayers } from '../types';

const FAVORITES_KEY = 'nour_favorites_v1';
const PROGRESS_KEY = 'nour_progress_v1'; // Now acts as SESSION storage
const HISTORY_KEY = 'nour_history_v1';   // New PERMANENT storage for stats
const TASBEEH_KEY = 'nour_tasbeeh_count';
const CUSTOM_TARGETS_KEY = 'nour_custom_targets_v1';
const REMINDERS_KEY = 'nour_reminders_v1';
const FONT_SIZE_KEY = 'nour_font_size_v1';
const HIJRI_OFFSET_KEY = 'nour_hijri_offset_v1';
const TUTORIAL_KEY = 'nour_tutorial_seen_v1';
const NOTIFICATION_SETTINGS_KEY = 'nour_notification_settings_v1';
const CUSTOM_DHIKR_KEY = 'nour_custom_dhikr_v1';
const OVERRIDE_DHIKR_KEY = 'nour_override_dhikr_v1';
const DELETED_DEFAULTS_KEY = 'nour_deleted_defaults_v1'; // New key for hidden defaults
const MISSED_PRAYERS_KEY = 'nour_missed_prayers_v1'; // Key for Qada tracker

// --- Reminder Types ---
export interface Reminder {
  id: string;
  label: string;
  time: string; // 24h format "HH:mm"
  enabled: boolean;
}

// --- Notification Settings Types ---
export type VibrationType = 'default' | 'short' | 'long' | 'pulse' | 'none';

export interface NotificationSettings {
  soundEnabled: boolean;
  vibrationType: VibrationType;
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

// Returns SESSION progress (Reset daily/on-refresh)
export const getProgress = (): ProgressState => {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Returns PERMANENT history (Never deleted automatically)
export const getHistory = (): ProgressState => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Saves SESSION progress (UI State)
export const saveProgress = (dhikrId: number, count: number) => {
  const progress = getProgress();
  const today = getTodayKey();
  
  if (!progress[today]) {
    progress[today] = {};
  }
  
  progress[today][dhikrId] = count;
  
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

// Increments PERMANENT History (Stats)
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

// Reset Session but Keep History
export const resetTodayProgress = () => {
  try {
    // 1. MIGRATION: If History doesn't exist yet, copy current Progress to History
    // This ensures existing users don't lose their stats when this update ships.
    if (!localStorage.getItem(HISTORY_KEY)) {
        const legacyProgress = getProgress();
        localStorage.setItem(HISTORY_KEY, JSON.stringify(legacyProgress));
    }

    // 2. RESET SESSION: Clear today's UI counters
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
  // Use -1 to represent skipped in session
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

// --- Missed Prayers Logic ---

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
  // Ensure count doesn't drop below zero
  const newCount = Math.max(0, (current[prayer] || 0) + delta);
  
  const updated = { ...current, [prayer]: newCount };
  saveMissedPrayers(updated);
  return updated;
};

// --- Custom Dhikr Logic (User Added) ---

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
  // Check if update or add
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

// --- Override Dhikr Logic (Edits to Defaults) ---

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

// --- Deleted Defaults Logic (Hiding Default Items) ---

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

// --- Hijri Offset Logic ---

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

// --- Tutorial Logic ---

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

// --- Notification Settings Logic ---

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
    default: return [200]; // Default single buzz
  }
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
  // Use HISTORY for stats, not session progress
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