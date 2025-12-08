
import React, { useEffect, useState } from 'react';
import { Compass, Clock, MapPin, Loader2, Calendar } from 'lucide-react';
import * as AdhanLib from 'adhan';
import * as storage from '../services/storage';

// Robustly resolve the adhan library object to handle CJS/ESM interop differences across CDNs
// If AdhanLib has a 'default' property (ESM wrapping CJS), use it. Otherwise use AdhanLib directly.
const adhan = (AdhanLib as any).default || AdhanLib;

interface PrayerTimeData {
  name: string;
  time: string;
  id: string;
  isNext: boolean;
  dateObj?: Date;
}

const PrayerTimes: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimeData[]>([]);
  const [qibla, setQibla] = useState<number>(0);
  const [locationName, setLocationName] = useState('جاري تحديد الموقع...');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hijriDate, setHijriDate] = useState('');

  useEffect(() => {
    // Set Hijri Date with User Offset
    try {
      const offset = storage.getHijriOffset();
      const date = new Date();
      date.setDate(date.getDate() + offset);

      const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
      setHijriDate(hijri);
    } catch (e) {
      // Fallback if islamic calendar not supported
      setHijriDate(new Date().toLocaleDateString('ar-SA'));
    }

    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location OK:", position);
        const { latitude, longitude } = position.coords;
        calculateTimes(latitude, longitude);
        setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        setLoading(false);
      },
      (error) => {
        console.error("Location error:", error);

        if (error.code === error.PERMISSION_DENIED) {
          setError("لو سمحت، فعّل إذن الموقع من إعدادات المتصفح.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setError("تعذر الحصول على الموقع. تأكد من تشغيل GPS أو جرّب من مكان مفتوح.");
        } else if (error.code === error.TIMEOUT) {
          setError("انتهت مهلة تحديد الموقع. حاول مرة أخرى.");
        } else {
          setError("حدث خطأ غير معروف في تحديد الموقع.");
        }
        
        // Default to Mecca coordinates as fallback so the UI isn't empty
        calculateTimes(21.4225, 39.8262);
        setLocationName('مكة المكرمة (افتراضي)');
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 0
      }
    );
  }, []);

  const calculateTimes = (lat: number, lng: number) => {
    try {
      if (!adhan || !adhan.Coordinates) {
        throw new Error('Adhan library not loaded correctly');
      }

      const coordinates = new adhan.Coordinates(lat, lng);
      
      // Determine calculation method based on location roughly or default to Muslim World League
      const params = adhan.CalculationMethod.MuslimWorldLeague();
      params.madhab = adhan.Madhab.Shafi;
      
      const date = new Date();
      const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
      
      // Calculate Qibla
      const qiblaDirection = adhan.Qibla(coordinates);
      setQibla(qiblaDirection);

      const formatter = new Intl.DateTimeFormat('ar-SA', {
        hour: 'numeric',
        minute: 'numeric',
      });

      const nextPrayerId = prayerTimes.nextPrayer();
      
      const list = [
        { name: 'الفجر', time: formatter.format(prayerTimes.fajr), id: 'fajr', dateObj: prayerTimes.fajr },
        { name: 'الشروق', time: formatter.format(prayerTimes.sunrise), id: 'sunrise', dateObj: prayerTimes.sunrise },
        { name: 'الظهر', time: formatter.format(prayerTimes.dhuhr), id: 'dhuhr', dateObj: prayerTimes.dhuhr },
        { name: 'العصر', time: formatter.format(prayerTimes.asr), id: 'asr', dateObj: prayerTimes.asr },
        { name: 'المغرب', time: formatter.format(prayerTimes.maghrib), id: 'maghrib', dateObj: prayerTimes.maghrib },
        { name: 'العشاء', time: formatter.format(prayerTimes.isha), id: 'isha', dateObj: prayerTimes.isha },
      ];

      setTimes(list.map(p => ({
          ...p,
          isNext: nextPrayerId === p.id
      })));
    } catch (e) {
      console.error(e);
      // Ensure error is a string
      setError('حدث خطأ أثناء حساب المواقيت. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">مواقيت الصلاة</h2>
        
        {hijriDate && (
          <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 font-medium mb-4 bg-primary-50 dark:bg-primary-900/20 py-2 px-4 rounded-full inline-flex">
            <Calendar size={18} />
            <span>{hijriDate}</span>
          </div>
        )}

        {loading && (
           <div className="flex justify-center my-8">
             <Loader2 size={32} className="animate-spin text-primary-500" />
           </div>
        )}

        {!loading && !error && (
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <MapPin size={16} />
                <span dir="ltr">{locationName}</span>
            </div>
        )}
        
        {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mt-4 inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> {/* Just using an icon */}
                {error}
            </div>
        )}
      </div>

      {/* Prayer List */}
      {!loading && (
      <>
        <div className="grid gap-3">
            {times.map((item, idx) => (
            <div 
                key={idx}
                className={`
                flex justify-between items-center p-4 rounded-xl border transition-all duration-300
                ${item.isNext 
                    ? 'bg-primary-500 text-white border-primary-600 shadow-lg scale-[1.02] z-10' 
                    : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                `}
            >
                <div className="flex items-center gap-3">
                <Clock size={20} className={item.isNext ? 'text-white' : 'text-primary-500 dark:text-primary-400'} />
                <span className="font-bold text-lg">{item.name}</span>
                {item.isNext && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">الصلاة القادمة</span>}
                </div>
                <span className="font-mono text-xl font-bold tracking-wider">{item.time}</span>
            </div>
            ))}
        </div>

        {/* Qibla Section */}
        <div className="mt-8 bg-white dark:bg-dark-surface p-8 rounded-2xl border border-gray-100 dark:border-dark-border text-center shadow-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-2 text-gray-800 dark:text-white">
                <Compass size={24} />
                اتجاه القبلة
            </h3>
            
            <div className="relative w-56 h-56 mx-auto my-6 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-200 dark:border-gray-700 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 font-bold pointer-events-none">
                    <span className="absolute top-3">N</span>
                    <span className="absolute bottom-3">S</span>
                    <span className="absolute right-3">E</span>
                    <span className="absolute left-3">W</span>
                </div>
                
                {/* Compass Dial */}
                <div 
                    className="w-full h-full absolute transition-transform duration-1000 ease-out will-change-transform"
                    style={{ transform: `rotate(${qibla}deg)` }}
                >
                    {/* Qibla Indicator (Kaaba direction) */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-4 h-4 bg-primary-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)] z-20"></div>
                        <div className="w-1 h-24 bg-gradient-to-b from-primary-500/50 to-transparent rounded-full"></div>
                    </div>
                </div>

                {/* Center Point */}
                <div className="z-10 bg-white dark:bg-dark-surface px-4 py-2 rounded-xl shadow-lg border border-gray-100 dark:border-dark-border font-bold text-2xl text-primary-600 dark:text-primary-400">
                    {Math.round(qibla)}°
                </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                السهم يشير إلى اتجاه القبلة بالنسبة للشمال. قم بتوجيه هاتفك بحيث يتطابق اتجاه الشمال في البوصلة مع الشمال الحقيقي.
            </p>
        </div>
      </>
      )}
    </div>
  );
};

export default PrayerTimes;
