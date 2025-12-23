import { ProgressState, Dhikr, CategoryId, CustomCategory } from '../types';

const FAVORITES_KEY = 'nour_favorites_v1';
const PROGRESS_KEY = 'nour_progress_v1';
const HISTORY_KEY = 'nour_history_v1';
const TASBEEH_KEY = 'nour_tasbeeh_count_v1';
const CUSTOM_TARGETS_KEY = 'nour_custom_targets_v1';
const CUSTOM_DHIKR_KEY = 'nour_custom_dhikr_v1';
const CUSTOM_CATEGORIES_KEY = 'nour_custom_categories_v1';
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
const NAV_SETTINGS_KEY = 'nour_nav_settings_v1';
const ACCENT_THEME_KEY = 'nour_accent_theme_v1';

// Tasbeeh Haptics
const TASBEEH_HAPTIC_ENABLED_KEY = 'nour_tasbeeh_haptic_enabled_v1';
const TASBEEH_MILESTONE_KEY = 'nour_tasbeeh_milestone_v1';

// New Adhan Keys
const ADHAN_AUDIO_ENABLED_KEY = 'nour_adhan_audio_enabled_v1';
const ADHAN_VOICE_KEY = 'nour_adhan_voice_v1';
const ADHAN_FAJR_ONLY_KEY = 'nour_adhan_fajr_only_v1';
const LAST_LOCATION_KEY = 'nour_last_location_v1';

// Quran Keys
const QURAN_LAST_READ_KEY = 'nour_quran_last_read_v1';
const QURAN_BOOKMARKS_KEY = 'nour_quran_bookmarks_v1';
const QURAN_THEME_KEY = 'nour_quran_theme_v1';
const QURAN_REFLECTIONS_KEY = 'nour_quran_reflections_v1';

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type PageTheme = 'light' | 'sepia' | 'dark';
export type AccentTheme = 'emerald' | 'blue' | 'purple' | 'rose' | 'amber';
export type AdhanVoice = 'mecca' | 'madina' | 'alaqsa' | 'standard';

export interface Reminder {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  targetPath?: string;
}

export interface QuranBookmark {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  timestamp: number;
  pageNumber?: number;
}

export interface AyahReflection {
  surahNumber: number;
  ayahNumber: number;
  text: string;
  updatedAt: number;
}

export type VibrationType = 'default' | 'short' | 'long' | 'pulse' | 'none';

export interface NotificationSettings {
  soundEnabled: boolean;
  vibrationType: VibrationType;
}

export type HeatmapTheme = 'emerald' | 'blue' | 'flame';

// --- Tasbeeh Settings ---

export const isTasbeehHapticEnabled = (): boolean => {
    const val = localStorage.getItem(TASBEEH_HAPTIC_ENABLED_KEY);
    return val === null ? true : val === 'true';
};

export const setTasbeehHapticEnabled = (enabled: boolean) => {
    localStorage.setItem(TASBEEH_HAPTIC_ENABLED_KEY, String(enabled));
};

export const getTasbeehMilestone = (): number => {
    const val = localStorage.getItem(TASBEEH_MILESTONE_KEY);
    return val ? parseInt(val, 10) : 33;
};

export const setTasbeehMilestone = (milestone: number) => {
    localStorage.setItem(TASBEEH_MILESTONE_KEY, milestone.toString());
};

// --- Adhan Settings ---

export const isAdhanAudioEnabled = (): boolean => {
    return localStorage.getItem(ADHAN_AUDIO_ENABLED_KEY) === 'true';
};

export const setAdhanAudioEnabled = (enabled: boolean) => {
    localStorage.setItem(ADHAN_AUDIO_ENABLED_KEY, String(enabled));
};

export const getAdhanVoice = (): AdhanVoice => {
    return (localStorage.getItem(ADHAN_VOICE_KEY) as AdhanVoice) || 'mecca';
};

export const setAdhanVoice = (voice: AdhanVoice) => {
    localStorage.setItem(ADHAN_VOICE_KEY, voice);
};

export const isAdhanFajrOnly = (): boolean => {
    return localStorage.getItem(ADHAN_FAJR_ONLY_KEY) === 'true';
};

export const setAdhanFajrOnly = (only: boolean) => {
    localStorage.setItem(ADHAN_FAJR_ONLY_KEY, String(only));
};

export const saveLastLocation = (lat: number, lng: number) => {
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat, lng, timestamp: Date.now() }));
};

