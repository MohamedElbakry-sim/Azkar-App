import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as storage from '../services/storage';
import * as AdhanLib from 'adhan';
import { Volume2, VolumeX, X, Bell } from 'lucide-react';
import { createPortal } from 'react-dom';

const adhan = (AdhanLib as any).default || AdhanLib;

// Reliable Adhan Audio URLs
const ADHAN_SOURCES: Record<storage.AdhanVoice, string> = {
    mecca: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3', // Note: Using Alafasy as high quality placeholder, real Adhan URLs would be better
    madina: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
    alaqsa: 'https://www.islamcan.com/audio/adhan/azan14.mp3',
    standard: 'https://www.islamcan.com/audio/adhan/azan1.mp3'
};

const NotificationManager: React.FC = () => {
  const lastCheckedMinute = useRef<string | null>(null);
  const lastAdhanPlayed = useRef<string | null>(null);
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // UI States
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [activeAdhan, setActiveAdhan] = useState<{ name: string; stop: () => void } | null>(null);

  // Initialize Audio
  useEffect(() => {
      const audio = new Audio();
      audioRef.current = audio;
      
      const handleInteraction = () => {
          setIsAudioUnlocked(true);
          // Briefly play and pause to unlock audio context in some browsers
          audio.play().then(() => audio.pause()).catch(() => {});
          window.removeEventListener('click', handleInteraction);
          window.removeEventListener('touchstart', handleInteraction);
      };

      window.addEventListener('click', handleInteraction);
      window.addEventListener('touchstart', handleInteraction);

      return () => {
          window.removeEventListener('click', handleInteraction);
          window.removeEventListener('touchstart', handleInteraction);
          audio.pause();
      };
  }, []);

  const playAdhan = useCallback((prayerName: string) => {
    if (!audioRef.current || !storage.isAdhanAudioEnabled()) return;
    
    // Check Fajr only setting
    if (storage.isAdhanFajrOnly() && prayerName !== 'الفجر') return;

    const voice = storage.getAdhanVoice();
    const source = ADHAN_SOURCES[voice];

    audioRef.current.src = source;
    audioRef.current.play().then(() => {
        setActiveAdhan({
            name: prayerName,
            stop: () => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                setActiveAdhan(null);
            }
        });
    }).catch(err => {
        console.warn("Adhan autoplay blocked:", err);
        setIsAudioUnlocked(false);
    });
  }, []);

  const checkReminders = useCallback(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    if (lastCheckedMinute.current === currentTime) return;
    lastCheckedMinute.current = currentTime;

    // 1. Check Standard Custom Reminders
    const reminders = storage.getReminders();
    const matchingReminders = reminders.filter(r => r.enabled && r.time === currentTime);

    if (matchingReminders.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      const settings = storage.getNotificationSettings();
      const vibratePattern = storage.getVibrationPattern(settings.vibrationType);

      matchingReminders.forEach(reminder => {
        try {
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification('تذكير من ريان', {
                      body: reminder.label,
                      icon: '/pwa-192x192.png',
                      tag: `rayyan-reminder-${reminder.id}`,
                      vibrate: vibratePattern,
                      data: { targetPath: reminder.targetPath }
                  } as any);
              });
          }
        } catch (e) {}
      });
    }

    // 2. Check Adhan Times
    const location = storage.getLastLocation();
    if (location) {
        try {
            const coords = new adhan.Coordinates(location.lat, location.lng);
            const params = adhan.CalculationMethod.MuslimWorldLeague();
            const prayerTimes = new adhan.PrayerTimes(coords, now, params);
            
            const formatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            const schedule = [
                { id: 'fajr', name: 'الفجر', time: formatter.format(prayerTimes.fajr) },
                { id: 'dhuhr', name: 'الظهر', time: formatter.format(prayerTimes.dhuhr) },
                { id: 'asr', name: 'العصر', time: formatter.format(prayerTimes.asr) },
                { id: 'maghrib', name: 'المغرب', time: formatter.format(prayerTimes.maghrib) },
                { id: 'isha', name: 'العشاء', time: formatter.format(prayerTimes.isha) },
            ];

            const currentPrayer = schedule.find(p => p.time === currentTime);
            if (currentPrayer && lastAdhanPlayed.current !== `${currentPrayer.id}-${currentTime}`) {
                lastAdhanPlayed.current = `${currentPrayer.id}-${currentTime}`;
                
                // Show Notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`حان الآن موعد أذان ${currentPrayer.name}`, {
                        body: 'حي على الصلاة، حي على الفلاح',
                        icon: '/pwa-192x192.png',
                    });
                }

                // Play Audio
                if (storage.isAdhanAudioEnabled()) {
                    playAdhan(currentPrayer.name);
                }
            }
        } catch (e) {
            console.error("Adhan schedule error", e);
        }
    }
  }, [playAdhan]);

  useEffect(() => {
    const intervalId = setInterval(checkReminders, 20000);
    return () => clearInterval(intervalId);
  }, [checkReminders]);

  return createPortal(
    <>
        {/* Adhan Active UI */}
        {activeAdhan && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-slideUp">
                <div className="bg-emerald-600 text-white rounded-3xl p-5 shadow-2xl flex items-center justify-between border border-white/20 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                            <Volume2 size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm opacity-80 font-arabicHead">أذان {activeAdhan.name}</h4>
                            <p className="text-lg font-bold font-arabicHead">حي على الصلاة...</p>
                        </div>
                    </div>
                    <button 
                        onClick={activeAdhan.stop}
                        className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>
        )}

        {/* Audio Blocked Warning */}
        {storage.isAdhanAudioEnabled() && !isAudioUnlocked && (
            <div className="fixed bottom-24 right-4 z-50 animate-bounce">
                <button 
                    onClick={() => setIsAudioUnlocked(true)}
                    className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold font-arabicHead"
                >
                    <VolumeX size={16} />
                    تفعيل صوت الأذان
                </button>
            </div>
        )}
    </>,
    document.body
  );
};

export default NotificationManager;