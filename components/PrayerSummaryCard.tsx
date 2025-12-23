
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, MapPin, Loader2 } from 'lucide-react';
import * as AdhanLib from 'adhan';

const adhan = (AdhanLib as any).default || AdhanLib;

const PrayerSummaryCard: React.FC = () => {
  const navigate = useNavigate();
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; countdown: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const calculateNext = (lat: number, lng: number) => {
      try {
        const coordinates = new adhan.Coordinates(lat, lng);
        const params = adhan.CalculationMethod.MuslimWorldLeague();
        const date = new Date();
        const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
        
        const next = prayerTimes.nextPrayer();
        if (next === 'none') {
            setNextPrayer(null);
            return;
        }

        const prayerNames: Record<string, string> = {
          fajr: 'الفجر',
          sunrise: 'الشروق',
          dhuhr: 'الظهر',
          asr: 'العصر',
          maghrib: 'المغرب',
          isha: 'العشاء'
        };

        const time = prayerTimes.timeForPrayer(next);
        if (!time) return;

        const formatter = new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: 'numeric' });
        
        // Calculate countdown
        const diff = time.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (isMounted) {
          setNextPrayer({
            name: prayerNames[next],
            time: formatter.format(time),
            countdown: hours > 0 ? `بعد ${hours} س و ${minutes} د` : `بعد ${minutes} دقيقة`
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => calculateNext(pos.coords.latitude, pos.coords.longitude),
        () => {
            // Default to Mecca as fallback
            calculateNext(21.4225, 39.8262);
        },
        { timeout: 5000 }
      );
    } else {
        calculateNext(21.4225, 39.8262);
    }

    return () => { isMounted = false; };
  }, []);

  if (loading) return (
      <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 border border-gray-100 dark:border-dark-border shadow-soft flex items-center justify-center h-24">
          <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
  );

  if (!nextPrayer) return null;

  return (
    <div 
      onClick={() => navigate('/prayers')}
      className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-soft border border-gray-100 dark:border-dark-border cursor-pointer group hover:border-primary-200 dark:hover:border-primary-800 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">الصلاة القادمة</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white font-arabicHead">
              {nextPrayer.name} <span className="text-primary-600 dark:text-primary-400 mx-1">|</span> {nextPrayer.time}
            </h3>
          </div>
        </div>
        
        <div className="text-left">
            <p className="text-sm font-bold text-primary-600 dark:text-primary-400 font-arabic mb-1">
                {nextPrayer.countdown}
            </p>
            <div className="flex items-center justify-end text-gray-300 group-hover:text-primary-500 transition-colors">
                <span className="text-[10px] ml-1 font-bold">باقي المواقيت</span>
                <ChevronLeft size={16} className="rtl:rotate-0" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerSummaryCard;
