import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signup, error, isDemoMode, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
        alert("يرجى ضبط إعدادات Firebase في الكود لتفعيل التسجيل.");
        return;
    }

    setIsSubmitting(true);
    try {
        if (isLogin) {
            await login(email, password);
        } else {
            await signup(email, password, name);
        }
        navigate('/settings'); // Redirect to settings/profile after success
    } catch (err) {
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#121212] overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
         <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="islamic-geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-500"/>
                    <circle cx="20" cy="20" r="3" fill="currentColor" className="text-emerald-500" />
                </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#islamic-geo)" />
         </svg>
      </div>

      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-[#1E1E1E] shadow-lg text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 z-20 transition-colors"
      >
          <ArrowLeft size={24} className="rtl:rotate-0" />
      </button>

      <div className="w-full max-w-md relative z-10 animate-slideUp">
        <div className="text-center mb-8">
            <div className="inline-block p-4 bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-xl shadow-emerald-500/10 mb-4">
                <Logo size={50} className="text-emerald-600 dark:text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white font-arabicHead mb-2">
                {isLogin ? 'مرحباً بعودتك' : 'انضم إلى ريان'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-arabic">
                {isLogin ? 'تابع وردك اليومي وحافظ على أذكارك' : 'أنشئ حساباً لحفظ تقدمك ومزامنته'}
            </p>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-2xl shadow-black/5 p-8 border border-gray-100 dark:border-[#333]">
            
            {isDemoMode && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-sm flex items-start gap-3 border border-amber-100 dark:border-amber-900/30">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p>التطبيق في وضع التجربة. لتفعيل المصادقة والمزامنة، يجب إضافة مفاتيح Firebase في ملف <code>services/firebase.ts</code>.</p>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold text-center border border-red-100 dark:border-red-900/30">
                    {error.includes("auth/user-not-found") ? "المستخدم غير موجود" : 
                     error.includes("auth/wrong-password") ? "كلمة المرور غير صحيحة" : 
                     error.includes("auth/email-already-in-use") ? "البريد الإلكتروني مستخدم بالفعل" :
                     "حدث خطأ، يرجى المحاولة مرة أخرى"}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mr-1 block">الاسم</label>
                        <div className="relative">
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                                type="text" 
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none dark:text-white transition-all font-arabic text-right placeholder-gray-400"
                                placeholder="اسمك الكريم"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mr-1 block">البريد الإلكتروني</label>
                    <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none dark:text-white transition-all font-english text-right placeholder-gray-400"
                            placeholder="example@mail.com"
                            dir="ltr"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mr-1 block">كلمة المرور</label>
                    <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none dark:text-white transition-all font-english text-right placeholder-gray-400"
                            placeholder="••••••••"
                            dir="ltr"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isSubmitting || isDemoMode}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد')}
                </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-[#2A2A2A]">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}
                    <button 
                        onClick={() => { setIsLogin(!isLogin); clearError(); }}
                        className="text-emerald-600 dark:text-emerald-400 font-bold mr-1 hover:underline transition-colors"
                    >
                        {isLogin ? "سجل الآن" : "سجل الدخول"}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;