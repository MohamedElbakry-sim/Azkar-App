
import React, { useState, useEffect } from 'react';
import { Moon, Sun, Trash2, Bell, Plus, Type } from 'lucide-react';
import * as storage from '../services/storage';

interface SettingsProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ darkMode, toggleTheme }) => {
  const [fontSize, setFontSize] = useState<storage.FontSize>('medium');
  
  // Reminder State
  const [reminders, setReminders] = useState<storage.Reminder[]>([]);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderLabel, setNewReminderLabel] = useState('');

  useEffect(() => {
    setFontSize(storage.getFontSize());
    setReminders(storage.getReminders());
  }, []);

  const changeFontSize = (size: storage.FontSize) => {
    setFontSize(size);
    storage.saveFontSize(size);
  };

  const clearData = () => {
     if(confirm('هل أنت متأكد من مسح جميع البيانات؟\nسيتم حذف:\n- سجل الإنجازات\n- المفضلة\n- العدادات المحفوظة\n\nلا يمكن التراجع عن هذا الإجراء.')) {
        localStorage.clear();
        localStorage.setItem('nour_theme', darkMode ? 'dark' : 'light');
        window.location.reload();
    }
  };

  // --- Reminder Handlers ---

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        alert("هذا المتصفح لا يدعم التنبيهات.");
        return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
  };

  const handleAddReminder = async () => {
    if (!newReminderTime || !newReminderLabel) return;
    
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
        alert("يرجى السماح بالتنبيهات لتفعيل هذه الميزة.");
        return;
    }

    const newReminder: storage.Reminder = {
        id: Date.now().toString(),
        time: newReminderTime,
        label: newReminderLabel,
        enabled: true
    };
    
    storage.addReminder(newReminder);
    setReminders(storage.getReminders());
    setIsAddingReminder(false);
    setNewReminderTime('');
    setNewReminderLabel('');
  };

  const handleDeleteReminder = (id: string) => {
    storage.deleteReminder(id);
    setReminders(storage.getReminders());
  };

  const toggleReminder = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
        storage.updateReminder({ ...reminder, enabled: !reminder.enabled });
        setReminders(storage.getReminders());
    }
  };

  // --- Render Helpers ---

  const getPreviewFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-xl md:text-2xl';
      case 'medium': return 'text-2xl md:text-3xl';
      case 'large': return 'text-3xl md:text-4xl';
      case 'xlarge': return 'text-4xl md:text-5xl';
      default: return 'text-2xl md:text-3xl';
    }
  };

  const SettingsItem = ({ 
    icon: Icon, 
    label, 
    description, 
    action,
    danger = false
  }: { 
    icon: any, 
    label: string, 
    description?: string, 
    action: React.ReactNode,
    danger?: boolean
  }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-300'}`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className={`font-bold ${danger ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>{label}</h3>
          {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div>{action}</div>
    </div>
  );

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) => (
    <button 
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`
        relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'}
      `}
    >
      <div 
        className={`
          absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300
          ${checked ? 'left-1' : 'left-[calc(100%-1.75rem)]'}
        `} 
      />
    </button>
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">الإعدادات</h2>
        <p className="text-gray-500 dark:text-gray-400">تخصيص تجربة التطبيق</p>
      </div>

      <div className="space-y-4">
        {/* Reminder Section */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-300">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">التنبيهات اليومية</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">جدولة تذكيرات للأذكار</p>
                    </div>
                </div>
                {!isAddingReminder && (
                    <button 
                        onClick={() => setIsAddingReminder(true)}
                        className="flex items-center gap-1 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-3 py-2 rounded-xl font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                    >
                        <Plus size={16} />
                        إضافة
                    </button>
                )}
             </div>

             {isAddingReminder && (
                 <div className="bg-gray-50 dark:bg-dark-bg/50 rounded-xl p-4 mb-4 animate-slideUp">
                     <div className="flex flex-col gap-3">
                         <div className="grid grid-cols-2 gap-3">
                             <div className="flex flex-col gap-1">
                                 <label className="text-xs font-bold text-gray-500">اسم التذكير</label>
                                 <input 
                                    type="text" 
                                    value={newReminderLabel}
                                    onChange={(e) => setNewReminderLabel(e.target.value)}
                                    placeholder="مثلاً: أذكار الصباح"
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
                                 />
                             </div>
                             <div className="flex flex-col gap-1">
                                 <label className="text-xs font-bold text-gray-500">الوقت</label>
                                 <input 
                                    type="time" 
                                    value={newReminderTime}
                                    onChange={(e) => setNewReminderTime(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
                                 />
                             </div>
                         </div>
                         <div className="flex gap-2 mt-2">
                             <button 
                                onClick={() => setIsAddingReminder(false)}
                                className="flex-1 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                             >
                                 إلغاء
                             </button>
                             <button 
                                onClick={handleAddReminder}
                                disabled={!newReminderTime || !newReminderLabel}
                                className="flex-1 py-2 text-sm font-bold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                             >
                                 حفظ
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             <div className="space-y-3">
                 {reminders.length === 0 && !isAddingReminder && (
                     <div className="text-center py-4 text-gray-400 text-sm">
                         لا توجد تنبيهات محفوظة
                     </div>
                 )}
                 {reminders.map(reminder => (
                     <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-dark-border/50">
                         <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-lg text-primary-600 dark:text-primary-400 bg-white dark:bg-dark-surface px-2 py-1 rounded-lg border border-gray-100 dark:border-dark-border">
                                {reminder.time}
                            </span>
                            <span className="font-medium text-gray-700 dark:text-gray-200">{reminder.label}</span>
                         </div>
                         <div className="flex items-center gap-3">
                             <Toggle 
                                checked={reminder.enabled} 
                                onChange={() => toggleReminder(reminder.id)}
                                label={`تفعيل ${reminder.label}`} 
                             />
                             <button 
                                onClick={() => handleDeleteReminder(reminder.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                             >
                                 <Trash2 size={18} />
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        {/* Theme Toggle */}
        <SettingsItem 
          icon={darkMode ? Moon : Sun}
          label="المظهر"
          description={darkMode ? 'الوضع الليلي مفعل' : 'الوضع النهاري مفعل'}
          action={<Toggle checked={darkMode} onChange={toggleTheme} label="تبديل المظهر (ليلي/نهاري)" />}
        />

        {/* Font Size Settings */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-300">
              <Type size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">حجم الخط</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">تغيير حجم خط الأذكار</p>
            </div>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-dark-bg rounded-xl p-1 gap-1 mb-4">
            {(['small', 'medium', 'large', 'xlarge'] as storage.FontSize[]).map((size) => {
               const labels: Record<string, string> = { small: 'صغير', medium: 'متوسط', large: 'كبير', xlarge: 'ضخم' };
               return (
                 <button
                   key={size}
                   onClick={() => changeFontSize(size)}
                   className={`
                     flex-1 py-2 rounded-lg text-sm font-bold transition-all
                     ${fontSize === size 
                       ? 'bg-white dark:bg-dark-surface text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-gray-200 dark:ring-dark-border' 
                       : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
                   `}
                 >
                   {labels[size]}
                 </button>
               );
            })}
          </div>

          {/* Font Preview Box */}
          <div className="p-6 bg-gray-50 dark:bg-dark-bg rounded-xl border border-dashed border-gray-200 dark:border-dark-border text-center transition-all">
             <p className={`font-serif text-gray-800 dark:text-gray-100 leading-loose transition-all duration-300 ${getPreviewFontSizeClass()}`}>
               بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
             </p>
             <p className="text-xs text-gray-400 mt-2">معاينة النص</p>
          </div>
        </div>

        <div className="my-8 border-t border-gray-200 dark:border-gray-700"></div>

        {/* Clear Data */}
        <SettingsItem 
          icon={Trash2}
          label="حذف البيانات"
          description="مسح كافة السجلات والمفضلة"
          danger={true}
          action={
            <button 
              onClick={clearData}
              className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="حذف جميع البيانات"
            >
              حذف
            </button>
          }
        />
      </div>

      <div className="mt-12 text-center">
         <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
           Nour App v1.3.0
         </p>
      </div>
    </div>
  );
};

export default Settings;
