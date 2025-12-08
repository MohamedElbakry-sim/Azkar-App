
import React from 'react';
import { Mail, MessageCircle, Send } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="text-center py-6 md:py-10">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4 text-blue-600 dark:text-blue-400">
           <Mail size={32} />
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 font-serif">تواصل معنا</h2>
        <p className="text-gray-500 dark:text-gray-400 md:text-lg">
          نحن هنا للاستماع إلى اقتراحاتكم وملاحظاتكم لتطوير تطبيق نور
        </p>
      </div>

      <div className="grid gap-4">
        {/* Email Card */}
        <a 
          href="mailto:support@nour-app.com"
          className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">البريد الإلكتروني</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">mohamedkadrym1975@gmail.com</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-bg p-2 rounded-lg text-gray-400 group-hover:text-primary-500 transition-colors">
            <Send size={20} className="rtl:rotate-180" />
          </div>
        </a>
      </div>

      <div className="mt-8 p-6 bg-primary-50 dark:bg-primary-900/10 rounded-2xl text-center border border-primary-100 dark:border-primary-900/20">
        <MessageCircle size={32} className="mx-auto text-primary-500 mb-3 opacity-80" />
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          يسعدنا سماع صوتك! سواء كان لديك اقتراح لميزة جديدة، أو واجهت مشكلة تقنية، أو أردت فقط إلقاء التحية، لا تتردد في مراسلتنا.
        </p>
      </div>
    </div>
  );
};

export default Contact;
