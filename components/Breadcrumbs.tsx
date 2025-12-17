
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { CATEGORIES } from '../data';

const routeNameMap: Record<string, string> = {
  'prayers': 'مواقيت الصلاة',
  'tasbeeh': 'السبحة الإلكترونية',
  'names': 'أسماء الله الحسنى',
  'duas': 'حصن المسلم',
  'qada': 'الصلوات الفائتة',
  'stats': 'الإحصائيات',
  'favorites': 'المفضلة',
  'settings': 'الإعدادات',
  'contact': 'تواصل معنا',
  'category': 'الأذكار',
  'radio': 'الإذاعة'
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Don't show on home page
  if (pathnames.length === 0) {
    return null;
  }

  const getBreadcrumbName = (value: string, index: number, arr: string[]) => {
    // Check if it's a category ID (usually follows 'category')
    if (index > 0 && arr[index - 1] === 'category') {
      const category = CATEGORIES.find(c => c.id === value);
      return category ? category.title : value;
    }
    
    return routeNameMap[value] || value;
  };

  return (
    <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6 animate-fadeIn overflow-x-auto whitespace-nowrap pb-2 no-scrollbar" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 md:gap-2">
        <li>
          <Link 
            to="/" 
            className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Home size={16} />
            <span className="hidden md:inline">الرئيسية</span>
          </Link>
        </li>
        
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const name = getBreadcrumbName(value, index, pathnames);

          return (
            <li key={to} className="flex items-center gap-1 md:gap-2">
              <ChevronLeft size={14} className="text-gray-300 rtl:rotate-0" />
              {isLast ? (
                <span className="font-bold text-gray-800 dark:text-gray-200 px-1" aria-current="page">
                  {name}
                </span>
              ) : (
                <Link 
                  to={to}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-1 py-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
