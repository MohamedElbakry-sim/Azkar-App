
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, ArrowLeft, Target } from 'lucide-react';
import * as habitService from '../services/habitService';
import * as storage from '../services/storage';
import { Habit, HabitLog } from '../types';
import { format } from 'date-fns';

const HabitQuickView: React.FC = () => {
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allHabits = habitService.getHabits();
    // Filter for today's habits only
    const dayIndex = new Date().getDay();
    const todaysHabits = allHabits.filter(h => h.frequency.includes(dayIndex) && !h.archived);
    
    setHabits(todaysHabits);
    setLogs(habitService.getHabitLogs());
    setLoading(false);
  };

  const playSound = (type: 'tick' | 'success' = 'tick') => {
      // Check settings to respect mute preferences
      const settings = storage.getNotificationSettings();
      if (!settings.soundEnabled) return;

      try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          
          const ctx = new AudioContext();
          const t = ctx.currentTime;

          if (type === 'tick') {
              // Refined Tick: Shorter, crisper, constant pitch (Woodblock-ish)
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              
              osc.type = 'sine';
              osc.frequency.setValueAtTime(800, t);
              
              // Short envelope for percussive feel
              gain.gain.setValueAtTime(0.0, t);
              gain.gain.linearRampToValueAtTime(0.15, t + 0.01); // Attack
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08); // Decay

              osc.connect(gain);
              gain.connect(ctx.destination);

              osc.start(t);
              osc.stop(t + 0.1);
          } else {
              // Success Chime: Major Third (C5 + E5)
              const freqs = [523.25, 659.25];
              freqs.forEach((f, i) => {
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(f, t);
                  
                  gain.gain.setValueAtTime(0.05, t);
                  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4 + (i * 0.1));

                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start(t);
                  osc.stop(t + 0.6);
              });
          }
      } catch (e) {
          console.error("Audio playback failed", e);
      }
  };

  const handleToggle = (e: React.MouseEvent, habit: Habit) => {
    e.stopPropagation();
    const dateKey = format(new Date(), 'yyyy-MM-dd');
    const currentValue = logs[dateKey]?.[habit.id] || 0;
    const isCompleted = currentValue >= habit.goal;
    
    const newValue = isCompleted ? 0 : habit.goal;
    
    if (!isCompleted) {
        playSound('success');
    }

    habitService.logActivity(habit.id, newValue);
    
    // Haptic feedback
    if (!isCompleted && navigator.vibrate) navigator.vibrate(50);
    
    refreshData();
  };

  if (loading || habits.length === 0) return null;

  const dateKey = format(new Date(), 'yyyy-MM-dd');
  const completedCount = habits.filter(h => (logs[dateKey]?.[h.id] || 0) >= h.goal).length;
  const progress = (completedCount / habits.length) * 100;

  // Show only top 3 incomplete habits, or if all done, show success message
  const incompleteHabits = habits.filter(h => (logs[dateKey]?.[h.id] || 0) < h.goal).slice(0, 3);

  return (
    <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 border border-gray-100 dark:border-dark-border shadow-sm mb-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Target size={22} />
            </div>
            <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white font-arabicHead">وردك اليومي</h3>
                <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-24 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{completedCount}/{habits.length}</span>
                </div>
            </div>
        </div>
        <button 
            onClick={() => navigate('/habits')}
            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
            <ArrowLeft size={20} className="rtl:rotate-0" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {incompleteHabits.length > 0 ? (
            incompleteHabits.map(habit => (
                <div 
                    key={habit.id}
                    onClick={(e) => handleToggle(e, habit)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-bg/50 border border-transparent hover:border-gray-200 dark:hover:border-dark-border transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{habit.icon}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-200 font-arabic">{habit.title}</span>
                    </div>
                    <div className={`text-gray-300 dark:text-gray-600`}>
                        <Circle size={22} strokeWidth={2} />
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center py-4 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                <p className="font-bold text-sm">✨ أحسنت! أكملت جميع مهام اليوم</p>
            </div>
        )}
        
        {incompleteHabits.length > 0 && habits.length - completedCount > 3 && (
            <button 
                onClick={() => navigate('/habits')}
                className="w-full text-center text-xs text-gray-400 hover:text-indigo-500 py-2 transition-colors"
            >
                + {habits.length - completedCount - 3} مهام أخرى
            </button>
        )}
      </div>
    </div>
  );
};

export default HabitQuickView;
