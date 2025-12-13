
import { Habit, HabitLog, HabitUserStats, Badge, SystemHabitType } from '../types';
import { addReminder, deleteReminder } from './storage';

const HABITS_KEY = 'nour_habits_v2';
const HABIT_LOGS_KEY = 'nour_habit_logs_v2';
const HABIT_STATS_KEY = 'nour_habit_stats_v2';

export const LEVEL_BASE_XP = 200;
export const XP_PER_COMPLETION = 15;
export const XP_BONUS_STREAK = 50;

// --- Default Habits Configuration ---
const DEFAULT_HABITS: Habit[] = [
  { 
    id: 'sys_fajr', 
    title: 'صلاة الفجر', 
    type: 'boolean', 
    category: 'spiritual',
    systemType: 'salah_fajr',
    goal: 1, 
    unit: 'فرض', 
    color: 'bg-sky-500', 
    icon: '🕌', 
    frequency: [0,1,2,3,4,5,6], 
    streak: 0, bestStreak: 0, totalCompletions: 0, archived: false 
  },
  { 
    id: 'sys_quran', 
    title: 'الورد اليومي', 
    type: 'numeric', 
    category: 'spiritual',
    systemType: 'quran_reading',
    goal: 2, 
    unit: 'صفحة', 
    color: 'bg-emerald-500', 
    icon: '📖', 
    frequency: [0,1,2,3,4,5,6], 
    streak: 0, bestStreak: 0, totalCompletions: 0, archived: false 
  },
  { 
    id: 'sys_sabah', 
    title: 'أذكار الصباح', 
    type: 'boolean', 
    category: 'spiritual',
    systemType: 'azkar_sabah',
    goal: 1, 
    unit: 'مرة', 
    color: 'bg-orange-400', 
    icon: '☀️', 
    frequency: [0,1,2,3,4,5,6], 
    streak: 0, bestStreak: 0, totalCompletions: 0, archived: false 
  },
  { 
    id: 'sys_masaa', 
    title: 'أذكار المساء', 
    type: 'boolean', 
    category: 'spiritual',
    systemType: 'azkar_masaa',
    goal: 1, 
    unit: 'مرة', 
    color: 'bg-indigo-500', 
    icon: '🌙', 
    frequency: [0,1,2,3,4,5,6], 
    streak: 0, bestStreak: 0, totalCompletions: 0, archived: false 
  },
];

// --- Badges Configuration ---
export const BADGES: Badge[] = [
  { id: 'b_start', title: 'بداية الخير', description: 'أكملت أول عادة لك', icon: '🌱', condition: (s) => s.totalCompletions >= 1, unlocked: false },
  { id: 'b_week', title: 'أسبوع النور', description: 'وصلت للمستوى 2', icon: '🕯️', condition: (s) => s.level >= 2, unlocked: false },
  { id: 'b_committed', title: 'المواظب', description: 'جمعت 1000 نقطة', icon: '🛡️', condition: (s) => s.xp >= 1000, unlocked: false },
  { id: 'b_master', title: 'سيد العادات', description: 'وصلت للمستوى 10', icon: '👑', condition: (s) => s.level >= 10, unlocked: false },
];

// --- Storage Accessors ---

export const getHabits = (): Habit[] => {
  try {
    const stored = localStorage.getItem(HABITS_KEY);
    if (!stored) {
      saveHabits(DEFAULT_HABITS);
      return DEFAULT_HABITS;
    }
    return JSON.parse(stored);
  } catch {
    return DEFAULT_HABITS;
  }
};

export const saveHabits = (habits: Habit[]) => {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
};

