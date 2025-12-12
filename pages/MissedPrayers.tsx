import React, { useState, useEffect } from 'react';
import { Minus, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import * as storage from '../services/storage';
import { MissedPrayers } from '../types';

const MissedPrayersPage: React.FC = () => {
  const [counts, setCounts] = useState<MissedPrayers>(storage.getMissedPrayers());

  const handleUpdate = (prayer: keyof MissedPrayers, delta: number) => {
    const updated = storage.updateMissedPrayerCount(prayer, delta);
    setCounts(updated);
  };

  const prayers: { key: keyof MissedPrayers; label: string; color: string }[] = [
    { key: 'fajr', label: 'الفجر', color: 'text-sky-600 bg-sky-50 dark:text-sky-300 dark:bg-sky-900/20' },
    { key: 'dhuhr', label: 'الظهر', color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-900/20' },
    { key: 'asr', label: 'العصر', color: 'text-orange-600 bg-orange-50 dark:text-orange-300 dark:bg-orange-900/20' },
    { key: 'maghrib', label: 'المغرب', color: 'text-purple-600 bg-purple-50 dark:text-purple-300 dark:bg-purple-900/20' },
    { key: 'isha', label: 'العشاء', color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/20' },
    { key: 'witr', label: 'الوتر', color: 'text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-900/20' },
  ];

  const totalMissed = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="text-center py-6 md:py-10">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-serif">الصلوات الفائتة (القضاء)</h2>
        <p className="text-gray-500 dark:text-gray-400">
          سجل الصلوات التي فاتتك لتقضيها وتبرئ ذمتك
        </p>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-border">
        {totalMissed > 0 ? (
            <div className="flex items-center justify-center gap-2 mb-8 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold">
                <AlertCircle size={20} />
                <span>إجمالي الفوائت: {totalMissed}</span>
            </div>
        ) : (
            <div className="flex items-center justify-center gap-2 mb-8 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl font-bold">
                <RefreshCw size={20} />
                <span>لا توجد فوائت مسجلة</span>
            </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {prayers.map(({ key, label, color }) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-xl font-bold text-lg w-24 text-center ${color}`}>
                  {label}
                </span>
                <span className="text-3xl font-mono font-bold text-gray-800 dark:text-gray-100 w-16 text-center">
                  {counts[key]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdate(key, -1)}
                  className="p-3 rounded-xl bg-white dark:bg-dark-surface text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 shadow-sm border border-gray-200 dark:border-gray-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={counts[key] <= 0}
                  title="قضيت فرضاً"
                >
                  <Minus size={20} />
                </button>
                <button
                  onClick={() => handleUpdate(key, 1)}
                  className="p-3 rounded-xl bg-white dark:bg-dark-surface text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm border border-gray-200 dark:border-gray-700 transition-all active:scale-95"
                  title="فاتني فرض"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-center">
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              <strong>تذكير:</strong> قضاء الصلاة الفائتة واجب على الفور عند جمهور العلماء. اجعل هذا العداد وسيلة لتذكيرك وتحفيزك على الإداء، وليس للتسويف.
          </p>
      </div>
    </div>
  );
};

export default MissedPrayersPage;