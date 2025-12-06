import React, { useEffect, useState } from 'react';
import { Compass, Clock, MapPin, Loader2 } from 'lucide-react';

// Declare the global adhan variable loaded from CDN
declare const adhan: any;

interface PrayerTimeData {
  name: string;
  time: string;
  isNext: boolean;
}

const PrayerTimes: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimeData[]>([]);
  const [qibla, setQibla] = useState<number>(0);
  const [locationName, setLocationName] = useState('جاري تحديد الموقع...');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if library is loaded
    if (typeof adhan === 'undefined') {
      setError('مكتبة المواقيت غير محملة. تحقق من الاتصال.');
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        calculateTimes(latitude, longitude);
        setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        setLoading(false);
      },
      (err) => {
        setError('تعذر الحصول على الموقع. يرجى تفعيل GPS.');
        console.error(err);
        // Default to Mecca coordinates as fallback
        calculateTimes(21.4225, 39.8262);
        setLocationName('مكة المكرمة (افتراضي)');
        setLoading(false);
      }
    );
  }, []);

  const calculateTimes = (lat: number, lng: number) => {
    try {
      const coordinates = new adhan.Coordinates(lat, lng);
      const params = adhan.CalculationMethod.MuslimWorldLeague();
      const date = new Date();
      const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
      
      // Calculate Qibla
      const qiblaDirection = adhan.Qibla(coordinates);
      setQibla(qiblaDirection);

      const formatter = new Intl.DateTimeFormat('ar-SA', {
        hour: 'numeric',
        minute: 'numeric',
      });

      const nextPrayer = prayerTimes.nextPrayer();
      
      const list = [
        { name: 'الفجر', time: formatter.format(prayerTimes.fajr), id: 'fajr' },
        { name: 'الشروق', time: formatter.format(prayerTimes.sunrise), id: 'sunrise' },
        { name: 'الظهر', time: formatter.format(prayerTimes.dhuhr), id: 'dhuhr' },
        { name: 'العصر', time: formatter.format(prayerTimes.asr), id: 'asr' },
        { name: 'المغرب', time: formatter.format(prayerTimes.maghrib), id: 'maghrib' },
        { name: 'العشاء', time: formatter.format(prayerTimes.isha), id: 'isha' },
      ];

      setTimes(list.map(p => ({
          ...p,
          isNext: nextPrayer === p.id
      })));
    } catch (e) {
      console.error(e);
      setError('حدث خطأ أثناء حساب المواقيت. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">مواقيت الصلاة</h2>
        
        {loading && (
           <div className="flex justify-center my-4">
             <Loader2 size={24} className="animate-spin text-primary-500" />
           </div>
        )}

        {!loading && !error && (
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <MapPin size={16} />
                <span>{locationName}</span>
            </div>
        )}
        
        {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mt-4 inline-block">
                {error}
            </div>
        )}
      </div>

      {/* Prayer List */}
      {!loading && !error && (
      <>
        <div className="grid gap-3">
            {times.map((item, idx) => (
            <div 
                key={idx}
                className={`
                flex justify-between items-center p-4 rounded-xl border transition-all
                ${item.isNext 
                    ? 'bg-primary-500 text-white border-primary-600 shadow-md scale-105' 
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200'}
                `}
            >
                <div className="flex items-center gap-3">
                <Clock size={20} className={item.isNext ? 'text-white' : 'text-primary-500'} />
                <span className="font-bold text-lg">{item.name}</span>
                {item.isNext && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">القادمة</span>}
                </div>
                <span className="font-mono text-xl font-bold">{item.time}</span>
            </div>
            ))}
        </div>

        {/* Qibla Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
            <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-2 text-gray-800 dark:text-white">
                <Compass size={24} />
                اتجاه القبلة
            </h3>
            
            <div className="relative w-48 h-48 mx-auto my-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center border-4 border-gray-200 dark:border-gray-600">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-bold">
                    <span className="absolute top-2">N</span>
                    <span className="absolute bottom-2">S</span>
                    <span className="absolute right-2">E</span>
                    <span className="absolute left-2">W</span>
                </div>
                
                {/* Arrow Container - Rotate this based on Qibla */}
                <div 
                    className="w-full h-full absolute transition-transform duration-1000 ease-out"
                    style={{ transform: `rotate(${qibla}deg)` }}
                >
                    <div className="w-1 h-1/2 bg-gradient-to-t from-transparent to-primary-500 mx-auto origin-bottom"></div>
                    <div className="w-3 h-3 bg-primary-500 rounded-full mx-auto -mt-1.5 shadow-lg shadow-primary-500/50"></div>
                </div>

                <div className="z-10 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm font-bold text-lg">
                    {Math.round(qibla)}°
                </div>
            </div>
            <p className="text-sm text-gray-500">
                الدرجة من الشمال الجغرافي
            </p>
        </div>
      </>
      )}
    </div>
  );
};

export default PrayerTimes;