import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../data';
import { ChevronLeft, Sunrise, Sunset, Moon, Sun, BookHeart } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const getIcon = (name: string) => {
    switch (name) {
      case 'sunrise': return <Sunrise size={32} strokeWidth={1.5} />;
      case 'sunset': return <Sunset size={32} strokeWidth={1.5} />;
      case 'moon': return <Moon size={32} strokeWidth={1.5} />;
      case 'sun': return <Sun size={32} strokeWidth={1.5} />;
      case 'prayer': return <BookHeart size={32} strokeWidth={1.5} />;
      default: return <Sun size={32} strokeWidth={1.5} />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      <div className="text-center py-6 md:py-10">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-serif">حصن المسلم</h2>
        <p className="text-gray-500 dark:text-gray-400 md:text-lg">اختر الأذكار التي تريد قراءتها الآن</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/category/${cat.id}`)}
            className={`
              relative flex items-center p-4 md:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md
              ${cat.color} group
            `}
          >
            <div className="ml-4 p-3 bg-white/20 rounded-xl transition-transform group-hover:rotate-6">
              {getIcon(cat.icon)}
            </div>
            <div className="flex-1 text-right">
              <h3 className="text-lg md:text-xl font-bold mb-1">{cat.title}</h3>
              <p className="text-sm md:text-base opacity-80">{cat.description}</p>
            </div>
            <ChevronLeft size={24} className="opacity-50 transition-transform group-hover:-translate-x-1" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;