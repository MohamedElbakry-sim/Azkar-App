
import { Habit, HabitLog, HabitUserStats } from '../types';

const HABITS_KEY = 'nour_habits_v1';
const HABIT_LOGS_KEY = 'nour_habit_logs_v1';
const HABIT_STATS_KEY = 'nour_habit_stats_v1';

export const LEVEL_BASE_XP = 100;
export const XP_PER_COMPLETION = 10;

const DEFAULT_HABITS: Habit[] = [
  { 
    id: '1', 
    title: 'قراءة ورد القرآن', 
    type: 'timer', 
    goal: 900, // 15 mins
    unit: 'دقيقة', 
    color: 'bg-emerald-500', 
    icon: '📖', 
    frequency: [0,1,2,3,4,5,6], 
    streak: 0,
    archived: false 
  },
  { 
    id: '2', 
    title: 'صلاة الضحى', 
    type: 'boolean', 
    goal: 1, 
    unit: 'ركعة', 
    color: 'bg-orange-500', 
    icon: '☀️', 
    frequency: [0,1,2,3,4,5,6], 
    streak: 0,
    archived: false 
  },
  { 
    id: '3', 
    title: 'شرب الماء', 
    type: 'numeric', 
    goal: 8, 
    unit: 'كوب', 
    color: 'bg-blue-500', 
    icon: '💧', 
    frequency: [0,1,2,3,4,5,6], 
    streak: 0,
    archived: false 
  },
];

export const getHabits = (): Habit[] => {
  try {
    const stored = localStorage.getItem(HABITS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_HABITS;
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
    return stored ? JSON.parse(stored) : { xp: 0, level: 1, totalCompletions: 0 };
  } catch {
    return { xp: 0, level: 1, totalCompletions: 0 };
  }
};

export const saveUserStats = (stats: HabitUserStats) => {
  localStorage.setItem(HABIT_STATS_KEY, JSON.stringify(stats));
};

export const updateHabitStreak = (habitId: string, currentStreak: number) => {
    const habits = getHabits();
    const updated = habits.map(h => h.id === habitId ? { ...h, streak: currentStreak } : h);
    saveHabits(updated);
};
