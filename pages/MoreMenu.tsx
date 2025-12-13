
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Clock, Activity, Heart, BookOpenText, 
  Radio, Calendar, Mail, Shield, BarChart2, 
  ChevronLeft, Smartphone, ListTodo
} from 'lucide-react';
import { TasbeehIcon, AllahIcon } from '../components/Layout';

const MoreMenu: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "أدوات",
      items: [
        { label: "السبحة الإلكترونية", icon: <TasbeehIcon size={22} />, path: "/tasbeeh", color: "text-emerald-500" },
        { label: "متابعة القضاء", icon: <ListTodo size={22} />, path: "/qada", color: "text-orange-500" },
        { label: "التقويم الهجري", icon: <Calendar size={22} />, path: "/calendar", color: "text-blue-500" },
        { label: "الإذاعة", icon: <Radio size={22} />, path: "/radio", color: "text-red-500" },
      ]
    },
    {
      title: "المعرفة",
      items: [
        { label: "أسماء الله الحسنى", icon: <AllahIcon size={22} />, path: "/names", color: "text-amber-500" },
        { label: "حصن المسلم", icon: <BookOpenText size={22} />, path: "/duas", color: "text-teal-500" },
      ]
    },
    {
      title: "شخصي",
      items: [
        { label: "الإحصائيات", icon: <BarChart2 size={22} />, path: "/stats", color: "text-purple-500" },
        { label: "المفضلة", icon: <Heart size={22} />, path: "/favorites", color: "text-rose-500" },
      ]
    },
    {
      title: "التطبيق",
      items: [
        { label: "الإعدادات", icon: <Settings size={22} />, path: "/settings", color: "text-gray-500" },
        { label: "تواصل معنا", icon: <Mail size={22} />, path: "/contact", color: "text-blue-400" },
      ]
    }
  ];

  return (
    <div className="pb-10 space-y-8 animate-fadeIn">
      <div className="px-2">
        <h1 className="text-h1 font-bold text-gray-900 dark:text-white font-arabicHead">المزيد</h1>
        <p className="text-body text-gray-500 dark:text-dark-muted mt-1 font-arabic">أدوات ومصادر إسلامية</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-small font-bold text-gray-400 dark:text-dark-muted px-4 mb-3 uppercase tracking-wider font-english">
                {section.title}
            </h3>
            <div className="bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-dark-border overflow-hidden shadow-card">
              {section.items.map((item, itemIdx) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors
                    ${itemIdx !== section.items.length - 1 ? 'border-b border-gray-50 dark:border-dark-border' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl bg-gray-50 dark:bg-dark-bg ${item.color}`}>
                        {item.icon}
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-body font-arabic">
                        {item.label}
                    </span>
                  </div>
                  <ChevronLeft size={18} className="text-gray-300 dark:text-dark-border rtl:rotate-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-8 text-gray-400 dark:text-dark-muted">
        <div className="flex justify-center mb-2 opacity-50">
            <Smartphone size={24} />
        </div>
        <p className="text-caption font-english">Rayyan v1.5.0</p>
      </div>
    </div>
  );
};

export default MoreMenu;
