
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

  const Container = fullScreen ? 'div' : 'div';
  const containerClasses = fullScreen 
    ? "min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn"
    : "bg-white dark:bg-dark-surface rounded-3xl p-8 border border-red-100 dark:border-red-900/30 flex flex-col items-center justify-center text-center gap-4 animate-fadeIn";

  return (
    <Container className={containerClasses}>
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500 mb-2">
        <AlertCircle size={40} />
      </div>
      
      <h3 className="text-xl font-bold text-gray-800 dark:text-white font-arabicHead">
        {title}
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-md leading-relaxed mb-4 font-arabic">
        {message}
      </p>

      <div className="flex gap-3">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-dark-elevated hover:bg-gray-200 dark:hover:bg-dark-surface text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-all active:scale-95 border border-gray-200 dark:border-dark-border"
          >
            <RefreshCw size={18} />
            <span>حاول مرة أخرى</span>
          </button>
        )}
        
        {fullScreen && (
           <button 
             onClick={() => navigate('/')}
             className="flex items-center gap-2 px-6 py-2.5 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-xl font-bold transition-all active:scale-95"
           >
             <Home size={18} />
             <span>الرئيسية</span>
           </button>
        )}
      </div>
    </Container>
  );
};

export default ErrorState;
