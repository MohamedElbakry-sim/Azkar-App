import React, { useEffect, useState } from 'react';
import { User, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getDailySahabi } from '../services/sahabaService';
import { Sahabi } from '../types';

const DailySahabi: React.FC = () => {
  const [sahabi, setSahabi] = useState<Sahabi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getDailySahabi();
      setSahabi(data);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-3xl p-8 border border-cyan-100 dark:border-cyan-900/30 flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">جاري جلب بيانات الصحابي...</p>
      </div>
    );
  }

  if (error || !sahabi) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-3xl p-8 border border-red-100 dark:border-red-900/30 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500">
           <AlertCircle size={32} />
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">حدث خطأ أثناء تحميل بيانات الصحابي.</p>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-sm font-bold transition-colors"
        >
          <RefreshCw size={16} />
          حاول مرة أخرى
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-3xl overflow-hidden shadow-sm border border-cyan-100 dark:border-cyan-900/30 relative animate-fadeIn group">
        
        {/* Header */}
        <div className="bg-cyan-50/50 dark:bg-cyan-900/10 px-6 py-4 flex items-center gap-3 border-b border-cyan-100 dark:border-cyan-900/30">
            <div className="p-2 bg-white dark:bg-dark-surface rounded-full shadow-sm text-cyan-600 dark:text-cyan-400">
                <User size={24} />
            </div>
            <h3 className="font-bold text-lg text-cyan-800 dark:text-cyan-400">صحابي اليوم</h3>
        </div>

        <div className="p-6 md:p-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 dark:text-white mb-2">
                    {sahabi.arabic_name}
                </h2>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest font-mono">
                    {sahabi.name}
                </p>
            </div>

            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-dark-bg/50 p-5 rounded-2xl border border-gray-100 dark:border-dark-border">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
                        {sahabi.description}
                    </p>
                </div>

                {sahabi.notable_facts && sahabi.notable_facts.length > 0 && (
                    <div>
                        <h4 className="font-bold text-cyan-600 dark:text-cyan-400 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            حقائق ومناقب
                        </h4>
                        <ul className="space-y-2 pr-4 border-r-2 border-cyan-100 dark:border-cyan-900/30">
                            {sahabi.notable_facts.map((fact, idx) => (
                                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-2">
                                    {fact}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default DailySahabi;
