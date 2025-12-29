
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../data';
import { Heart, Plus, Sun, Moon, CloudMoon, Sunrise, ArrowLeft, Sparkles } from 'lucide-react';

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

  const getThemeGradient = (theme: string) => {
    switch (theme) {
      case 'orange': return 'from-orange-500 to-amber-600';
      case 'indigo': return 'from-indigo-600 to-slate-800';
      case 'slate': return 'from-slate-600 to-gray-800';
      case 'yellow': return 'from-yellow-500 to-orange-600';
      case 'emerald': return 'from-emerald-600 to-teal-800';
      default: return 'from-primary-600 to-emerald-800';
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
                    className={`group relative overflow-hidden rounded-3xl p-6 cursor-pointer shadow-card hover:shadow-xl transition-all duration-500 min-h-[140px] flex items-center bg-gradient-to-br ${getThemeGradient(cat.theme)}`}
                >
                    {/* Pattern Overlay instead of Image */}
                    <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
                    
                    <div className="flex items-center justify-between relative z-10 w-full">
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/10 shadow-inner">
                                {getIcon(cat.id, 28)}
                            </div>
                            <div>
                                <h3 className="text-h2 font-bold text-white font-arabicHead mb-1 drop-shadow-sm">
                                    {cat.title}
                                </h3>
                                <p className="text-small text-white/80 font-arabic leading-relaxed max-w-[200px]">
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

      {/* Custom Dhikr Builder Enabled */}
      <div 
        onClick={() => navigate('/custom-athkar')}
        className="group bg-gradient-to-br from-primary-600 to-emerald-800 p-6 rounded-[2rem] border border-white/10 flex items-center justify-between shadow-xl cursor-pointer relative overflow-hidden transition-all duration-500 hover:shadow-primary-500/20"
      >
          {/* Decorative Sparkle Background */}
          <div className="absolute -right-10 -bottom-10 text-white/10 transform rotate-12 transition-transform group-hover:scale-125 duration-700">
              <Sparkles size={180} />
          </div>

          <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl text-white shadow-inner border border-white/10">
                  <Plus size={32} />
              </div>
              <div>
                  <h3 className="font-bold text-2xl text-white font-arabicHead">أذكار خاصة</h3>
                  <p className="text-primary-50 font-arabic opacity-90">أضف أدعيتك الشخصية وتابع تقدمك فيها</p>
              </div>
          </div>
          
          <div className="relative z-10 bg-white/20 p-2 rounded-full text-white backdrop-blur-sm group-hover:-translate-x-2 transition-transform">
              <ArrowLeft size={20} className="rtl:rotate-0" />
          </div>
      </div>
    </div>
  );
};

export default AthkarIndex;
