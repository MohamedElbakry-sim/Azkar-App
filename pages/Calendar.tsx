
import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, Flag } from 'lucide-react';
import * as storage from '../services/storage';

// Static list of major Islamic events (Hijri Month/Day)
// 1: Muharram, 9: Ramadan, 12: Dhu al-Hijjah, etc.
const ISLAMIC_EVENTS = [
  { month: 1, day: 1, title: 'رأس السنة الهجرية' },
  { month: 1, day: 10, title: 'يوم عاشوراء' },
  { month: 7, day: 27, title: 'الإسراء والمعراج' },
  { month: 8, day: 15, title: 'ليلة النصف من شعبان' },
  { month: 9, day: 1, title: 'بداية شهر رمضان' },
  { month: 10, day: 1, title: 'عيد الفطر المبارك' },
  { month: 12, day: 9, title: 'يوم عرفة' },
  { month: 12, day: 10, title: 'عيد الأضحى المبارك' },
];

const CalendarPage: React.FC = () => {
  const [today, setToday] = useState<Date>(new Date());
  const [hijriString, setHijriString] = useState('');
  const [hijriMonth, setHijriMonth] = useState(0);
  const [hijriDay, setHijriDay] = useState(0);
  const [hijriYear, setHijriYear] = useState(0);

  useEffect(() => {
    // 1. Calculate Today with Offset
    const offset = storage.getHijriOffset();
    const date = new Date();
    date.setDate(date.getDate() + offset);
    setToday(date);

    // 2. Format basic string
    const formatted = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
    setHijriString(formatted);

    // 3. Extract parts for event logic
    // Using Intl.DateTimeFormat with 'parts' to robustly get day/month values
    const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-nu-latn', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    }).formatToParts(date);

    const m = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    const d = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const y = parseInt(parts.find(p => p.type === 'year')?.value || '0');

    setHijriMonth(m);
    setHijriDay(d);
    setHijriYear(y);

  }, []);

  // Determine upcoming events
  // Sort events by how close they are to today
  const sortedEvents = ISLAMIC_EVENTS.map(event => {
      // Logic:
      // If event month > current month: Upcoming this year
      // If event month < current month: Next year
      // If event month == current month:
      //    If event day >= current day: Upcoming this year
      //    Else: Next year
      
      let isNextYear = false;
      if (event.month < hijriMonth) isNextYear = true;
      else if (event.month === hijriMonth && event.day < hijriDay) isNextYear = true;

      // Simple sorting score: (Year * 10000) + (Month * 100) + Day
      const targetYear = isNextYear ? hijriYear + 1 : hijriYear;
      const score = (targetYear * 10000) + (event.month * 100) + event.day;
      
      const isToday = !isNextYear && event.month === hijriMonth && event.day === hijriDay;

      return { ...event, score, isNextYear, isToday };
  }).sort((a, b) => a.score - b.score);

  // Month Names Map for display
  const monthNames = [
      "", "محرم", "صفر", "ربيع الأول", "ربيع الآخر", 
      "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", 
      "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
  ];

  return (
    <div className="max-w-2xl mx-auto pb-10 space-y-8">
        
        <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white font-arabicHead mb-2">التقويم الهجري</h1>
            <p className="text-gray-500 dark:text-gray-400">تابع المناسبات الإسلامية والأيام المباركة</p>
        </div>

        {/* Today Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-8 text-white text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <h2 className="text-5xl font-bold font-mono mb-4">{hijriDay}</h2>
            <div className="text-2xl font-bold font-arabicHead mb-2">{monthNames[hijriMonth]}</div>
            <div className="text-emerald-200 font-mono text-lg">{hijriYear} هـ</div>
            
            <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm opacity-90">{hijriString}</p>
            </div>
        </div>

        {/* Upcoming Events List */}
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 px-2 font-arabicHead">المناسبات القادمة</h3>
            
            {sortedEvents.map((event, idx) => (
                <div 
                    key={idx}
                    className={`
                        flex items-center gap-4 p-4 rounded-2xl border transition-all
                        ${event.isToday 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border'
                        }
                    `}
                >
                    <div className={`
                        w-14 h-14 flex flex-col items-center justify-center rounded-xl font-bold shrink-0
                        ${event.isToday ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-300'}
                    `}>
                        <span className="text-lg leading-none">{event.day}</span>
                        <span className="text-[10px] leading-none mt-1">{event.month}</span>
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 font-arabicHead">{event.title}</h4>
                            {event.isToday && (
                                <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    اليوم
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {monthNames[event.month]} {event.isNextYear ? `(${hijriYear + 1})` : ''}
                        </p>
                    </div>
                </div>
            ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-center border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                ملاحظة: تعتمد المناسبات الإسلامية على رؤية الهلال، وقد تختلف التواريخ الفعلية بيوم واحد. يمكنك تعديل التاريخ من الإعدادات.
            </p>
        </div>

    </div>
  );
};

export default CalendarPage;
