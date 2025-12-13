
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Flame, Star, X, ChevronRight, ChevronLeft, Calendar as CalendarIcon, CheckSquare, Clock, Settings, Info, Edit3, Trash2, Repeat } from 'lucide-react';
import * as habitService from '../services/habitService';
import { Habit, HabitLog, HabitUserStats, HabitType, HabitCategory, SystemHabitType } from '../types';
import { format, startOfWeek, addDays, isSameDay, subDays } from 'date-fns';
import { arSA } from 'date-fns/locale';
import Tooltip from '../components/Tooltip';

// --- Heatmap Component ---
const HabitHeatmap = ({ data }: { data: { [date: string]: number } }) => {
    const today = new Date();
    const weeks = 12;
    const startDate = subDays(today, weeks * 7);
    
    const days = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
    }

    const getColor = (count: number) => {
        if (!count) return 'bg-gray-100 dark:bg-gray-800';
        if (count === 1) return 'bg-emerald-200 dark:bg-emerald-900/60';
        if (count === 2) return 'bg-emerald-300 dark:bg-emerald-800/80';
        if (count >= 3) return 'bg-emerald-500 dark:bg-emerald-600';
        return 'bg-emerald-500';
    };

    return (
        <div className="flex flex-wrap gap-1 justify-end dir-ltr">
            {days.map((day, i) => {
                const dateKey = day.toISOString().split('T')[0];
                const count = data[dateKey] || 0;
                return (
                    <Tooltip key={i} text={`${format(day, 'd MMM', { locale: arSA })}: ${count}`}>
                        <div className={`w-3 h-3 rounded-sm ${getColor(count)} transition-colors`}></div>
                    </Tooltip>
                );
            })}
        </div>
    );
};

