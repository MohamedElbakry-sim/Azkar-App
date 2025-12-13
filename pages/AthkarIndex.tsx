
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
            return (
                <div 
                    key={cat.id}
                    onClick={() => navigate(`/category/${cat.id}`)}
                    className="group relative overflow-hidden rounded-3xl p-6 cursor-pointer shadow-card hover:shadow-xl transition-all duration-500 min-h-[140px] flex items-center"
                >
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                        {cat.imageUrl && (
                            <img 
                                src={cat.imageUrl} 
                                alt={cat.title}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        )}
                        {/* Overlay Gradient for readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent dark:from-black/90 dark:via-black/60"></div>
                    </div>
                    
                    <div className="flex items-center justify-between relative z-10 w-full">
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/10 shadow-inner">
                                {getIcon(cat.id, 28)}
                            </div>
                            <div>
                                <h3 className="text-h2 font-bold text-white font-arabicHead mb-1 shadow-black/10 drop-shadow-sm">
                                    {cat.title}
                                </h3>
                                <p className="text-small text-gray-200 font-arabic leading-relaxed max-w-[200px] opacity-90">
                                    {cat.description}
                                </p>
                            </div>
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 border border-white/10">
                            <ArrowLeft size={20} className="rtl:rotate-0" />
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
