
import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Trash2, Bell, Plus, Type, Calendar, Minus, Volume2, Vibrate, Book, Download, Upload, Palette, Check, Menu, ArrowUp, ArrowDown, X } from 'lucide-react';
import * as storage from '../services/storage';
import { CATEGORIES } from '../data';
import { ALL_NAV_ITEMS } from '../components/Layout';

interface SettingsProps {
  darkMode: boolean;
  toggleTheme: () => void;
  currentAccent: storage.AccentTheme;
}

const Settings: React.FC<SettingsProps> = ({ darkMode, toggleTheme, currentAccent }) => {
  const [fontSize, setFontSize] = useState<storage.FontSize>('medium');
  const [hijriOffset, setHijriOffset] = useState<number>(0);
  const [reminders, setReminders] = useState<storage.Reminder[]>([]);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderLabel, setNewReminderLabel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [navOrder, setNavOrder] = useState<string[]>([]);
  const [notifSettings, setNotifSettings] = useState<storage.NotificationSettings>({ soundEnabled: true, vibrationType: 'default' });
  const [accent, setAccent] = useState<storage.AccentTheme>(currentAccent);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFontSize(storage.getFontSize());
    setReminders(storage.getReminders());
    setHijriOffset(storage.getHijriOffset());
    setNotifSettings(storage.getNotificationSettings());
    setNavOrder(storage.getNavOrder());
    setAccent(storage.getAccentTheme());
  }, []);

  const changeFontSize = (size: storage.FontSize) => {
    setFontSize(size);
    storage.saveFontSize(size);
  };

  const changeHijriOffset = (delta: number) => {
    const newOffset = hijriOffset + delta;
    if (newOffset >= -5 && newOffset <= 5) {
      setHijriOffset(newOffset);
      storage.saveHijriOffset(newOffset);
    }
  };

  const updateNotifSettings = (newSettings: Partial<storage.NotificationSettings>) => {
    const updated = { ...notifSettings, ...newSettings };
    setNotifSettings(updated);
    storage.saveNotificationSettings(updated);
  };

  const changeAccent = (newAccent: storage.AccentTheme) => {
    setAccent(newAccent);
    storage.saveAccentTheme(newAccent);
    window.dispatchEvent(new Event('accent-changed'));
  };

  const clearData = () => {
     if(confirm('هل أنت متأكد من مسح جميع البيانات؟\nسيتم حذف:\n- سجل الإنجازات\n- المفضلة\n- العدادات المحفوظة\n\nلا يمكن التراجع عن هذا الإجراء.')) {
        localStorage.clear();
        localStorage.setItem('nour_theme', darkMode ? 'dark' : 'light');
        window.location.reload();
    }
  };

  const handleExport = () => {
    const data = storage.exportUserData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `rayyan-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
            if (confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية.')) {
                const success = storage.importUserData(content);
                if (success) {
                    alert('تم استعادة البيانات بنجاح! سيتم إعادة تحميل التطبيق.');
                    window.location.reload();
                } else {
                    alert('فشل استعادة البيانات. الملف غير صالح.');
                }
            }
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleMoveNav = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...navOrder];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newOrder.length) {
          [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
          setNavOrder(newOrder);
          storage.saveNavOrder(newOrder);
          window.dispatchEvent(new Event('nav-settings-updated'));
      }
  };

  const handleRemoveNav = (id: string) => {
      if (navOrder.length <= 2) {
          alert("يجب اختيار عنصرين على الأقل");
          return;
      }
      const newOrder = navOrder.filter(item => item !== id);
      setNavOrder(newOrder);
      storage.saveNavOrder(newOrder);
      window.dispatchEvent(new Event('nav-settings-updated'));
  };

  const handleAddNav = (id: string) => {
      if (navOrder.length >= 5) {
          alert("الحد الأقصى هو 5 عناصر في القائمة");
          return;
      }
      const newOrder = [...navOrder, id];
      setNavOrder(newOrder);
      storage.saveNavOrder(newOrder);
      window.dispatchEvent(new Event('nav-settings-updated'));
  };

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
        enabled: true,
        targetPath: selectedCategory ? `/category/${selectedCategory}` : undefined
    };
    storage.addReminder(newReminder);
    setReminders(storage.getReminders());
    setIsAddingReminder(false);
    setNewReminderTime('');
    setNewReminderLabel('');
    setSelectedCategory('');
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

  const getPreviewFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-xl';
      case 'medium': return 'text-2xl';
      case 'large': return 'text-3xl';
      case 'xlarge': return 'text-4xl';
      default: return 'text-2xl';
    }
  };

  const SettingsItem = ({ icon: Icon, label, description, action, danger = false }: any) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-dark-panel text-gray-600 dark:text-dark-secondary'}`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className={`font-bold text-body-lg font-arabic ${danger ? 'text-red-500' : 'text-gray-800 dark:text-dark-text'}`}>{label}</h3>
          {description && <p className="text-body-sm text-gray-500 dark:text-dark-muted mt-0.5">{description}</p>}
        </div>
      </div>
      <div>{action}</div>
    </div>
  );

  const Toggle = ({ checked, onChange, label }: any) => (
    <button 
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`
        relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${checked ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-gray-300 dark:bg-gray-600'}
      `}
    >
      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${checked ? 'left-1' : 'left-[calc(100%-1.75rem)]'}`} />
    </button>
  );

  const accentThemes: { id: storage.AccentTheme; color: string; label: string }[] = [
    { id: 'emerald', color: 'bg-[#10B981]', label: 'أخضر' },
    { id: 'blue', color: 'bg-[#3b82f6]', label: 'أزرق' },
    { id: 'purple', color: 'bg-[#a855f7]', label: 'بنفسجي' },
    { id: 'rose', color: 'bg-[#f43f5e]', label: 'وردي' },
    { id: 'amber', color: 'bg-[#f59e0b]', label: 'كهرماني' },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-h1 text-gray-800 dark:text-white mb-2 font-arabicHead">الإعدادات</h1>
        <p className="text-body-md text-gray-500 dark:text-dark-secondary">تخصيص تجربة التطبيق</p>
      </div>

      <div className="space-y-4">
        
        {/* --- App Theme Section --- */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-gray-100 dark:bg-dark-panel text-gray-600 dark:text-dark-secondary">
                    <Palette size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-body-lg text-gray-800 dark:text-dark-text font-arabic">سمة التطبيق</h3>
                    <p className="text-body-sm text-gray-500 dark:text-dark-muted mt-0.5">اختر لونك المفضل لواجهة ريان</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                {accentThemes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => changeAccent(t.id)}
                        className={`
                            relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm
                            ${t.color}
                            ${accent === t.id ? 'ring-4 ring-offset-2 ring-primary-300 dark:ring-primary-700 scale-110 shadow-lg' : 'hover:scale-105'}
                        `}
                        title={t.label}
                    >
                        {accent === t.id && (
                            <div className="bg-white/30 backdrop-blur rounded-full p-1 animate-scaleIn">
                                <Check size={16} className="text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-panel rounded-xl border border-gray-100 dark:border-dark-border transition-colors">
                <div className="flex items-center gap-3">
                    {darkMode ? <Moon size={20} className="text-primary-500" /> : <Sun size={20} className="text-primary-500" />}
                    <span className="text-body-sm font-bold text-gray-700 dark:text-gray-200">الوضع {darkMode ? 'الليلي' : 'النهاري'}</span>
                </div>
                <Toggle checked={darkMode} onChange={toggleTheme} label="تبديل المظهر" />
            </div>
        </div>

        {/* Customize Menu Section */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-gray-100 dark:bg-dark-panel text-gray-600 dark:text-dark-secondary">
                    <Menu size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-body-lg text-gray-800 dark:text-dark-text font-arabic">ترتيب القائمة</h3>
                    <p className="text-body-sm text-gray-500 dark:text-dark-muted mt-0.5">اسحب أو استخدم الأسهم لترتيب العناصر (الحد الأقصى 5)</p>
                </div>
            </div>

            <div className="space-y-2 mb-6">
                {navOrder.map((id, index) => {
                    const item = ALL_NAV_ITEMS[id];
                    if (!item) return null;
                    return (
                        <div key={id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-panel rounded-xl border border-gray-100 dark:border-dark-border animate-slideUp">
                            <div className="flex items-center gap-3">
                                <div className="text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-surface p-2 rounded-lg">
                                    {item.icon}
                                </div>
                                <span className="font-bold text-gray-800 dark:text-white font-arabic">{item.label}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => handleMoveNav(index, 'up')}
                                    disabled={index === 0}
                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-dark-surface rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ArrowUp size={18} />
                                </button>
                                <button 
                                    onClick={() => handleMoveNav(index, 'down')}
                                    disabled={index === navOrder.length - 1}
                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-dark-surface rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ArrowDown size={18} />
                                </button>
                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                <button 
                                    onClick={() => handleRemoveNav(id)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    title="إزالة"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-dark-border">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">عناصر متاحة للإضافة</h4>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(ALL_NAV_ITEMS)
                        .filter(([id]) => !navOrder.includes(id))
                        .map(([id, item]) => (
                            <button
                                key={id}
                                onClick={() => handleAddNav(id)}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-dark-panel hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl border border-gray-100 dark:border-dark-border hover:border-primary-200 dark:hover:border-primary-800 transition-all"
                            >
                                <Plus size={16} />
                                <span className="font-bold text-sm">{item.label}</span>
                            </button>
                        ))
                    }
                </div>
            </div>
        </div>

        {/* Reminder Section */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-gray-100 dark:bg-dark-panel text-gray-600 dark:text-dark-secondary">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-body-lg text-gray-800 dark:text-dark-text font-arabic">التنبيهات اليومية</h3>
                        <p className="text-body-sm text-gray-500 dark:text-dark-muted mt-0.5">جدولة تذكيرات للأذكار</p>
                    </div>
                </div>
                {!isAddingReminder && (
                    <button 
                        onClick={() => setIsAddingReminder(true)}
                        className="flex items-center gap-1 text-btn bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-3 py-2 rounded-xl font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                    >
                        <Plus size={16} />
                        إضافة
                    </button>
                )}
             </div>

             {isAddingReminder && (
                 <div className="bg-gray-50 dark:bg-dark-panel rounded-xl p-4 mb-4 animate-slideUp border border-gray-100 dark:border-dark-border">
                     <div className="flex flex-col gap-3">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             <div className="flex flex-col gap-1">
                                 <label className="text-caption font-bold text-gray-500">اسم التذكير</label>
                                 <input 
                                    type="text" 
                                    value={newReminderLabel}
                                    onChange={(e) => setNewReminderLabel(e.target.value)}
                                    placeholder="مثلاً: أذكار الصباح"
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-body-sm font-arabic"
                                 />
                             </div>
                             <div className="flex flex-col gap-1">
                                 <label className="text-caption font-bold text-gray-500">الوقت</label>
                                 <input 
                                    type="time" 
                                    value={newReminderTime}
                                    onChange={(e) => setNewReminderTime(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-body-sm"
                                 />
                             </div>
                         </div>
                         <div className="flex gap-2 mt-2">
                             <button onClick={() => setIsAddingReminder(false)} className="flex-1 py-2 text-btn font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-elevated rounded-lg transition-colors">إلغاء</button>
                             <button onClick={handleAddReminder} disabled={!newReminderTime || !newReminderLabel} className="flex-1 py-2 text-btn font-bold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50">حفظ</button>
                         </div>
                     </div>
                 </div>
             )}

             <div className="space-y-3">
                 {reminders.length === 0 && !isAddingReminder && (
                     <div className="text-center py-4 text-gray-400 text-body-sm">لا توجد تنبيهات محفوظة</div>
                 )}
                 {reminders.map(reminder => (
                     <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-panel rounded-xl border border-gray-100 dark:border-dark-border">
                         <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-h4 text-primary-600 dark:text-primary-400 bg-white dark:bg-dark-bg px-2 py-1 rounded-lg border border-gray-100 dark:border-dark-border">{reminder.time}</span>
                            <span className="font-medium text-body-md text-gray-700 dark:text-dark-text font-arabic">{reminder.label}</span>
                         </div>
                         <div className="flex items-center gap-3">
                             <Toggle checked={reminder.enabled} onChange={() => toggleReminder(reminder.id)} label={`تفعيل ${reminder.label}`} />
                             <button onClick={() => handleDeleteReminder(reminder.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-gray-100 dark:bg-dark-panel text-gray-600 dark:text-dark-secondary">
                    <Download size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-body-lg text-gray-800 dark:text-dark-text font-arabic">إدارة البيانات</h3>
                    <p className="text-body-sm text-gray-500 dark:text-dark-muted mt-0.5">نسخ واستعادة بياناتك يدوياً (ملف)</p>
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-dark-elevated text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-dark-surface transition-colors">
                    <Download size={18} /> تصدير نسخة
                </button>
                <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-dark-elevated text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-dark-surface transition-colors">
                    <Upload size={18} /> استعادة نسخة
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            </div>
        </div>

        {/* Hijri Date Offset */}
        <SettingsItem
          icon={Calendar}
          label="تعديل التاريخ الهجري"
          description={`ضبط التاريخ يدوياً (${hijriOffset > 0 ? '+' : ''}${hijriOffset} يوم)`}
          action={
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-dark-panel rounded-lg p-1">
              <button onClick={() => changeHijriOffset(-1)} className="p-1 hover:bg-white dark:hover:bg-dark-elevated rounded-md shadow-sm transition-all text-gray-600 dark:text-gray-300"><Minus size={16} /></button>
              <span className="text-body-sm font-bold w-4 text-center text-gray-800 dark:text-white">{hijriOffset}</span>
              <button onClick={() => changeHijriOffset(1)} className="p-1 hover:bg-white dark:hover:bg-dark-elevated rounded-md shadow-sm transition-all text-gray-600 dark:text-gray-300"><Plus size={16} /></button>
            </div>
          }
        />

        {/* Font Size Settings */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-gray-100 dark:bg-dark-panel text-gray-600 dark:text-dark-secondary"><Type size={24} /></div>
            <div>
              <h3 className="font-bold text-body-lg text-gray-800 dark:text-dark-text font-arabic">حجم الخط</h3>
              <p className="text-body-sm text-gray-500 dark:text-dark-muted mt-0.5">تغيير حجم خط الأذكار</p>
            </div>
          </div>
          <div className="flex bg-gray-100 dark:bg-dark-panel rounded-xl p-1 gap-1 mb-4">
            {(['small', 'medium', 'large', 'xlarge'] as storage.FontSize[]).map((size) => (
               <button key={size} onClick={() => changeFontSize(size)} className={`flex-1 py-2 rounded-lg text-btn font-bold transition-all ${fontSize === size ? 'bg-white dark:bg-dark-elevated text-primary-600 shadow-sm ring-1 ring-gray-200 dark:ring-dark-border' : 'text-gray-500 hover:text-gray-700'}`}>
                 {({ small: 'صغير', medium: 'متوسط', large: 'كبير', xlarge: 'ضخم' } as any)[size]}
               </button>
            ))}
          </div>
          <div className="p-6 bg-gray-50 dark:bg-dark-panel rounded-xl border border-dashed border-gray-200 dark:border-dark-border text-center">
             <p className={`font-arabic text-gray-800 dark:text-dark-text leading-loose transition-all duration-300 ${getPreviewFontSizeClass()}`}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          </div>
        </div>

        {/* Clear Data Section */}
        <SettingsItem icon={Trash2} label="حذف البيانات" description="مسح كافة السجلات والمفضلة" danger={true} action={<button onClick={clearData} className="px-4 py-2 text-btn font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-900/50">حذف</button>} />
      </div>
    </div>
  );
};

export default Settings;
