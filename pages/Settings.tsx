
import React, { useState, useEffect } from 'react';
import { Moon, Sun, Smartphone, Trash2, Globe, Languages, BellOff, Clock } from 'lucide-react';
import * as storage from '../services/storage';

interface SettingsProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ darkMode, toggleTheme }) => {
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [dndSettings, setDndSettings] = useState<storage.DNDSettings>({ enabled: false, endTime: null });

  useEffect(() => {
    setHapticEnabled(storage.getHapticEnabled());
    setShowTranslation(storage.getShowTranslation());
    setShowTransliteration(storage.getShowTransliteration());
    setDndSettings(storage.getDNDSettings());
  }, []);

  const toggleHaptic = () => {
    const newValue = !hapticEnabled;
    setHapticEnabled(newValue);
    storage.saveHapticEnabled(newValue);
    if (newValue && !dndSettings.enabled && navigator.vibrate) navigator.vibrate(20);
  };

  const toggleTranslation = () => {
    const newValue = !showTranslation;
    setShowTranslation(newValue);
    storage.saveShowTranslation(newValue);
  };

  const toggleTransliteration = () => {
    const newValue = !showTransliteration;
    setShowTransliteration(newValue);
    storage.saveShowTransliteration(newValue);
  };

  const toggleDND = () => {
    const newEnabled = !dndSettings.enabled;
    const newSettings = { 
        enabled: newEnabled, 
        endTime: null // Default to manual/indefinite when toggling
    };
    setDndSettings(newSettings);
    storage.saveDNDSettings(newSettings);
  };

  const setDNDDuration = (minutes: number | null) => {
    const newEndTime = minutes === null ? null : Date.now() + minutes * 60 * 1000;
    const newSettings = { ...dndSettings, enabled: true, endTime: newEndTime };
    setDndSettings(newSettings);
    storage.saveDNDSettings(newSettings);
  };

  const clearData = () => {
     if(confirm('هل أنت متأكد من مسح جميع البيانات؟\nسيتم حذف:\n- سجل الإنجازات\n- المفضلة\n- العدادات المحفوظة\n\nلا يمكن التراجع عن هذا الإجراء.')) {
        localStorage.clear();
        localStorage.setItem('nour_theme', darkMode ? 'dark' : 'light');
        window.location.reload();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: 'numeric' }).format(new Date(timestamp));
  };

  const getDNDStatusString = () => {
      if (!dndSettings.enabled) return "تعطيل الاهتزاز والتنبيهات مؤقتاً";
      if (dndSettings.endTime) return `مفعل حتى ${formatTime(dndSettings.endTime)}`;
      return "مفعل (يدوياً)";
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
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
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
        ${checked ? 'bg-primary-500' : 'bg-gray-300'}
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

  const DurationButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
      <button 
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400
            ${active 
                ? 'bg-primary-500 text-white border-primary-500' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
        `}
      >
          {label}
      </button>
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">الإعدادات</h2>
        <p className="text-gray-500 dark:text-gray-400">تخصيص تجربة التطبيق</p>
      </div>

      <div className="space-y-4">
        {/* Theme Toggle */}
        <SettingsItem 
          icon={darkMode ? Moon : Sun}
          label="المظهر"
          description={darkMode ? 'الوضع الليلي مفعل' : 'الوضع النهاري مفعل'}
          action={<Toggle checked={darkMode} onChange={toggleTheme} label="تبديل المظهر (ليلي/نهاري)" />}
        />

        {/* Do Not Disturb Toggle */}
        <SettingsItem 
          icon={BellOff}
          label="عدم الإزعاج"
          description={getDNDStatusString()}
          action={<Toggle checked={dndSettings.enabled} onChange={toggleDND} label="تفعيل وضع عدم الإزعاج" />}
        />

        {/* Duration Options */}
        {dndSettings.enabled && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mx-2 border border-gray-100 dark:border-gray-700 animate-fadeIn">
                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                    <Clock size={16} />
                    <span>إيقاف التشغيل تلقائياً بعد:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <DurationButton label="يدوياً" active={dndSettings.endTime === null} onClick={() => setDNDDuration(null)} />
                    <DurationButton label="30 دقيقة" active={false} onClick={() => setDNDDuration(30)} />
                    <DurationButton label="ساعة" active={false} onClick={() => setDNDDuration(60)} />
                    <DurationButton label="8 ساعات" active={false} onClick={() => setDNDDuration(480)} />
                </div>
            </div>
        )}

        {/* Haptic Feedback Toggle */}
        <SettingsItem 
          icon={Smartphone}
          label="الاهتزاز"
          description={dndSettings.enabled ? "متوقف مؤقتاً بسبب وضع عدم الإزعاج" : "تشغيل الاهتزاز عند التسبيح"}
          action={<Toggle checked={hapticEnabled} onChange={toggleHaptic} label="تفعيل الاهتزاز" />}
        />

        {/* Translation Toggle */}
        <SettingsItem 
          icon={Globe}
          label="الترجمة"
          description="عرض الترجمة الإنجليزية (إن وجدت)"
          action={<Toggle checked={showTranslation} onChange={toggleTranslation} label="تفعيل الترجمة" />}
        />

        {/* Transliteration Toggle */}
        <SettingsItem 
          icon={Languages}
          label="النطق الصوتي"
          description="عرض النطق بالحروف اللاتينية"
          action={<Toggle checked={showTransliteration} onChange={toggleTransliteration} label="تفعيل النطق الصوتي" />}
        />

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
           Nour App v1.2.0
         </p>
      </div>
    </div>
  );
};

export default Settings;
