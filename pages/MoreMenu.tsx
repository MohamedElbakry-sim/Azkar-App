
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Heart, BookOpenText, 
  Radio, Calendar, Mail, BarChart2, 
  ChevronLeft, Smartphone, Sparkles, Coins, RefreshCw,
  Library, Clock, UserCheck, ShieldCheck, Info
} from 'lucide-react';
import { TasbeehIcon, AllahIcon, PrayerIcon } from '../components/Layout';

const MoreMenu: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "الفرائض والسنن",
      description: "أدوات تعينك على أداء العبادات اليومية",
      icon: <ShieldCheck size={20} className="text-primary-600" />,
      items: [
        { label: "مواقيت الصلاة", icon: <PrayerIcon size={22} />, path: "/prayers", color: "text-primary-600", bg: "bg-primary-50 dark:bg-primary-900/20" },
        { label: "السبحة الإلكترونية", icon: <TasbeehIcon size={22} />, path: "/tasbeeh", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        { label: "حاسبة الزكاة", icon: <Coins size={22} />, path: "/zakat", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
      ]
    },
    {
      title: "المعرفة والذكر",
      description: "مكتبة من الأذكار والعلوم الإسلامية",
      icon: <Library size={20} className="text-teal-600" />,
      items: [
        { label: "أسماء الله الحسنى", icon: <AllahIcon size={22} />, path: "/names", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
        { label: "حصن المسلم", icon: <BookOpenText size={22} />, path: "/duas", color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-900/20" },
        { label: "إذاعة القرآن الكريم", icon: <Radio size={22} />, path: "/radio", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
      ]
    },
    {
      title: "الوقت والتقويم",
      description: "تتبع الأيام الفضيلة وتحويل التواريخ",
      icon: <Clock size={20} className="text-blue-600" />,
      items: [
        { label: "التقويم الهجري", icon: <Calendar size={22} />, path: "/calendar", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
        { label: "محول التاريخ", icon: <RefreshCw size={22} />, path: "/date-converter", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
      ]
    },
    {
      title: "مساحتك الشخصية",
      description: "إدارة أذكارك الخاصة وتتبع إنجازاتك",
      icon: <UserCheck size={20} className="text-purple-600" />,
      items: [
        { label: "أذكار خاصة", icon: <Sparkles size={22} />, path: "/custom-athkar", color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
        { label: "الأذكار المفضلة", icon: <Heart size={22} />, path: "/favorites", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
        { label: "إحصائيات التقدم", icon: <BarChart2 size={22} />, path: "/stats", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
      ]
    },
    {
      title: "الإعدادات والدعم",
      description: "تخصيص التطبيق والتواصل مع المطورين",
      icon: <Settings size={20} className="text-gray-500" />,
      items: [
        { label: "إعدادات التطبيق", icon: <Settings size={22} />, path: "/settings", color: "text-gray-600", bg: "bg-gray-100 dark:bg-dark-bg" },
        { label: "تواصل معنا", icon: <Mail size={22} />, path: "/contact", color: "text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
      ]
    }
  ];

  return (
    <div className="pb-16 space-y-10 animate-fadeIn max-w-4xl mx-auto px-4 sm:px-6">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-dark-surface p-8 border border-gray-100 dark:border-dark-border shadow-soft group">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary-500/5 rounded-br-full -ml-8 -mt-8 transition-transform group-hover:scale-110"></div>
        <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white font-arabicHead mb-3">
              استكشف ريان
            </h1>
            <p className="text-lg text-gray-500 dark:text-dark-muted font-arabic leading-relaxed max-w-xl">
              كل ما تحتاجه في رحلتك الروحانية اليومية مجموع في مكان واحد، من مواقيت الصلاة إلى الأذكار والعلوم.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4 animate-slideUp" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 font-arabicHead">
                    {section.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium font-arabic mt-0.5">
                    {section.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-dark-border overflow-hidden shadow-soft divide-y divide-gray-50 dark:divide-dark-border">
              {section.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between p-4.5 hover:bg-gray-50 dark:hover:bg-dark-elevated transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-2xl transition-transform group-hover:scale-110 ${item.bg} ${item.color}`}>
                        {item.icon}
                    </div>
                    <span className="font-bold text-gray-700 dark:text-gray-200 text-body font-arabic group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {item.label}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-full bg-gray-50 dark:bg-dark-bg text-gray-300 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all">
                    <ChevronLeft size={16} className="rtl:rotate-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* About/Version info section */}
      <div className="pt-12 pb-8 border-t border-gray-100 dark:border-dark-border">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-dark-surface rounded-full text-gray-400 border border-gray-50 dark:border-dark-border">
                <Info size={14} />
                <span className="text-xs font-bold font-arabic">عن التطبيق</span>
            </div>
            
            <div className="w-16 h-16 bg-white dark:bg-dark-surface rounded-3xl shadow-soft flex items-center justify-center border border-gray-100 dark:border-dark-border mb-2">
                <Smartphone size={32} className="text-gray-300" />
            </div>
            
            <div>
              <p className="text-gray-800 dark:text-white font-bold text-lg font-arabicHead">تطبيق ريان</p>
              <p className="text-xs text-gray-400 font-english mt-1">Version 1.6.2 (Stable)</p>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-dark-muted max-w-xs font-arabic leading-relaxed">
              تم تطوير هذا التطبيق ليكون رفيقاً للمسلم في يومه وليله، نسأل الله أن يتقبل منا ومنكم صالح الأعمال.
            </p>
        </div>
      </div>
    </div>
  );
};

export default MoreMenu;
