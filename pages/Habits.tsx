
import React, { useState, useEffect } from 'react';
import { Plus, Check, Flame, Trophy, Play, Pause, X, ChevronRight, ChevronLeft, Target, Clock, Hash, CheckSquare } from 'lucide-react';
import * as habitService from '../services/habitService';
import { Habit, HabitLog, HabitUserStats, HabitType } from '../types';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { arSA } from 'date-fns/locale';

const Habits: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog>({});
  const [stats, setStats] = useState<HabitUserStats>({ xp: 0, level: 1, totalCompletions: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load Data
  useEffect(() => {
    setHabits(habitService.getHabits());
    setLogs(habitService.getHabitLogs());
    setStats(habitService.getUserStats());
  }, []);

  const getProgress = (habitId: string) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return logs[dateKey]?.[habitId] || 0;
  };

  const updateProgress = (habitId: string, value: number) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Update Logs
    const newLogs = { ...logs };
    if (!newLogs[dateKey]) newLogs[dateKey] = {};
    const prevValue = newLogs[dateKey][habitId] || 0;
    newLogs[dateKey][habitId] = value;
    
    setLogs(newLogs);
    habitService.saveHabitLogs(newLogs);

    // Gamification & Streak Logic
    const isCompletedNow = value >= habit.goal;
    const wasCompleted = prevValue >= habit.goal;

    if (isCompletedNow && !wasCompleted) {
        // Level Up Logic
        const newStats = {
            ...stats,
            xp: stats.xp + habitService.XP_PER_COMPLETION,
            totalCompletions: stats.totalCompletions + 1,
            level: Math.floor((stats.xp + habitService.XP_PER_COMPLETION) / habitService.LEVEL_BASE_XP) + 1
        };
        setStats(newStats);
        habitService.saveUserStats(newStats);

        // Simple Streak Increment (Real implementation would check previous days)
        const newHabits = habits.map(h => 
            h.id === habitId ? { ...h, streak: h.streak + 1 } : h
        );
        setHabits(newHabits);
        habitService.saveHabits(newHabits);
    }
  };

  const handleAddHabit = (habit: Habit) => {
      const newHabits = [...habits, habit];
      setHabits(newHabits);
      habitService.saveHabits(newHabits);
      setIsModalOpen(false);
  };

  const deleteHabit = (id: string) => {
      if(confirm('هل أنت متأكد من حذف هذه العادة؟')) {
          const newHabits = habits.filter(h => h.id !== id);
          setHabits(newHabits);
          habitService.saveHabits(newHabits);
      }
  };

  // Week Calendar Logic
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 6 }); // Saturday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter habits for current day (0=Sunday in JS, 0-6)
  const dayIndex = selectedDate.getDay();
  const todaysHabits = habits.filter(h => h.frequency.includes(dayIndex) && !h.archived);

  return (
    <div className="pb-24 max-w-4xl mx-auto space-y-6 animate-fadeIn">
        {/* Header Stats */}
        <div className="px-4 pt-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold font-arabicHead mb-1">المستوى {stats.level}</h2>
                        <p className="text-indigo-100 font-arabic text-sm opacity-90">واصل التقدم، أنت تبلي بلاءً حسناً!</p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                        <Trophy size={32} className="text-yellow-300" />
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold mb-2 opacity-80">
                        <span>{stats.xp} XP</span>
                        <span>{stats.level * habitService.LEVEL_BASE_XP} XP</span>
                    </div>
                    <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                            style={{ width: `${(stats.xp % habitService.LEVEL_BASE_XP) / habitService.LEVEL_BASE_XP * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Date Selector */}
        <div className="px-2">
            <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg">
                        <ChevronRight />
                    </button>
                    <h3 className="font-bold text-gray-800 dark:text-white font-arabic">
                        {format(selectedDate, 'MMMM yyyy', { locale: arSA })}
                    </h3>
                    <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg">
                        <ChevronLeft />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day, i) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    flex flex-col items-center justify-center p-2 rounded-xl transition-all
                                    ${isSelected ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'hover:bg-gray-50 dark:hover:bg-dark-bg text-gray-600 dark:text-gray-400'}
                                    ${isToday && !isSelected ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : ''}
                                `}
                            >
                                <span className="text-[10px] opacity-80 mb-1">{format(day, 'EEE', { locale: arSA })}</span>
                                <span className="font-bold text-lg">{format(day, 'd')}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Habits List */}
        <div className="px-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl text-gray-800 dark:text-white font-arabicHead">
                    مهام {format(selectedDate, 'EEEE', { locale: arSA })}
                </h3>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg text-sm hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                >
                    <Plus size={16} />
                    <span>جديد</span>
                </button>
            </div>

            {todaysHabits.length === 0 ? (
                <div className="py-12 text-center text-gray-400 bg-white dark:bg-dark-surface rounded-3xl border border-dashed border-gray-200 dark:border-dark-border">
                    <Target size={48} className="mx-auto mb-3 opacity-50" />
                    <p>لا توجد مهام مجدولة لهذا اليوم</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {todaysHabits.map(habit => (
                        <HabitCard 
                            key={habit.id} 
                            habit={habit} 
                            currentValue={getProgress(habit.id)}
                            onUpdate={(val) => updateProgress(habit.id, val)}
                            onDelete={() => deleteHabit(habit.id)}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Add Modal */}
        {isModalOpen && <AddHabitModal onClose={() => setIsModalOpen(false)} onAdd={handleAddHabit} />}
    </div>
  );
};

// --- Sub-Components ---

const HabitCard: React.FC<{ 
    habit: Habit; 
    currentValue: number; 
    onUpdate: (val: number) => void; 
    onDelete: () => void;
}> = ({ habit, currentValue, onUpdate, onDelete }) => {
    const isCompleted = currentValue >= habit.goal;
    const progress = Math.min(100, (currentValue / habit.goal) * 100);

    return (
        <div className={`
            bg-white dark:bg-dark-surface rounded-2xl p-5 border transition-all relative overflow-hidden group
            ${isCompleted ? 'border-emerald-200 dark:border-emerald-900 shadow-sm' : 'border-gray-100 dark:border-dark-border shadow-sm'}
        `}>
            {/* Progress Bar Background */}
            <div 
                className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : habit.color}`}
                style={{ width: `${progress}%` }}
            ></div>

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 dark:bg-dark-bg'}`}>
                        {isCompleted ? <Check size={24} /> : habit.icon}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-white font-arabicHead">{habit.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span className="flex items-center gap-1 text-orange-500 font-bold bg-orange-50 dark:bg-orange-900/10 px-1.5 py-0.5 rounded">
                                <Flame size={10} fill="currentColor" /> {habit.streak}
                            </span>
                            {habit.type === 'timer' && <span>• مؤقت زمني</span>}
                            {habit.type === 'numeric' && <span>• عداد رقمي</span>}
                        </div>
                    </div>
                </div>
                <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <X size={18} />
                </button>
            </div>

            {/* Controls */}
            <div>
                {habit.type === 'boolean' && (
                    <button
                        onClick={() => onUpdate(isCompleted ? 0 : 1)}
                        className={`
                            w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                            ${isCompleted 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100' 
                                : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-elevated'}
                        `}
                    >
                        {isCompleted ? 'تم الإنجاز' : 'إكمال المهمة'}
                    </button>
                )}

                {habit.type === 'numeric' && (
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg rounded-xl p-1">
                        <button 
                            onClick={() => onUpdate(Math.max(0, currentValue - 1))}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-dark-surface shadow-sm text-gray-500 hover:text-red-500 active:scale-95 transition-all"
                        >
                            -
                        </button>
                        <span className="font-mono font-bold text-lg text-gray-800 dark:text-white">
                            {currentValue} <span className="text-xs text-gray-400 font-arabic">/ {habit.goal} {habit.unit}</span>
                        </span>
                        <button 
                            onClick={() => onUpdate(currentValue + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-dark-surface shadow-sm text-gray-500 hover:text-emerald-500 active:scale-95 transition-all"
                        >
                            +
                        </button>
                    </div>
                )}

                {habit.type === 'timer' && (
                    <TimerControl habit={habit} currentValue={currentValue} onUpdate={onUpdate} />
                )}
            </div>
        </div>
    );
};

const TimerControl: React.FC<{ habit: Habit; currentValue: number; onUpdate: (val: number) => void }> = ({ habit, currentValue, onUpdate }) => {
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: any;
        if (isActive) {
            interval = setInterval(() => {
                onUpdate(currentValue + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, currentValue, onUpdate]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 dark:bg-dark-bg rounded-xl px-4 py-3 font-mono text-center text-xl font-bold text-gray-800 dark:text-white">
                {formatTime(currentValue)} <span className="text-xs text-gray-400">/ {formatTime(habit.goal)}</span>
            </div>
            <button 
                onClick={() => setIsActive(!isActive)}
                className={`
                    w-14 h-14 rounded-xl flex items-center justify-center text-white transition-all shadow-lg active:scale-95
                    ${isActive ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30'}
                `}
            >
                {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
        </div>
    );
};

const AddHabitModal: React.FC<{ onClose: () => void; onAdd: (h: Habit) => void }> = ({ onClose, onAdd }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<HabitType>('boolean');
    const [goal, setGoal] = useState(1);
    const [unit, setUnit] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            id: Date.now().toString(),
            title,
            type,
            goal: type === 'timer' ? goal * 60 : goal, // Convert mins to seconds for timer
            unit: type === 'boolean' ? 'مرة' : unit,
            color: 'bg-primary-500',
            icon: '✨',
            frequency: [0,1,2,3,4,5,6],
            streak: 0,
            archived: false
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-dark-surface w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white font-arabicHead">إضافة عادة جديدة</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-dark-bg rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">اسم العادة</label>
                        <input 
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-bg border-none focus:ring-2 focus:ring-primary-500 dark:text-white font-arabic"
                            placeholder="مثلاً: قراءة سورة الكهف"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">نوع التتبع</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'boolean', label: 'نعم/لا', icon: <CheckSquare size={18} /> },
                                { id: 'numeric', label: 'عداد', icon: <Hash size={18} /> },
                                { id: 'timer', label: 'وقت', icon: <Clock size={18} /> },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                        setType(t.id as HabitType);
                                        setGoal(1);
                                    }}
                                    className={`
                                        flex flex-col items-center justify-center gap-1 py-3 rounded-xl border transition-all
                                        ${type === t.id 
                                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-400 font-bold' 
                                            : 'border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg'}
                                    `}
                                >
                                    {t.icon}
                                    <span className="text-xs">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">
                                {type === 'timer' ? 'الهدف (بالدقائق)' : 'الهدف اليومي'}
                            </label>
                            <input 
                                type="number"
                                min="1"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-bg border-none focus:ring-2 focus:ring-primary-500 dark:text-white font-bold text-center"
                                value={goal}
                                onChange={e => setGoal(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        {type !== 'boolean' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2">الوحدة</label>
                                <input 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-bg border-none focus:ring-2 focus:ring-primary-500 dark:text-white font-arabic"
                                    placeholder={type === 'timer' ? 'دقيقة' : 'صفحة'}
                                    value={unit}
                                    onChange={e => setUnit(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all active:scale-95 mt-4"
                    >
                        حفظ العادة
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Habits;
