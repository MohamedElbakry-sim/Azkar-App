import React, { useState, useEffect } from 'react';
import { Moon, Sun, Smartphone, Trash2, Globe, Languages } from 'lucide-react';
import * as storage from '../services/storage';

interface SettingsProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ darkMode, toggleTheme }) => {
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(false);

  useEffect(() => {
    setHapticEnabled(storage.getHapticEnabled());
    setShowTranslation(storage.getShowTranslation());
    setShowTransliteration(storage.getShowTransliteration());
  }, []);

  const toggleHaptic = () => {
    const newValue = !hapticEnabled;
    setHapticEnabled(newValue);
    storage.saveHapticEnabled(newValue);
    if (newValue && navigator.vibrate) navigator.vibrate(20);
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

  const clearData = () => {
     if(confirm('هل أنت متأكد من مسح جميع البيانات؟\nسيتم حذف:\n- سجل الإنجازات\n- المفضلة\n- العدادات المحفوظة\n\nلا يمكن التراجع عن هذا الإجراء.')) {
        localStorage.clear();
        localStorage.setItem('nour_theme', darkMode ? 'dark' : 'light');
        window.location.reload();
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

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button 
      onClick={onChange}
      className={`
        relative w-14 h-8 rounded-full transition-colors duration-300
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
          action={<Toggle checked={darkMode} onChange={toggleTheme} />}
        />

        {/* Haptic Feedback Toggle */}
        <SettingsItem 
          icon={Smartphone}
          label="الاهتزاز"
          description="تشغيل الاهتزاز عند التسبيح"
          action={<Toggle checked={hapticEnabled} onChange={toggleHaptic} />}
        />

        {/* Translation Toggle */}
        <SettingsItem 
          icon={Globe}
          label="الترجمة"
          description="عرض الترجمة الإنجليزية (إن وجدت)"
          action={<Toggle checked={showTranslation} onChange={toggleTranslation} />}
        />

        {/* Transliteration Toggle */}
        <SettingsItem 
          icon={Languages}
          label="النطق الصوتي"
          description="عرض النطق بالحروف اللاتينية"
          action={<Toggle checked={showTransliteration} onChange={toggleTransliteration} />}
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
              className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-900/50"
            >
              حذف
            </button>
          }
        />
      </div>

      <div className="mt-12 text-center">
         <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
           Nour App v1.1.0
         </p>
      </div>
    </div>
  );
};

export default Settings;