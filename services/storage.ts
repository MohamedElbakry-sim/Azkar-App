
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
const ALKAHF_PROMPT_KEY = 'nour_alkahf_prompt_date'; // Key for Friday reminder
const HEATMAP_THEME_KEY = 'nour_heatmap_theme_v1'; // Key for heatmap color preference
const QADA_HISTORY_ID = 9999; // Special ID to track Qada performance in history

// --- Reminder Types ---
/**
 * Represents a scheduled daily reminder.
 */
export interface Reminder {
  id: string;
  label: string;
  time: string; // 24h format "HH:mm"
  enabled: boolean;
  targetPath?: string; // Optional path to navigate to when clicked
}

// --- Notification Settings Types ---
export type VibrationType = 'default' | 'short' | 'long' | 'pulse' | 'none';

/**
 * User preferences for notifications.
 */
export interface NotificationSettings {
  soundEnabled: boolean;
  vibrationType: VibrationType;
}

// --- Font Size Types ---
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

// --- Heatmap Theme Types ---
export type HeatmapTheme = 'emerald' | 'blue' | 'flame';

/**
 * Retrieves the list of favorite Dhikr IDs from local storage.
 * @returns {number[]} Array of Dhikr IDs.
 */
export const getFavorites = (): number[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Toggles the favorite status of a specific Dhikr ID.
 * @param {number} id - The ID of the Dhikr to toggle.
 * @returns {number[]} The updated list of favorites.
 */
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

/**
 * Generates a standard date key (YYYY-MM-DD) for the current day.
 * @returns {string} Date string.
 */
export const getTodayKey = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Retrieves the temporary session progress for the current day.
 * This data is liable to be reset upon app refresh/restart.
 * @returns {ProgressState} The session progress object.
 */
export const getProgress = (): ProgressState => {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Retrieves the permanent historical data of all completed Azkar.
 * This data persists across sessions and is used for statistics.
 * @returns {ProgressState} The history object keyed by date.
 */
export const getHistory = (): ProgressState => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Saves the current progress count for a specific Dhikr in the session storage.
 * @param {number} dhikrId - The ID of the Dhikr.
 * @param {number} count - The current count achieved.
 */
export const saveProgress = (dhikrId: number, count: number) => {
  const progress = getProgress();
  const today = getTodayKey();
  
  if (!progress[today]) {
    progress[today] = {};
  }
  
  progress[today][dhikrId] = count;
  
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

/**
 * Increments the permanent history count for a specific Dhikr.
 * Used for statistics and heatmaps.
 * @param {number} dhikrId - The ID of the Dhikr (or QADA_HISTORY_ID).
 * @param {number} [amount=1] - The amount to increment by.
 */
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

/**
 * Resets the daily session progress counters while preserving historical data.
 * This is typically called on app initialization.
 */
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

/**
 * Marks a specific Dhikr as skipped for the current session.
 * @param {number} dhikrId - The ID of the Dhikr.
 */
export const markAsSkipped = (dhikrId: number) => {
  // Use -1 to represent skipped in session
  saveProgress(dhikrId, -1);
};

/**
 * Retrieves the saved Tasbeeh counter value.
 * @returns {number} The saved count.
 */
export const getTasbeehCount = (): number => {
  try {
    return parseInt(localStorage.getItem(TASBEEH_KEY) || '0', 10);
  } catch {
    return 0;
  }
};

/**
 * Saves the Tasbeeh counter value.
 * @param {number} count - The count to save.
 */
export const saveTasbeehCount = (count: number) => {
  localStorage.setItem(TASBEEH_KEY, count.toString());
};

/**
 * Retrieves user-defined target counts for Dhikr items.
 * @returns {{[key: number]: number}} Object mapping Dhikr IDs to custom targets.
 */
export const getCustomTargets = (): {[key: number]: number} => {
  try {
    const stored = localStorage.getItem(CUSTOM_TARGETS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Saves a custom target count for a specific Dhikr.
 * @param {number} id - The Dhikr ID.
 * @param {number} target - The new target count.
 */
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

/**
 * Retrieves the counts of missed prayers.
 * @returns {MissedPrayers} Object containing counts for each prayer.
 */
export const getMissedPrayers = (): MissedPrayers => {
  try {
    const stored = localStorage.getItem(MISSED_PRAYERS_KEY);
    return stored ? JSON.parse(stored) : defaultMissedPrayers;
  } catch {
    return defaultMissedPrayers;
  }
};

/**
 * Saves the entire Missed Prayers object to storage.
 * @param {MissedPrayers} data - The data to save.
 */
export const saveMissedPrayers = (data: MissedPrayers) => {
  localStorage.setItem(MISSED_PRAYERS_KEY, JSON.stringify(data));
};

/**
 * Updates the count for a specific missed prayer.
 * If decrementing (performing Qada), it also logs to history.
 * @param {keyof MissedPrayers} prayer - The prayer key (e.g., 'fajr').
 * @param {number} delta - The amount to change by (+1 or -1).
 * @returns {MissedPrayers} The updated data.
 */
export const updateMissedPrayerCount = (prayer: keyof MissedPrayers, delta: number) => {
  const current = getMissedPrayers();
  // Ensure count doesn't drop below zero
  const newCount = Math.max(0, (current[prayer] || 0) + delta);
  
  // If user is decrementing (delta < 0), it means they performed a prayer.
  // Log this to history for the heatmap.
  if (delta < 0 && (current[prayer] || 0) > 0) {
      incrementHistory(QADA_HISTORY_ID, 1);
  }
  
  const updated = { ...current, [prayer]: newCount };
  saveMissedPrayers(updated);
  return updated;
};

// --- Custom Dhikr Logic (User Added) ---

/**
 * Retrieves list of user-created custom Dhikr items.
 * @returns {Dhikr[]} Array of custom Dhikr objects.
 */
export const getCustomDhikrs = (): Dhikr[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_DHIKR_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Saves or updates a custom Dhikr item.
 * @param {Dhikr} dhikr - The Dhikr object to save.
 */
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

/**
 * Deletes a custom Dhikr item.
 * @param {number} id - The ID of the custom Dhikr to delete.
 */
export const deleteCustomDhikr = (id: number) => {
  const current = getCustomDhikrs();
  const updated = current.filter(d => d.id !== id);
  localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated));
};

// --- Override Dhikr Logic (Edits to Defaults) ---

/**
 * Retrieves overrides for default Dhikr items (e.g., edited text/count).
 * @returns {{[id: number]: Dhikr}} Object mapping IDs to overridden objects.
 */
export const getDhikrOverrides = (): {[id: number]: Dhikr} => {
  try {
    const stored = localStorage.getItem(OVERRIDE_DHIKR_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Saves an override for a default Dhikr item.
 * @param {Dhikr} dhikr - The modified Dhikr object.
 */
export const saveDhikrOverride = (dhikr: Dhikr) => {
  const overrides = getDhikrOverrides();
  overrides[dhikr.id] = dhikr;
  localStorage.setItem(OVERRIDE_DHIKR_KEY, JSON.stringify(overrides));
};

/**
 * Deletes an override, reverting the Dhikr to its default state.
 * @param {number} id - The ID of the Dhikr.
 */
export const deleteDhikrOverride = (id: number) => {
  const overrides = getDhikrOverrides();
  delete overrides[id];
  localStorage.setItem(OVERRIDE_DHIKR_KEY, JSON.stringify(overrides));
};

// --- Deleted Defaults Logic (Hiding Default Items) ---

/**
 * Retrieves the list of default Dhikr IDs that have been "deleted" (hidden).
 * @returns {number[]} Array of IDs.
 */
export const getDeletedDefaults = (): number[] => {
  try {
    const stored = localStorage.getItem(DELETED_DEFAULTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Marks a default Dhikr item as deleted (hidden from view).
 * @param {number} id - The ID of the Dhikr.
 */
export const markDefaultAsDeleted = (id: number) => {
  const current = getDeletedDefaults();
  if (!current.includes(id)) {
    const updated = [...current, id];
    localStorage.setItem(DELETED_DEFAULTS_KEY, JSON.stringify(updated));
  }
};

/**
 * Restores a hidden default Dhikr item.
 * @param {number} id - The ID of the Dhikr.
 */
export const restoreDefault = (id: number) => {
  const current = getDeletedDefaults();
  const updated = current.filter(i => i !== id);
  localStorage.setItem(DELETED_DEFAULTS_KEY, JSON.stringify(updated));
};

// --- Font Size Logic ---

/**
 * Retrieves the user's preferred font size setting.
 * @returns {FontSize} The font size preference (default: 'medium').
 */
export const getFontSize = (): FontSize => {
  try {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    return (stored as FontSize) || 'medium';
  } catch {
    return 'medium';
  }
};

/**
 * Saves the user's preferred font size.
 * @param {FontSize} size - The selected font size.
 */
export const saveFontSize = (size: FontSize) => {
  localStorage.setItem(FONT_SIZE_KEY, size);
};

// --- Hijri Offset Logic ---

/**
 * Retrieves the manual offset for Hijri date calculation.
 * @returns {number} The offset in days.
 */
export const getHijriOffset = (): number => {
  try {
    const stored = localStorage.getItem(HIJRI_OFFSET_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Saves the manual Hijri date offset.
 * @param {number} offset - The offset in days.
 */
export const saveHijriOffset = (offset: number) => {
  localStorage.setItem(HIJRI_OFFSET_KEY, offset.toString());
};

// --- Tutorial Logic ---

/**
 * Checks if the user has completed the onboarding tutorial.
 * @returns {boolean} True if seen, false otherwise.
 */
export const hasSeenTutorial = (): boolean => {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Marks the onboarding tutorial as seen.
 */
export const markTutorialAsSeen = () => {
  localStorage.setItem(TUTORIAL_KEY, 'true');
};

// --- Reminders Logic ---

/**
 * Retrieves the list of active user reminders.
 * @returns {Reminder[]} Array of reminders.
 */
export const getReminders = (): Reminder[] => {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Saves the entire list of reminders.
 * @param {Reminder[]} reminders - Array of reminders.
 */
export const saveReminders = (reminders: Reminder[]) => {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

/**
 * Adds a new reminder.
 * @param {Reminder} reminder - The new reminder object.
 */
export const addReminder = (reminder: Reminder) => {
  const current = getReminders();
  saveReminders([...current, reminder]);
};

/**
 * Updates an existing reminder.
 * @param {Reminder} reminder - The updated reminder object.
 */
export const updateReminder = (reminder: Reminder) => {
  const current = getReminders();
  const updated = current.map(r => r.id === reminder.id ? reminder : r);
  saveReminders(updated);
};

/**
 * Deletes a reminder by ID.
 * @param {string} id - The ID of the reminder to delete.
 */
export const deleteReminder = (id: string) => {
  const current = getReminders();
  const updated = current.filter(r => r.id !== id);
  saveReminders(updated);
};

// --- Notification Settings Logic ---

/**
 * Retrieves notification preferences (sound, vibration).
 * @returns {NotificationSettings} Settings object.
 */
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : { soundEnabled: true, vibrationType: 'default' };
  } catch {
    return { soundEnabled: true, vibrationType: 'default' };
  }
};

/**
 * Saves notification preferences.
 * @param {NotificationSettings} settings - The new settings.
 */
export const saveNotificationSettings = (settings: NotificationSettings) => {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
};

/**
 * Converts a vibration type string into a standard vibration pattern array.
 * @param {VibrationType} type - The selected vibration type.
 * @returns {number[]} Array representing the vibration pattern in milliseconds.
 */
export const getVibrationPattern = (type: VibrationType): number[] => {
  switch (type) {
    case 'short': return [100];
    case 'long': return [500];
    case 'pulse': return [100, 50, 100, 50, 100];
    case 'none': return [];
    default: return [200]; // Default single buzz
  }
};

// --- Heatmap Theme Logic ---

/**
 * Retrieves the user's preferred heatmap color theme.
 * @returns {HeatmapTheme} The theme name (default: 'emerald').
 */
export const getHeatmapTheme = (): HeatmapTheme => {
  try {
    const stored = localStorage.getItem(HEATMAP_THEME_KEY);
    return (stored as HeatmapTheme) || 'emerald';
  } catch {
    return 'emerald';
  }
};

/**
 * Saves the user's preferred heatmap color theme.
 * @param {HeatmapTheme} theme - The selected theme.
 */
export const saveHeatmapTheme = (theme: HeatmapTheme) => {
  localStorage.setItem(HEATMAP_THEME_KEY, theme);
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

/**
 * Calculates aggregated statistics for the user based on history and current state.
 * @returns {StatsData} Object containing total counts, streaks, and weekly progress.
 */
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

/**
 * Formats historical data for the heatmap visualization.
 * @returns {{ [date: string]: number }} Object mapping date keys to total counts.
 */
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

// --- Al-Kahf Friday Prompt Logic ---

/**
 * Checks if the user has already seen the Surah Al-Kahf prompt for the current Friday.
 * @returns {boolean} True if seen today (if today is Friday).
 */
export const hasSeenAlKahfPrompt = (): boolean => {
  try {
    const today = getTodayKey();
    const stored = localStorage.getItem(ALKAHF_PROMPT_KEY);
    return stored === today;
  } catch {
    return false;
  }
};

/**
 * Marks the Surah Al-Kahf prompt as seen for today.
 */
export const markAlKahfPromptSeen = () => {
  const today = getTodayKey();
  localStorage.setItem(ALKAHF_PROMPT_KEY, today);
};