export const getLastLocation = (): { lat: number, lng: number } | null => {
    try {
        const stored = localStorage.getItem(LAST_LOCATION_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
};

// --- Custom Categories ---

export const getCustomCategories = (): CustomCategory[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCustomCategory = (category: CustomCategory) => {
  const current = getCustomCategories();
  const index = current.findIndex(c => c.id === category.id);
  let updated;
  if (index >= 0) {
    updated = current.map(c => c.id === category.id ? category : c);
  } else {
    updated = [...current, category];
  }
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
};

export const deleteCustomCategory = (id: string) => {
  // 1. Delete the category itself
  const current = getCustomCategories();
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(current.filter(c => c.id !== id)));
  
  // 2. Delete all dhikrs associated with this category
  const dhikrs = getCustomDhikrs();
  const filteredDhikrs = dhikrs.filter(d => d.customCategoryId !== id);
  localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(filteredDhikrs));
};

// --- App Appearance ---

export const getAccentTheme = (): AccentTheme => {
    return (localStorage.getItem(ACCENT_THEME_KEY) as AccentTheme) || 'emerald';
};

export const saveAccentTheme = (theme: AccentTheme) => {
    localStorage.setItem(ACCENT_THEME_KEY, theme);
};

// --- Quran Storage ---

export const getQuranLastRead = (): QuranBookmark | null => {
  try {
    const stored = localStorage.getItem(QURAN_LAST_READ_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveQuranLastRead = (bookmark: QuranBookmark) => {
  localStorage.setItem(QURAN_LAST_READ_KEY, JSON.stringify(bookmark));
};

export const getQuranBookmarks = (): QuranBookmark[] => {
  try {
    const stored = localStorage.getItem(QURAN_BOOKMARKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveQuranBookmark = (bookmark: QuranBookmark) => {
  const current = getQuranBookmarks();
  const filtered = current.filter(b => !(b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber));
  const updated = [bookmark, ...filtered];
  localStorage.setItem(QURAN_BOOKMARKS_KEY, JSON.stringify(updated));
};

export const removeQuranBookmark = (surahNumber: number, ayahNumber: number) => {
  const current = getQuranBookmarks();
  const updated = current.filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber));
  localStorage.setItem(QURAN_BOOKMARKS_KEY, JSON.stringify(updated));
};

export const getQuranTheme = (): PageTheme => {
  return (localStorage.getItem(QURAN_THEME_KEY) as PageTheme) || 'light';
};

export const saveQuranTheme = (theme: PageTheme) => {
  localStorage.setItem(QURAN_THEME_KEY, theme);
};

export const getAyahReflections = (): AyahReflection[] => {
  try {
    const stored = localStorage.getItem(QURAN_REFLECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveAyahReflection = (reflection: AyahReflection) => {
  const current = getAyahReflections();
  const filtered = current.filter(r => !(r.surahNumber === reflection.surahNumber && r.ayahNumber === reflection.ayahNumber));
  const updated = [reflection, ...filtered];
  localStorage.setItem(QURAN_REFLECTIONS_KEY, JSON.stringify(updated));
};

export const deleteAyahReflection = (surahNumber: number, ayahNumber: number) => {
  const current = getAyahReflections();
  const updated = current.filter(r => !(r.surahNumber === r.surahNumber && r.ayahNumber === ayahNumber));
  localStorage.setItem(QURAN_REFLECTIONS_KEY, JSON.stringify(updated));
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
  if (!progress[today]) progress[today] = {};
  progress[today][dhikrId] = count;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const incrementHistory = (dhikrId: number, amount: number = 1) => {
  const history = getHistory();
  const today = getTodayKey();
  if (!history[today]) history[today] = {};
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
    // FIX: Changed name from HI_OFFSET_KEY to HIJRI_OFFSET_KEY to resolve undefined error
    const stored = localStorage.getItem(HIJRI_OFFSET_KEY);
    // Changed default fallback from 0 to -1 to fix the date discrepancy reported by users
    return stored ? parseInt(stored, 10) : -1;
  } catch {
    return -1;
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
    const sum = (counts as number[]).reduce((a, b) => (b > 0 ? a + b : a), 0);
    totalDhikrCompleted += sum;
    if (date === today) todayCount = sum;
    if (new Date(date) >= oneWeekAgo) weeklyCount += sum;
  });
  let streak = 0;
  const todayDate = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(todayDate.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (history[key] && Object.keys(history[key]).length > 0) streak++;
    else if (i === 0) continue; 
    else break;
  }
  return { totalTasbeeh: getTasbeehCount(), totalDhikrCompleted, currentStreak: streak, bestStreak: streak, todayCount, weeklyCount };
};

export const getHeatmapData = () => {
  const history = getHistory();
  const data: { [date: string]: number } = {};
  Object.keys(history).forEach(date => {
    const dayData = history[date];
    const total = (Object.values(dayData) as number[]).reduce((a, b) => (b > 0 ? a + b : a), 0);
    if (total > 0) data[date] = total;
  });
  return data;
};

export const hasSeenAlKahfPrompt = (): boolean => {
  try {
    const today = getTodayKey();
    return localStorage.getItem(ALKAHF_PROMPT_KEY) === today;
  } catch {
    return false;
  }
};

export const markAlKahfPromptSeen = () => {
  const today = getTodayKey();
  localStorage.setItem(ALKAHF_PROMPT_KEY, today);
};

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
  if (index >= 0) newFavs = current.filter(id => id !== stationId);
  else newFavs = [...current, stationId];
  localStorage.setItem(RADIO_FAVORITES_KEY, JSON.stringify(newFavs));
  return newFavs;
};

export const DEFAULT_NAV_ORDER = ['home', 'athkar', 'quran', 'prayers', 'more'];

export const getNavOrder = (): string[] => {
  try {
    const stored = localStorage.getItem(NAV_SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
    return DEFAULT_NAV_ORDER;
  } catch {
    return DEFAULT_NAV_ORDER;
  }
};

export const saveNavOrder = (order: string[]) => {
  localStorage.setItem(NAV_SETTINGS_KEY, JSON.stringify(order));
};

export const exportUserData = (): string => {
  const data: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('nour_')) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
            try { data[key] = JSON.parse(value); } catch { data[key] = value; }
        }
      } catch (e) {}
    }
  }
  return JSON.stringify({ meta: { appName: "Rayyan", timestamp: new Date().toISOString() }, data }, null, 2);
};

export const importUserData = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data) throw new Error("Invalid backup");
    Object.keys(parsed.data).forEach(key => {
      if (key.startsWith('nour_')) {
        const value = parsed.data[key];
        localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });
    return true;
  } catch {
    return false;
  }
};