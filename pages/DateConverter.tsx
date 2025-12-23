import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Calendar, ArrowRightLeft, Copy, Check, ChevronRight } from 'lucide-react';
import { toArabicNumerals } from '../utils';

// Hijri Month Names
const HIJRI_MONTHS = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر", 
  "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", 
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
];

// Gregorian Month Names (Arabic)
const MILADI_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const DateConverter: React.FC = () => {
  const [mode, setMode] = useState<'miladi_to_hijri' | 'hijri_to_miladi'>('miladi_to_hijri');
  
  // Date State
  const [day, setDay] = useState<number>(new Date().getDate());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  const [copied, setCopied] = useState(false);

  // Conversion Logic
  const result = useMemo(() => {
    try {
      if (mode === 'miladi_to_hijri') {
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) return null;

        const hijriStr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-nu-latn', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          weekday: 'long'
        }).format(date);

        const parts = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-nu-latn', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric'
        }).formatToParts(date);

        const d = parts.find(p => p.type === 'day')?.value || '';
        const m = parseInt(parts.find(p => p.type === 'month')?.value || '0');
        const y = parts.find(p => p.type === 'year')?.value || '';
        const weekday = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { weekday: 'long' }).format(date);

        return {
          full: `${weekday}، ${toArabicNumerals(parseInt(d))} ${HIJRI_MONTHS[m - 1]} ${toArabicNumerals(parseInt(y))} هـ`,
          day: d,
          monthName: HIJRI_MONTHS[m - 1],
          year: y,
          weekday
        };
      } else {
        // Hijri to Miladi estimation logic
        // Browsers don't support parsing Hijri dates directly. 
        // We use a mathematical approximation (Kuwaiti algorithm variant)
        
        const hDay = day;
        const hMonth = month;
        const hYear = year;

        const jd = Math.floor((11 * hYear + 3) / 30) + 354 * hYear + 30 * hMonth - Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385;
        
        const l = jd + 68569;
        const n = Math.floor((4 * l) / 146097);
        const l_new = l - Math.floor((146097 * n + 3) / 4);
        const i = Math.floor((4000 * (l_new + 1)) / 1461001);
        const l_res = l_new - Math.floor((1461 * i) / 4) + 31;
        const j = Math.floor((80 * l_res) / 2447);
        const d = l_res - Math.floor((2447 * j) / 80);
        const l_final = Math.floor(j / 11);
        const m = j + 2 - 12 * l_final;
        const y = 100 * (n - 49) + i + l_final;

        const date = new Date(y, m - 1, d);
        const weekday = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(date);

        return {
          full: `${weekday}، ${toArabicNumerals(d)} ${MILADI_MONTHS[m - 1]} ${toArabicNumerals(y)} م`,
          day: d.toString(),
          monthName: MILADI_MONTHS[m - 1],
          year: y.toString(),
          weekday
        };
      }
    } catch (e) {
      return null;
    }
  }, [day, month, year, mode]);

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleMode = () => {
      setMode(prev => prev === 'miladi_to_hijri' ? 'hijri_to_miladi' : 'miladi_to_hijri');
      // Reset to approximate current counterparts
      if (mode === 'miladi_to_hijri') {
          // Switching to Hijri input
          const parts = new Intl.DateTimeFormat('en-u-ca-islamic-nu-latn', {
              day: 'numeric', month: 'numeric', year: 'numeric'
          }).formatToParts(new Date());
          setDay(parseInt(parts.find(p => p.type === 'day')?.value || '1'));
          setMonth(parseInt(parts.find(p => p.type === 'month')?.value || '1'));
          setYear(parseInt(parts.find(p => p.type === 'year')?.value || '1445'));
      } else {
          // Switching to Miladi input
          const now = new Date();
          setDay(now.getDate());
          setMonth(now.getMonth() + 1);
          setYear(now.getFullYear());
      }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-8 animate-fadeIn">
      
      <div className="text-center py-6">
        <div className="inline-flex p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600 mb-4">
            <RefreshCw size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white font-arabicHead mb-2">محول التاريخ</h1>
        <p className="text-gray-500 dark:text-gray-400">حول التواريخ بسهولة بين التقويم الهجري والميلادي</p>
      </div>

      {/* Mode Switcher */}
      <div className="bg-white dark:bg-dark-surface p-2 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex items-center">
        <button 
            onClick={() => mode !== 'miladi_to_hijri' && toggleMode()}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'miladi_to_hijri' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
            من ميلادي إلى هجري
        </button>
        <div className="px-2 text-gray-300">
            <ArrowRightLeft size={16} />
        </div>
        <button 
            onClick={() => mode !== 'hijri_to_miladi' && toggleMode()}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'hijri_to_miladi' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
            من هجري إلى ميلادي
        </button>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-dark-surface rounded-3xl p-8 border border-gray-100 dark:border-dark-border shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">أدخل التاريخ المراد تحويله</h3>
        
        <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block mr-1">اليوم</label>
                <select 
                    value={day} 
                    onChange={(e) => setDay(parseInt(e.target.value))}
                    className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-center focus:ring-2 focus:ring-primary-500 dark:text-white appearance-none"
                >
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{toArabicNumerals(d)}</option>
                    ))}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block mr-1">الشهر</label>
                <select 
                    value={month} 
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-center focus:ring-2 focus:ring-primary-500 dark:text-white appearance-none"
                >
                    {(mode === 'miladi_to_hijri' ? MILADI_MONTHS : HIJRI_MONTHS).map((m, i) => (
                        <option key={i} value={i+1}>{m}</option>
                    ))}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block mr-1">السنة</label>
                <input 
                    type="number" 
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-center focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                />
            </div>
        </div>
      </div>

      {/* Result Section */}
      {result && (
          <div className="animate-slideUp">
            <div className="bg-gradient-to-br from-primary-600 to-teal-800 rounded-[2.5rem] p-8 text-white text-center shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70 mb-4">التاريخ الموازي</p>
                
                <h2 className="text-5xl font-bold font-mono mb-4">{toArabicNumerals(parseInt(result.day))}</h2>
                <div className="text-2xl font-bold font-arabicHead mb-2">{result.monthName}</div>
                <div className="text-emerald-200 font-mono text-lg">{toArabicNumerals(parseInt(result.year))} {mode === 'miladi_to_hijri' ? 'هـ' : 'م'}</div>
                
                <div className="mt-8 pt-6 border-t border-white/20 flex items-center justify-between">
                    <p className="text-sm font-medium opacity-90">{result.weekday}</p>
                    <button 
                        onClick={handleCopy}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copied ? 'تم النسخ' : 'نسخ النتيجة'}</span>
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Information Card */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex gap-4">
        <div className="p-3 bg-white dark:bg-dark-surface rounded-2xl text-blue-500 shrink-0 h-fit shadow-sm">
            <Calendar size={24} />
        </div>
        <div className="space-y-2">
            <h4 className="font-bold text-blue-900 dark:text-blue-300">حول التحويل</h4>
            <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed font-arabic">
                يعتمد التحويل من الميلادي إلى الهجري على تقويم أم القرى المعتمد في المملكة العربية السعودية. أما التحويل العكسي فهو حسابي تقريبي، وقد يختلف عن الرؤية الشرعية بيوم واحد.
            </p>
        </div>
      </div>

    </div>
  );
};

export default DateConverter;