const Habits: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog>({});
  const [stats, setStats] = useState<HabitUserStats>({ xp: 0, level: 1, totalCompletions: 0, badges: [] });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [heatmapData, setHeatmapData] = useState<{ [date: string]: number }>({});

  const refreshData = () => {
    setHabits(habitService.getHabits());
    setLogs(habitService.getHabitLogs());
    setStats(habitService.getUserStats());
    setHeatmapData(habitService.getYearlyProgress());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleUpdateProgress = (habitId: string, value: number) => {
    habitService.logActivity(habitId, value, selectedDate);
    // Haptic feedback on completion
    const habit = habits.find(h => h.id === habitId);
    if (habit && value >= habit.goal && navigator.vibrate) {
        navigator.vibrate(50);
    }
    refreshData();
  };

  const handleSaveHabit = (habit: Habit) => {
      if (editingHabit) {
          habitService.updateHabit(habit);
      } else {
          habitService.addNewHabit(habit);
      }
      setIsModalOpen(false);
      setEditingHabit(undefined);
      refreshData();
  };

  const handleDeleteHabit = (id: string) => {
      if(confirm('هل أنت متأكد من حذف هذه العادة؟')) {
          habitService.removeHabit(id);
          refreshData();
      }
  };

  const openEditModal = (habit: Habit) => {
      setEditingHabit(habit);
      setIsModalOpen(true);
  };

  // Week Calendar Logic
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 6 }); 
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter habits for current day
  const dayIndex = selectedDate.getDay();
  const todaysHabits = habits.filter(h => h.frequency.includes(dayIndex) && !h.archived);
  
  // Sort: Incomplete first
  todaysHabits.sort((a, b) => {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const valA = logs[dateKey]?.[a.id] || 0;
      const valB = logs[dateKey]?.[b.id] || 0;
      const completeA = valA >= a.goal;
      const completeB = valB >= b.goal;
      if (completeA === completeB) return 0;
      return completeA ? 1 : -1;
  });

  const getProgress = (habitId: string) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return logs[dateKey]?.[habitId] || 0;
  };

  return (
    <div className="pb-24 max-w-4xl mx-auto space-y-6 animate-fadeIn">
        
        {/* Header Dashboard - Clean Spiritual Style */}
        <div className="px-4 pt-6">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 dark:from-emerald-900 dark:to-teal-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 block">سجل الاستقامة</span>
                        <h2 className="text-3xl font-bold font-arabicHead">
                            {stats.level > 1 ? `مرحلة ${stats.level}` : 'البداية'}
                        </h2>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-col gap-1">
                                <span className="text-2xl font-bold">{stats.totalCompletions}</span>
                                <span className="text-xs text-emerald-200">إنجاز</span>
                            </div>
                            <div className="w-px h-8 bg-white/20"></div>
                            <div className="flex items-col gap-1">
                                <span className="text-2xl font-bold">{stats.xp}</span>
                                <span className="text-xs text-emerald-200">نقطة</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                        <Star size={32} className="text-yellow-300 fill-yellow-300" />
                    </div>
                </div>
            </div>
        </div>

        {/* Heatmap & Calendar Container */}
        <div className="px-2">
            <div className="bg-white dark:bg-dark-surface p-5 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm">
                
                {/* Heatmap Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Flame size={18} className="text-orange-500" />
                        الالتزام
                    </h3>
                </div>
                
                <div className="mb-6 overflow-x-auto pb-2">
                    <HabitHeatmap data={heatmapData} />
                </div>

                {/* Week Calendar */}
                <div className="border-t border-gray-100 dark:border-dark-border pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full transition-colors text-gray-500">
                            <ChevronRight size={18} />
                        </button>
                        <h4 className="font-bold text-gray-800 dark:text-white font-arabic text-sm">
                            {format(selectedDate, 'MMMM yyyy', { locale: arSA })}
                        </h4>
                        <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full transition-colors text-gray-500">
                            <ChevronLeft size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day, i) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const hasActivity = heatmapData[dateKey] > 0;

                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                                        flex flex-col items-center justify-center p-2 rounded-2xl transition-all relative
                                        ${isSelected 
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-105' 
                                            : 'bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                                    `}
                                >
                                    <span className="text-[10px] opacity-70 mb-0.5">{format(day, 'EEE', { locale: arSA })}</span>
                                    <span className="font-bold text-lg leading-none">{format(day, 'd')}</span>
                                    {hasActivity && !isSelected && (
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* Habits List */}
        <div className="px-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl text-gray-800 dark:text-white font-arabicHead flex items-center gap-2">
                    <CheckSquare size={20} className="text-emerald-500" />
                    مهام {isSameDay(selectedDate, new Date()) ? 'اليوم' : format(selectedDate, 'EEEE', { locale: arSA })}
                </h3>
                <button 
                    onClick={() => { setEditingHabit(undefined); setIsModalOpen(true); }}
                    className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    <span>إضافة</span>
                </button>
            </div>

            {todaysHabits.length === 0 ? (
                <div className="py-16 text-center text-gray-400 bg-white dark:bg-dark-surface rounded-3xl border border-dashed border-gray-200 dark:border-dark-border">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon size={32} className="opacity-50" />
                    </div>
                    <p>لا توجد مهام مجدولة لهذا اليوم</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-emerald-500 font-bold mt-2 hover:underline">أضف عادة جديدة</button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {todaysHabits.map(habit => (
                        <HabitCard 
                            key={habit.id} 
                            habit={habit} 
                            currentValue={getProgress(habit.id)}
                            onUpdate={(val) => handleUpdateProgress(habit.id, val)}
                            onLongPress={() => openEditModal(habit)}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && <HabitModal onClose={() => setIsModalOpen(false)} onSave={handleSaveHabit} initialData={editingHabit} onDelete={handleDeleteHabit} />}
    </div>
  );
};

// --- Refined Habit Card with Long Press ---
const HabitCard: React.FC<{ 
    habit: Habit; 
    currentValue: number; 
    onUpdate: (val: number) => void;
    onLongPress: () => void;
}> = ({ habit, currentValue, onUpdate, onLongPress }) => {
    const isCompleted = currentValue >= habit.goal;
    const progress = Math.min(100, (currentValue / habit.goal) * 100);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleStartPress = () => {
        pressTimer.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            onLongPress();
        }, 600); // 600ms long press
    };

    const handleEndPress = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
    };

    return (
        <div 
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            className={`
            bg-white dark:bg-dark-surface rounded-2xl p-4 border transition-all relative overflow-hidden group select-none
            ${isCompleted ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-dark-border'}
        `}>
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm transition-colors ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-500'}`}>
                        {isCompleted ? <Check size={24} /> : habit.icon}
                    </div>
                    <div>
                        <h4 className={`font-bold font-arabicHead text-lg ${isCompleted ? 'text-emerald-800 dark:text-emerald-300 line-through opacity-70' : 'text-gray-800 dark:text-white'}`}>
                            {habit.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            {habit.streak > 0 && (
                                <span className="flex items-center gap-0.5 text-orange-500 font-bold">
                                    <Flame size={12} fill="currentColor" /> {habit.streak}
                                </span>
                            )}
                            {habit.goal > 1 && (
                                <span>{currentValue} / {habit.goal} {habit.unit}</span>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Action Button (Big Target) */}
                <div className="flex items-center">
                    {habit.type === 'numeric' ? (
                        <div className="flex items-center bg-gray-100 dark:bg-dark-bg rounded-xl p-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onUpdate(Math.max(0, currentValue - 1)); }}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-dark-surface shadow-sm text-gray-500 hover:text-red-500 active:scale-95 transition-transform"
                            >
                                -
                            </button>
                            <span className="w-10 text-center font-bold">{currentValue}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onUpdate(currentValue + 1); }}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-dark-surface shadow-sm text-gray-500 hover:text-emerald-500 active:scale-95 transition-transform"
                            >
                                +
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdate(isCompleted ? 0 : 1); }}
                            className={`
                                w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90
                                ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-elevated'}
                            `}
                        >
                            <Check size={24} />
                        </button>
                    )}
                </div>
            </div>
            
            {/* Progress Bar for Numeric */}
            {habit.type !== 'boolean' && (
                <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ease-out ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};

const HabitModal: React.FC<{ onClose: () => void; onSave: (h: Habit) => void; initialData?: Habit; onDelete?: (id: string) => void }> = ({ onClose, onSave, initialData, onDelete }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [type, setType] = useState<HabitType>(initialData?.type || 'boolean');
    const [goal, setGoal] = useState(initialData?.goal || 1);
    const [unit, setUnit] = useState(initialData?.unit || '');
    const [category, setCategory] = useState<HabitCategory>(initialData?.category || 'spiritual');
    
    // Frequency Logic
    const [frequencyMode, setFrequencyMode] = useState<'daily' | 'custom'>(
        (initialData?.frequency?.length === 7 || !initialData) ? 'daily' : 'custom'
    );
    const [frequency, setFrequency] = useState<number[]>(initialData?.frequency || [0,1,2,3,4,5,6]);

    const handleModeChange = (mode: 'daily' | 'custom') => {
        setFrequencyMode(mode);
        if (mode === 'daily') {
            setFrequency([0, 1, 2, 3, 4, 5, 6]);
        } else {
            // Keep current if switching to custom, or default to all if empty
            if (frequency.length === 0) setFrequency([0, 1, 2, 3, 4, 5, 6]);
        }
    };

    const handleDayToggle = (dayId: number) => {
        if (frequency.includes(dayId)) {
            if (frequency.length > 1) {
                setFrequency(frequency.filter(d => d !== dayId));
            }
        } else {
            setFrequency([...frequency, dayId]);
        }
    };

    const DAYS = [
        { id: 6, label: 'س' }, // Saturday
        { id: 0, label: 'ح' }, // Sunday
        { id: 1, label: 'ن' }, // Monday
        { id: 2, label: 'ث' }, // Tuesday
        { id: 3, label: 'ر' }, // Wednesday
        { id: 4, label: 'خ' }, // Thursday
        { id: 5, label: 'ج' }, // Friday
    ];
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: initialData?.id || Date.now().toString(),
            title,
            type,
            category,
            systemType: initialData?.systemType || 'none',
            goal: type === 'timer' ? goal * 60 : goal,
            unit: type === 'boolean' ? 'مرة' : unit,
            color: 'bg-emerald-500', // Unifying theme color
            icon: category === 'spiritual' ? '📿' : category === 'health' ? '💪' : '✨',
            frequency: frequency,
            streak: initialData?.streak || 0, 
            bestStreak: initialData?.bestStreak || 0, 
            totalCompletions: initialData?.totalCompletions || 0, 
            archived: false
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-dark-surface w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white font-arabicHead">{initialData ? 'تعديل العادة' : 'إضافة عادة جديدة'}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-dark-bg rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">اسم العادة</label>
                        <input 
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-bg border-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-arabic"
                            placeholder="مثلاً: قراءة سورة الكهف"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Recurrence Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">
                            <Repeat size={16} />
                            التكرار
                        </label>
                        <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-xl mb-3">
                            <button
                                type="button"
                                onClick={() => handleModeChange('daily')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${frequencyMode === 'daily' ? 'bg-white dark:bg-dark-surface text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                يومياً
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeChange('custom')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${frequencyMode === 'custom' ? 'bg-white dark:bg-dark-surface text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                أيام محددة
                            </button>
                        </div>

                        {frequencyMode === 'custom' && (
                            <div className="flex justify-between gap-1 mb-4 animate-fadeIn">
                                {DAYS.map(day => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => handleDayToggle(day.id)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                                            ${frequency.includes(day.id) 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'bg-gray-100 dark:bg-dark-bg text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-elevated'}
                                        `}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">التصنيف</label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-bg border-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-arabic"
                            >
                                <option value="spiritual">روحاني</option>
                                <option value="health">صحي</option>
                                <option value="personal">شخصي</option>
                                <option value="sunnah">سنة</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">النوع</label>
                            <select 
                                value={type}
                                onChange={(e) => setType(e.target.value as HabitType)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-bg border-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-arabic"
                            >
                                <option value="boolean">نعم/لا</option>
                                <option value="numeric">عداد</option>
                            </select>
                        </div>
                    </div>

                    {type !== 'boolean' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2">الهدف اليومي</label>
                                <input 
                                    type="number"
                                    min="1"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-bg border-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-bold text-center"
                                    value={goal}
                                    onChange={e => setGoal(parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2">الوحدة</label>
                                <input 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-bg border-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-arabic"
                                    placeholder="مثلاً: صفحة"
                                    value={unit}
                                    onChange={e => setUnit(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 mt-4"
                    >
                        حفظ
                    </button>
                    
                    {initialData && onDelete && (
                        <button 
                            type="button"
                            onClick={() => onDelete(initialData.id)}
                            className="w-full py-3 rounded-xl text-red-500 font-bold bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            حذف العادة
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Habits;
