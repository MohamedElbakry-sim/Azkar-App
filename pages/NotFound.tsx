
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass, AlertCircle } from 'lucide-react';

/**
 * 404 Not Found Page Component.
 * Displays a friendly error message when the user navigates to a non-existent route.
 */
const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6 animate-fadeIn">
      <div className="bg-gray-100 dark:bg-gray-800/50 p-8 rounded-full mb-8 shadow-sm">
        <Compass size={64} className="text-gray-400 dark:text-gray-500" />
      </div>
      
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 font-serif">404</h1>
      <h2 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-6">الصفحة غير موجودة</h2>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-10 leading-relaxed">
        يبدو أنك ضللت الطريق. الصفحة التي تبحث عنها قد تكون حذفت أو أن الرابط غير صحيح.
      </p>

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        <Home size={20} />
        <span>العودة للرئيسية</span>
      </button>
    </div>
  );
};

export default NotFound;
