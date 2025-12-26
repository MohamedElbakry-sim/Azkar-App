
import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = "حدث خطأ غير متوقع", 
  message = "نعتذر، واجهنا مشكلة في تحميل البيانات.", 
  onRetry,
  fullScreen = false
}) => {
  const navigate = useNavigate();

  const containerClasses = fullScreen 
    ? "min-h-[70vh] flex flex-col items-center justify-center p-12 md:p-20 text-center animate-fadeIn"
    : "bg-white dark:bg-dark-surface rounded-[3rem] p-12 md:p-20 border border-red-100 dark:border-red-900/30 flex flex-col items-center justify-center text-center gap-10 animate-fadeIn mx-6 my-8 shadow-lg";

  return (
    <div className={containerClasses}>
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500 mb-2">
        <AlertCircle size={56} />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white font-arabicHead">
          {title}
        </h3>
        
        <p className="text-gray-500 dark:text-gray-400 max-w-md leading-relaxed font-arabic text-lg">
          {message}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 w-full justify-center pt-6">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="flex items-center justify-center gap-3 px-10 py-4 bg-gray-100 dark:bg-dark-elevated hover:bg-gray-200 dark:hover:bg-dark-surface text-gray-700 dark:text-gray-200 rounded-2xl font-bold transition-all active:scale-95 border border-gray-200 dark:border-dark-border"
          >
            <RefreshCw size={22} />
            <span>حاول مرة أخرى</span>
          </button>
        )}
        
        {fullScreen && (
           <button 
             onClick={() => navigate('/')}
             className="flex items-center justify-center gap-3 px-10 py-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-2xl font-bold transition-all active:scale-95"
           >
             <Home size={22} />
             <span>الرئيسية</span>
           </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
