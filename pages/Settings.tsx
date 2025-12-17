
import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Trash2, Bell, Plus, Type, Calendar, Minus, Volume2, Vibrate, Book, Download, Upload, AlertTriangle, Menu, ArrowUp, ArrowDown, X, User, LogOut, RefreshCw, CheckCircle } from 'lucide-react';
import * as storage from '../services/storage';
import { CATEGORIES } from '../data';
import { ALL_NAV_ITEMS } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SettingsProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ darkMode, toggleTheme }) => {
  const [fontSize, setFontSize] = useState<storage.FontSize>('medium');
  const [hijriOffset, setHijriOffset] = useState<number>(0);
  const [reminders, setReminders] = useState<storage.Reminder[]>([]);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderLabel, setNewReminderLabel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [navOrder, setNavOrder] = useState<string[]>([]);
  const [notifSettings, setNotifSettings] = useState<storage.NotificationSettings>({ soundEnabled: true, vibrationType: 'default' });
  const [isSyncing, setIsSyncing] = useState(false);

  // Auth Context
  const { currentUser, logout, syncData, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFontSize(storage.getFontSize());
    setReminders(storage.getReminders());
    setHijriOffset(storage.getHijriOffset());
    setNotifSettings(storage.getNotificationSettings());
    setNavOrder(storage.getNavOrder());
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

  const clearData = () => {
     if(confirm('هل أنت متأكد من مسح جميع البيانات؟\nسيتم حذف:\n- سجل الإنجازات\n- المفضلة\n- العدادات المحفوظة\n\nلا يمكن التراجع عن هذا الإجراء.')) {
        localStorage.clear();
        localStorage.setItem('nour_theme', darkMode ? 'dark' : 'light');
        window.location.reload();
    }
  };

  const handleManualSync = async () => {
      setIsSyncing(true);
      try {
          await syncData();
          alert('تمت المزامنة بنجاح!');
      } catch (e) {
          alert('فشل المزامنة. تحقق من الاتصال.');
      } finally {
          setIsSyncing(false);
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

  // Nav Settings Handlers
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

  // Reminder Handlers
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
      case 'small': return 'text-h3 md:text-h2';
      case 'medium': return 'text-h2 md:text-h1';
      case 'large': return 'text-[30px] md:text-[36px]';
      case 'xlarge': return 'text-[34px] md:text-[42px]';
      default: return 'text-h2 md:text-h1';
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-h1 text-gray-800 dark:text-white mb-2 font-arabicHead">الإعدادات</h1>
        <p className="text-body-md text-gray-500 dark:text-dark-secondary">تخصيص تجربة التطبيق</p>
      </div>

      <div className="space-y-4">
        
        {/* Profile & Sync Section */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                            {currentUser ? (currentUser.displayName ? currentUser.displayName[0] : currentUser.email ? currentUser.email[0].toUpperCase() : <User />) : <User />}
                        </div>
                        <div>
                            <h3 className="font-bold text-xl font-arabicHead">
                                {currentUser ? (currentUser.displayName || 'مستخدم') : 'حساب زائر'}
                            </h3>
                            <p className="text-emerald-100 text-sm font-english">
                                {currentUser ? currentUser.email : 'لم يتم تسجيل الدخول'}
                            </p>
                        </div>
                    </div>
                    {currentUser && (
                        <button onClick={logout} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors" title="تسجيل الخروج">
                            <LogOut size={20} />
                        </button>
                    )}
                </div>
            </div>
            
            <div className="p-4">
                {currentUser ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                            <CheckCircle size={16} />
                            <span>المزامنة مفعلة</span>
                        </div>
                        <button 
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                        >
                            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                            {isSyncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">سجل دخولك لحفظ بياناتك ومزامنتها عبر الأجهزة.</p>
                        <button 
                            onClick={() => navigate('/auth')}
                            className="w-full md:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary-500/20"
                        >
                            تسجيل الدخول / إنشاء حساب
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* ... Existing Settings Components ... */}
        
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
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-dark-panel hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl border border-gray-100 dark:border-dark-border hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
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

             {/* Reminder Customization */}
             <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-panel rounded-xl border border-gray-100 dark:border-dark-border">
                <h4 className="text-caption font-bold text-gray-500 dark:text-dark-muted uppercase tracking-wider mb-3">تخصيص التنبيهات</h4>
                
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Volume2 size={18} className="text-gray-400" />
                        <span className="text-body-sm font-medium text-gray-700 dark:text-gray-200">صوت التنبيه (النظام)</span>
                    </div>
                    <Toggle 
                        checked={notifSettings.soundEnabled} 
                        onChange={() => updateNotifSettings({ soundEnabled: !notifSettings.soundEnabled })} 
                        label="تفعيل الصوت"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 mb-1">
                        <Vibrate size={18} className="text-gray-400" />
                        <span className="text-body-sm font-medium text-gray-700 dark:text-gray-200">نمط الاهتزاز</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {(['default', 'short', 'long', 'pulse', 'none'] as storage.VibrationType[]).map((type) => {
                            const labels: Record<string, string> = { default: 'افتراضي', short: 'قصير', long: 'طويل', pulse: 'نبضات', none: 'بدون' };
                            return (
                                <button
                                    key={type}
                                    onClick={() => {
                                        updateNotifSettings({ vibrationType: type });
                                        if (navigator.vibrate && type !== 'none') {
                                            navigator.vibrate(storage.getVibrationPattern(type));
                                        }
                                    }}
                                    className={`
                                        px-2 py-2 text-caption font-bold rounded-lg transition-colors border
                                        ${notifSettings.vibrationType === type 
                                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm border-transparent' 
                                            : 'bg-white dark:bg-dark-elevated text-gray-600 dark:text-dark-secondary border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface'}
                                    `}
                                >
                                    {labels[type]}
                                </button>
                            );
                        })}
                    </div>
                </div>
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
                             <div className="flex flex-col gap-1 md:col-span-2">
                                 <label className="text-caption font-bold text-gray-500">ربط بقسم (اختياري)</label>
                                 <select 
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        if(!newReminderLabel && e.target.value) {
                                            const cat = CATEGORIES.find(c => c.id === e.target.value);
                                            if(cat) setNewReminderLabel(cat.title);
                                        }
                                    }}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-body-sm font-arabic"
                                 >
                                     <option value="">عام (بدون رابط)</option>
                                     {CATEGORIES.map(cat => (
                                         <option key={cat.id} value={cat.id}>{cat.title}</option>
                                     ))}
                                 </select>
                             </div>
                         </div>
                         <div className="flex gap-2 mt-2">
                             <button 
                                onClick={() => setIsAddingReminder(false)}
                                className="flex-1 py-2 text-btn font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-elevated rounded-lg transition-colors"
                             >
                                 إلغاء
                             </button>
                             <button 
                                onClick={handleAddReminder}
                                disabled={!newReminderTime || !newReminderLabel}
                                className="flex-1 py-2 text-btn font-bold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                             >
                                 حفظ
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             <div className="space-y-3">
                 {reminders.length === 0 && !isAddingReminder && (
                     <div className="text-center py-4 text-gray-400 text-body-sm">
                         لا توجد تنبيهات محفوظة
                     </div>
                 )}
                 {reminders.map(reminder => (
                     <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-panel rounded-xl border border-gray-100 dark:border-dark-border">
                         <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-h4 text-primary-600 dark:text-primary-400 bg-white dark:bg-dark-bg px-2 py-1 rounded-lg border border-gray-100 dark:border-dark-border">
                                {reminder.time}
                            </span>
                            <div className="flex flex-col">
                                <span className="font-medium text-body-md text-gray-700 dark:text-dark-text font-arabic">{reminder.label}</span>
                                {reminder.targetPath && (
                                    <span className="text-[10px] text-primary-500 flex items-center gap-1">
                                        <Book size={10} />
                                        مرتبط بالقسم
                                    </span>
                                )}
                            </div>
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

        {/* Data Management Section (Manual Backup/Restore) */}
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
                <button 
                    onClick={handleExport}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-dark-elevated text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-dark-surface transition-colors"
                >
                    <Download size={18} />
                    تصدير نسخة
                </button>
                <button 
                    onClick={handleImportClick}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-dark-elevated text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-dark-surface transition-colors"
                >
                    <Upload size={18} />
                    استعادة نسخة
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json"
                    onChange={handleFileChange}
                />
            </div>
        </div>

        {/* Hijri Date Offset */}
        <SettingsItem
          icon={Calendar}
          label="تعديل التاريخ الهجري"
          description={`ضبط التاريخ يدوياً (${hijriOffset > 0 ? '+' : ''}${hijriOffset} يوم)`}
          action={
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-dark-panel rounded-lg p-1">
              <button 
                onClick={() => changeHijriOffset(-1)}
                className="p-1 hover:bg-white dark:hover:bg-dark-elevated rounded-md shadow-sm transition-all text-gray-600 dark:text-gray-300"
                aria-label="إنقاص يوم"
              >
                <Minus size={16} />
              </button>
              <span className="text-body-sm font-bold w-4 text-center text-gray-800 dark:text-white">{hijriOffset}</span>
              <button 
                onClick={() => changeHijriOffset(1)}
                className="p-1 hover:bg-white dark:hover:bg-dark-elevated rounded-md shadow-sm transition-all text-gray-600 dark:text-gray-300"
                aria-label="زيادة يوم"
              >
                <Plus size={16} />
              </button>
            </div>
          }
        />

        {/* Theme Toggle */}
        <SettingsItem 
          icon={darkMode ? Moon : Sun}
          label="المظهر"
          description={darkMode ? 'الوضع الليلي مفعل' : 'الوضع النهاري مفعل'}
          action={<Toggle checked={darkMode} onChange={toggleTheme} label="تبديل المظهر" />}
        />

        {/* Font Size Settings */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-gray-100 dark:bg-dark-panel text-gray-600 dark:text-dark-secondary">
              <Type size={24} />
            </div>
            <div>
              <h3 className="font-bold text-body-lg text-gray-800 dark:text-dark-text font-arabic">حجم الخط</h3>
              <p className="text-body-sm text-gray-500 dark:text-dark-muted mt-0.5">تغيير حجم خط الأذكار</p>
            </div>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-dark-panel rounded-xl p-1 gap-1 mb-4">
            {(['small', 'medium', 'large', 'xlarge'] as storage.FontSize[]).map((size) => {
               const labels: Record<string, string> = { small: 'صغير', medium: 'متوسط', large: 'كبير', xlarge: 'ضخم' };
               return (
                 <button
                   key={size}
                   onClick={() => changeFontSize(size)}
                   className={`
                     flex-1 py-2 rounded-lg text-btn font-bold transition-all
                     ${fontSize === size 
                       ? 'bg-white dark:bg-dark-elevated text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-gray-200 dark:ring-dark-border' 
                       : 'text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text'}
                   `}
                 >
                   {labels[size]}
                 </button>
               );
            })}
          </div>

          <div className="p-6 bg-gray-50 dark:bg-dark-panel rounded-xl border border-dashed border-gray-200 dark:border-dark-border text-center transition-all">
             <p className={`font-arabic text-gray-800 dark:text-dark-text leading-loose transition-all duration-300 ${getPreviewFontSizeClass()}`}>
               بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
             </p>
             <p className="text-caption text-gray-400 mt-2">معاينة النص</p>
          </div>
        </div>

        {/* Clear Data Section */}
        <SettingsItem 
            icon={Trash2}
            label="حذف البيانات"
            description="مسح كافة السجلات والمفضلة"
            danger={true}
            action={
                <button 
                onClick={clearData}
                className="px-4 py-2 text-btn font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                حذف
                </button>
            }
        />
      </div>

      <div className="mt-12 text-center flex flex-col items-center gap-2">
         <p className="text-caption text-gray-400 dark:text-dark-muted font-english font-bold">
           Rayyan v1.5.0
         </p>
      </div>
    </div>
  );
};

export default Settings;
