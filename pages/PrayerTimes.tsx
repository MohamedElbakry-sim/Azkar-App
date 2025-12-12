
import React, { useEffect, useState, useRef } from 'react';
import { Compass, Clock, MapPin, Loader2, Calendar, Navigation, RefreshCw, AlertTriangle } from 'lucide-react';
import * as AdhanLib from 'adhan';
import * as storage from '../services/storage';
import ErrorState from '../components/ErrorState';

// Robustly resolve the adhan library object to handle CJS/ESM interop differences across CDNs
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
  const [qiblaAngle, setQiblaAngle] = useState<number>(0);
  const [locationName, setLocationName] = useState('جاري تحديد الموقع...');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hijriDate, setHijriDate] = useState('');

  // --- Dynamic Compass State ---
  const [heading, setHeading] = useState<number>(0);
  const [isCompassActive, setIsCompassActive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [calibrationNeeded, setCalibrationNeeded] = useState(false);
  const [sensorError, setSensorError] = useState(false);

  // Helper to retry location fetching
  const fetchLocation = () => {
    setLoading(true);
    setError('');
    
    if (!navigator.geolocation) {
        setError('عذراً، المتصفح لا يدعم تحديد الموقع الجغرافي.');
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
        (error) => {
          let msg = "حدث خطأ غير معروف في تحديد الموقع.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "تم رفض إذن الوصول للموقع. يرجى تفعيل الموقع من إعدادات المتصفح للحصول على مواقيت دقيقة.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "تعذر الحصول على الموقع الحالي. تأكد من تفعيل GPS.";
          } else if (error.code === error.TIMEOUT) {
            msg = "انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى.";
          }
          
          setError(msg);
          
          // Default to Mecca coordinates as fallback so user sees something
          calculateTimes(21.4225, 39.8262);
          setLocationName('مكة المكرمة (افتراضي)');
          setLoading(false);
        },
        {
          enableHighAccuracy: true, // Better accuracy for Qibla
          timeout: 15000,
          maximumAge: 0
        }
      );
  };

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
      setHijriDate(new Date().toLocaleDateString('ar-SA'));
    }

    fetchLocation();

    // Cleanup compass listener
    return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
        if ('ondeviceorientationabsolute' in window) {
            (window as any).removeEventListener('deviceorientationabsolute', handleOrientation as any);
        }
    };
  }, []);

  const calculateTimes = (lat: number, lng: number) => {
    try {
      if (!adhan || !adhan.Coordinates) {
        throw new Error('Adhan library not loaded correctly');
      }

      const coordinates = new adhan.Coordinates(lat, lng);
      
      const params = adhan.CalculationMethod.MuslimWorldLeague();
      params.madhab = adhan.Madhab.Shafi;
      
      const date = new Date();
      const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
      
      // Calculate Qibla Angle relative to North
      const qiblaDir = adhan.Qibla(coordinates);
      setQiblaAngle(qiblaDir);

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
      // Fallback is generic here since we handle specific location errors above
      setError('حدث خطأ أثناء حساب المواقيت.');
    }
  };

  // --- Compass Logic ---

  const handleOrientation = (event: DeviceOrientationEvent) => {
    let compassHeading = 0;
    
    // Check if sensor data is actually available
    if (event.alpha === null && !(event as any).webkitCompassHeading) {
        return;
    }

    // iOS devices
    if ((event as any).webkitCompassHeading) {
        compassHeading = (event as any).webkitCompassHeading;
    } 
    // Android/Non-iOS
    else if (event.alpha !== null) {
        // compassHeading = 360 - alpha is standard for deviceorientationabsolute
        compassHeading = 360 - event.alpha;
    }

    // Normalize
    compassHeading = (compassHeading + 360) % 360;

    setHeading(compassHeading);
    // We already set active in startCompass, but this confirms data is flowing
    setSensorError(false);
  };

  const startCompass = async () => {
    // Immediately show the compass UI (optimistic update)
    setIsCompassActive(true);
    setSensorError(false);

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        // iOS 13+ requires permission
        try {
            const response = await (DeviceOrientationEvent as any).requestPermission();
            if (response === 'granted') {
                setPermissionGranted(true);
                window.addEventListener('deviceorientation', handleOrientation);
            } else {
                alert('يرجى السماح بالوصول إلى المستشعرات لاستخدام البوصلة');
                setIsCompassActive(false); // Revert if denied
            }
        } catch (e) {
            console.error(e);
            setIsCompassActive(false);
        }
    } else {
        // Non-iOS or older devices
        setPermissionGranted(true);
        // Check for absolute orientation support (Android)
        if ('ondeviceorientationabsolute' in window) {
             (window as any).addEventListener('deviceorientationabsolute', handleOrientation as any);
        } else {
             (window as any).addEventListener('deviceorientation', handleOrientation);
        }
    }

    // Check if sensors are actually working after a short timeout
    setTimeout(() => {
        // If heading is still exactly 0 (initial) after 2 seconds, it might be a sensor issue
        // Note: Actual North is 0, so this is a heuristic. 
        // Better to just leave it active so user sees UI.
    }, 2000);
  };

  // Calculate rotation: 
  // We rotate the compass disk so that 'North' on the disk points to True North.
  // Disk Rotation = -Heading
  // Kaaba Marker Rotation = Qibla Angle (It stays fixed relative to the North on the disk)
  
  // Calculate if aligned (within 5 degrees)
  let bearing = qiblaAngle - heading;
  // Normalize to -180 to +180
  while (bearing < -180) bearing += 360;
  while (bearing > 180) bearing -= 360;

  const isAligned = isCompassActive && Math.abs(bearing) < 5;

  // Haptic feedback on alignment
  useEffect(() => {
    if (isAligned && navigator.vibrate) {
        navigator.vibrate(50);
    }
  }, [isAligned]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2 font-arabicHead">مواقيت الصلاة</h2>
        
        {hijriDate && (
          <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 font-medium mb-4 bg-primary-50 dark:bg-primary-900/20 py-2 px-4 rounded-full inline-flex font-arabic">
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
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-arabic">
                <MapPin size={16} />
                <span dir="ltr">{locationName}</span>
            </div>
        )}
      </div>

      {error && (
        <div className="mb-6">
            <ErrorState 
                title="تنبيه الموقع"
                message={error}
                onRetry={fetchLocation}
            />
        </div>
      )}

      {!loading && (
      <>
        {/* Prayer List */}
        <div className="grid gap-3">
            {times.map((item, idx) => (
            <div 
                key={idx}
                className={`
                flex justify-between items-center p-4 rounded-xl border transition-all duration-300
                ${item.isNext 
                    ? 'bg-primary-500 text-white border-primary-600 shadow-lg scale-[1.02] z-10' 
                    : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-elevated'}
                `}
            >
                <div className="flex items-center gap-3">
                <Clock size={20} className={item.isNext ? 'text-white' : 'text-primary-500 dark:text-primary-400'} />
                <span className="font-bold text-lg font-arabic">{item.name}</span>
                {item.isNext && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full font-arabic">الصلاة القادمة</span>}
                </div>
                <span className="font-mono text-xl font-bold tracking-wider font-english">{item.time}</span>
            </div>
            ))}
        </div>

        {/* Dynamic Qibla Compass */}
        <div className="mt-8 bg-white dark:bg-dark-surface p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-dark-border text-center shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white font-arabicHead">
                    <Compass size={24} className="text-primary-500" />
                    القبلة الذكية
                </h3>
                {isCompassActive && (
                    <button 
                        onClick={() => setCalibrationNeeded(!calibrationNeeded)}
                        className="text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1 font-arabic"
                    >
                        <RefreshCw size={14} />
                        معايرة
                    </button>
                )}
            </div>
            
            {!isCompassActive ? (
                <div className="py-12 flex flex-col items-center">
                    <div className="w-48 h-48 bg-gray-100 dark:bg-dark-elevated rounded-full flex items-center justify-center mb-6 border-4 border-dashed border-gray-300 dark:border-dark-border">
                        <Navigation size={48} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-6 max-w-xs text-sm font-arabic">
                        لتفعيل البوصلة المتحركة، نحتاج إلى الوصول لمستشعرات الحركة في هاتفك.
                    </p>
                    <button 
                        onClick={startCompass}
                        className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 font-arabic"
                    >
                        تفعيل البوصلة
                    </button>
                </div>
            ) : (
                <div className="relative flex flex-col items-center justify-center py-4">
                    {/* Compass Container */}
                    <div className="relative w-64 h-64 md:w-72 md:h-72">
                        
                        {/* Outer Static Ring */}
                        <div className={`absolute inset-0 rounded-full border-4 transition-colors duration-500 ${isAligned ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-gray-200 dark:border-dark-border'}`}></div>
                        
                        {/* Alignment Arrow (Fixed at top) */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                             <div className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[16px] transition-colors duration-300 ${isAligned ? 'border-b-emerald-500' : 'border-b-gray-300 dark:border-b-gray-600'}`}></div>
                        </div>

                        {/* Rotating Compass Disc */}
                        <div 
                            className="w-full h-full rounded-full bg-gray-50 dark:bg-dark-elevated shadow-inner relative transition-transform duration-300 ease-out will-change-transform"
                            style={{ transform: `rotate(${-heading}deg)` }}
                        >
                            {/* Cardinal Points */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-red-500 font-bold font-english">N</div>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400 text-xs font-english">S</div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-english">E</div>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-english">W</div>

                            {/* Ticks */}
                            {[0, 90, 180, 270].map(deg => (
                                <div 
                                    key={deg}
                                    className="absolute top-0 left-1/2 h-full w-0.5"
                                    style={{ transform: `translateX(-50%) rotate(${deg}deg)` }}
                                >
                                    <div className="w-full h-2 bg-gray-300 dark:bg-gray-600"></div>
                                    <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 absolute bottom-0"></div>
                                </div>
                            ))}

                            {/* Kaaba/Qibla Indicator */}
                            <div 
                                className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none"
                                style={{ transform: `translate(-50%, -50%) rotate(${qiblaAngle}deg)` }}
                            >
                                {/* The Pointer Line */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1/2 bg-gradient-to-t from-transparent to-emerald-500/50 origin-bottom"></div>
                                
                                {/* The Icon */}
                                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <div className={`transition-all duration-300 p-2 rounded-lg ${isAligned ? 'bg-emerald-500 text-white shadow-lg scale-110' : 'bg-gray-200 dark:bg-dark-surface text-gray-500'}`}>
                                        <div className="w-6 h-6 bg-black rounded-sm border border-amber-400 relative">
                                            <div className="absolute top-1 w-full h-[1px] bg-amber-400"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Center Hub */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-dark-surface rounded-full border-2 border-gray-200 dark:border-gray-600 z-10 shadow-sm"></div>
                    </div>

                    <div className="mt-6 text-center">
                        <p className={`text-lg font-bold transition-colors font-arabic ${isAligned ? 'text-emerald-500' : 'text-gray-600 dark:text-gray-300'}`}>
                            {isAligned ? 'أنت بمواجهة القبلة الآن' : 'قم بتدوير هاتفك'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 font-mono font-english" dir="ltr">
                            Heading: {Math.round(heading)}° | Qibla: {Math.round(qiblaAngle)}°
                        </p>
                        
                        {/* Fallback msg if heading stays 0 for too long? Usually user notices if it doesn't move */}
                    </div>
                </div>
            )}
            
            {calibrationNeeded && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 font-arabic">
                    <RefreshCw size={16} className="animate-spin" />
                    حرك هاتفك على شكل رقم 8 لمعايرة البوصلة إذا كانت الاتجاهات غير دقيقة.
                </div>
            )}
        </div>
      </>
      )}
    </div>
  );
};

export default PrayerTimes;
