
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import * as AdhanLib from 'adhan';

// Robust Adhan import
const adhan = (AdhanLib as any).default || AdhanLib;

const SmartAzkarSuggestion: React.FC = () => {
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState<'sabah' | 'masaa' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const useFallbackLogic = () => {
        if (!isMounted) return;
        const hour = new Date().getHours();
        if (hour >= 3 && hour < 12) setSuggestion('sabah');
        else if (hour >= 13 && hour < 23) setSuggestion('masaa');
        else setSuggestion(null);
        setLoading(false);
    };

    const determineTime = () => {
      if (!navigator.geolocation) {
         useFallbackLogic();
         return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
           if (!isMounted) return;
           const { latitude, longitude } = position.coords;
           try {
             const coordinates = new adhan.Coordinates(latitude, longitude);
             const params = adhan.CalculationMethod.MuslimWorldLeague();
             const date = new Date();
             const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
             const now = new Date();
             
             if (now >= prayerTimes.fajr && now < prayerTimes.dhuhr) setSuggestion('sabah');
             else if (now >= prayerTimes.asr && now < prayerTimes.isha) setSuggestion('masaa');
             else useFallbackLogic();
           } catch (e) {
             useFallbackLogic();
           } finally {
             setLoading(false);
           }
        },
        () => useFallbackLogic(),
        { timeout: 5000 }
      );
    };

    determineTime();
    return () => { isMounted = false; };
  }, []);

  if (loading || !suggestion) return null;

  const isSabah = suggestion === 'sabah';
  
  return (
    <div 
        onClick={() => navigate(`/category/${suggestion}`)}
        className={`
            relative overflow-hidden rounded-[2rem] p-6 cursor-pointer group transition-all duration-300 animate-fadeIn border border-transparent
            ${isSabah 
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20' 
                : 'bg-gradient-to-br from-indigo-600 to-slate-800 text-white shadow-lg shadow-indigo-500/20'
            }
            active:scale-[0.98]
        `}
    >
        <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 group-hover:scale-110 transition-transform duration-500">
                    {isSabah ? <Sun size={28} strokeWidth={2.5} /> : <Moon size={28} strokeWidth={2.5} />}
                </div>

                <div className="space-y-0.5">
                    <h3 className="text-xl font-bold text-white font-arabicHead">
                        {isSabah ? 'أذكار الصباح' : 'أذكار المساء'}
                    </h3>
                    <p className="text-xs text-white/80 font-arabic">
                        {isSabah ? 'نور يومك بذكر الله' : 'اختم يومك بالسكينة'}
                    </p>
                </div>
            </div>

            <div className="bg-white/10 p-2 rounded-full border border-white/10 group-hover:-translate-x-1 transition-all">
                <ArrowLeft size={20} className="rtl:rotate-0" />
            </div>
        </div>

        {/* Subtle Decorative Background Element */}
        <div className="absolute -left-4 -bottom-4 opacity-10 pointer-events-none">
            {isSabah ? <Sun size={120} /> : <Moon size={120} />}
        </div>
    </div>
  );
};

export default SmartAzkarSuggestion;