export const getHabitLogs = (): HabitLog => {
  try {
    const stored = localStorage.getItem(HABIT_LOGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const saveHabitLogs = (logs: HabitLog) => {
  localStorage.setItem(HABIT_LOGS_KEY, JSON.stringify(logs));
};

export const getUserStats = (): HabitUserStats => {
  try {
    const stored = localStorage.getItem(HABIT_STATS_KEY);
    return stored ? JSON.parse(stored) : { xp: 0, level: 1, totalCompletions: 0, badges: [] };
  } catch {
    return { xp: 0, level: 1, totalCompletions: 0, badges: [] };
  }
};

export const saveUserStats = (stats: HabitUserStats) => {
  localStorage.setItem(HABIT_STATS_KEY, JSON.stringify(stats));
};

// --- Logic & Actions ---

export const logActivity = (habitId: string, value: number, dateObj: Date = new Date()) => {
  const dateKey = dateObj.toISOString().split('T')[0];
  const habits = getHabits();
  const habit = habits.find(h => h.id === habitId);
  const logs = getHabitLogs();
  
  if (!habit) return;

  // Init Logs
  if (!logs[dateKey]) logs[dateKey] = {};
  
  const prevValue = logs[dateKey][habitId] || 0;
  
  // Update Value
  logs[dateKey][habitId] = value;
  saveHabitLogs(logs);

  // Check Completion Status Change
  const wasCompleted = prevValue >= habit.goal;
  const isCompleted = value >= habit.goal;

  if (isCompleted && !wasCompleted) {
    // 1. Update Habit Streak
    const newStreak = habit.streak + 1;
    const newBest = Math.max(habit.bestStreak, newStreak);
    
    const updatedHabits = habits.map(h => 
      h.id === habitId ? { ...h, streak: newStreak, bestStreak: newBest, totalCompletions: h.totalCompletions + 1 } : h
    );
    saveHabits(updatedHabits);

    // 2. Update User Stats & XP
    let stats = getUserStats();
    let xpGain = XP_PER_COMPLETION;
    
    // Streak Bonus
    if (newStreak % 7 === 0) xpGain += XP_BONUS_STREAK;

    stats.xp += xpGain;
    stats.totalCompletions += 1;
    stats.level = Math.floor(stats.xp / LEVEL_BASE_XP) + 1;

    // Check Badges (Silently update, UI should detect changes)
    BADGES.forEach(badge => {
      if (!stats.badges.includes(badge.id) && badge.condition(stats)) {
        stats.badges.push(badge.id);
      }
    });

    saveUserStats(stats);
  } else if (!isCompleted && wasCompleted) {
    // Revert stats if user unchecks (Simple logic: decrease streak and total)
    const updatedHabits = habits.map(h => 
        h.id === habitId ? { ...h, streak: Math.max(0, h.streak - 1), totalCompletions: Math.max(0, h.totalCompletions - 1) } : h
    );
    saveHabits(updatedHabits);
    
    let stats = getUserStats();
    stats.xp = Math.max(0, stats.xp - XP_PER_COMPLETION);
    stats.totalCompletions = Math.max(0, stats.totalCompletions - 1);
    saveUserStats(stats);
  }
};

// --- Auto-Detection System ---

export const logSystemActivity = (type: SystemHabitType, amount: number = 1) => {
  const habits = getHabits();
  const matchingHabits = habits.filter(h => h.systemType === type && !h.archived);

  if (matchingHabits.length === 0) return;

  const todayLogs = getHabitLogs()[new Date().toISOString().split('T')[0]] || {};

  matchingHabits.forEach(habit => {
    const currentValue = todayLogs[habit.id] || 0;
    
    let newValue = amount;
    if (habit.type === 'numeric') {
        newValue = currentValue + amount;
    } else {
        newValue = 1;
    }

    logActivity(habit.id, newValue);
  });
};

// --- Habit Management ---

export const addNewHabit = (habit: Habit) => {
  const habits = getHabits();
  habits.push(habit);
  saveHabits(habits);

  if (habit.reminderTime) {
    addReminder({
      id: `habit_${habit.id}`,
      time: habit.reminderTime,
      label: `تذكير: ${habit.title}`,
      enabled: true,
      targetPath: '/habits'
    });
  }
};

export const removeHabit = (id: string) => {
  const habits = getHabits();
  const updated = habits.filter(h => h.id !== id);
  saveHabits(updated);
  deleteReminder(`habit_${id}`);
};

export const updateHabit = (updatedHabit: Habit) => {
    const habits = getHabits();
    const index = habits.findIndex(h => h.id === updatedHabit.id);
    if (index !== -1) {
        habits[index] = updatedHabit;
        saveHabits(habits);
        
        // Update reminder if exists
        if (updatedHabit.reminderTime) {
             deleteReminder(`habit_${updatedHabit.id}`);
             addReminder({
                id: `habit_${updatedHabit.id}`,
                time: updatedHabit.reminderTime,
                label: `تذكير: ${updatedHabit.title}`,
                enabled: true,
                targetPath: '/habits'
             });
        }
    }
};

// --- Heatmap Helpers ---

export const getYearlyProgress = () => {
  const logs = getHabitLogs();
  const habits = getHabits();
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const data: { [date: string]: number } = {};

  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    const dayLog = logs[dateKey];
    
    if (dayLog) {
      let completedCount = 0;
      Object.keys(dayLog).forEach(habitId => {
        const habit = habits.find(h => h.id === habitId);
        if (habit && dayLog[habitId] >= habit.goal) {
          completedCount++;
        }
      });
      if (completedCount > 0) data[dateKey] = completedCount;
    }
  }
  return data;
};
