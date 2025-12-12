
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../data';
import { Heart, Plus, Sun, Moon, CloudMoon, Sunrise, ArrowLeft } from 'lucide-react';

const AthkarIndex: React.FC = () => {
  const navigate = useNavigate();

  // Helper to get icon component based on string ID from data
  const getIcon = (id: string, size = 24) => {
    switch (id) {
        case 'sabah': return <Sun size={size} />;
        case 'masaa': return <Moon size={size} />;
        case 'sleep': return <CloudMoon size={size} />;
        case 'waking': return <Sunrise size={size} />;
        default: return <Sun size={size} />; // Default/Prayer
    }
  };

  return (
    <div className="pb-10 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
            <h1 className="text-h1 font-bold text-gray-900 dark:text-white font-arabicHead">الأذكار اليومية</h1>
            <p className="text-body text-gray-500 dark:text-dark-muted mt-1 font-arabic">حصنك الحصين في كل وقت</p>
        </div>
        <button 
            onClick={() => navigate('/favorites')}
            className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
        >
            <Heart size={24} />
        </button>
      </div>

      {/* Main Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
            const isDay = cat.id === 'sabah' || cat.id === 'waking';
            return (
                <div 
                    key={cat.id}
                    onClick={() => navigate(`/category/${cat.id}`)}
                    className="group relative overflow-hidden bg-white dark:bg-dark-surface rounded-3xl p-6 border border-gray-100 dark:border-dark-border cursor-pointer shadow-card hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-900 transition-all duration-300"
                >
                    {/* Background Pattern */}
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isDay ? 'from-orange-400 to-yellow-400' : 'from-indigo-500 to-purple-500'}`}></div>
                    
                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex gap-4">
                            <div className={`p-4 rounded-2xl ${isDay ? 'bg-orange-50 text-orange-500 dark:bg-orange-900/20' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20'}`}>
                                {getIcon(cat.id, 28)}
                            </div>
                            <div>
                                <h3 className="text-h2 font-bold text-gray-800 dark:text-white font-arabicHead mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {cat.title}
                                </h3>
                                <p className="text-small text-gray-500 dark:text-dark-muted font-arabic leading-relaxed max-w-[200px]">
                                    {cat.description}
                                </p>
                            </div>
                        </div>
                        <div className="text-gray-300 dark:text-dark-elevated group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors transform group-hover:-translate-x-1">
                            <ArrowLeft size={24} className="rtl:rotate-0" />
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Custom Dhikr Banner (Placeholder for future feature) */}
      <div 
        className="bg-gradient-to-br from-primary-50 to-white dark:from-dark-surface dark:to-dark-panel p-6 rounded-3xl border border-primary-100 dark:border-dark-border flex items-center justify-between shadow-sm cursor-not-allowed opacity-80"
        title="قريباً"
      >
          <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-dark-elevated rounded-full text-primary-500 shadow-sm">
                  <Plus size={24} />
              </div>
              <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white font-arabicHead">أذكار خاصة</h3>
                  <p className="text-small text-gray-500 dark:text-dark-muted">أضف أذكارك الخاصة (قريباً)</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AthkarIndex;
