import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as storage from '../services/storage';
import * as AdhanLib from 'adhan';

const adhan = (AdhanLib as any).default || AdhanLib;

const ADHAN_SOURCES: Record<storage.AdhanVoice, string> = {
    mecca: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
    madina: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
    alaqsa: 'https://www.islamcan.com/audio/adhan/azan14.mp3',
    standard: 'https://www.islamcan.com/audio/adhan/azan20.mp3'
};

const NotificationManager: React.FC = () => {
  const lastCheckedMinute = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    // محاولة فك حظر الصوت عند أول تفاعل حقيقي
    const unlock = () => {
        audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
        }).catch(() => {});
        window.removeEventListener('click', unlock);
    };
    window.addEventListener('click', unlock);

    return () => {
        window.removeEventListener('click', unlock);
        audio.pause();
        audio.src = "";
    };
  }, []);

  const playAdhan = useCallback((prayerName: string) => {
    if (!audioRef.current || !storage.isAdhanAudioEnabled()) return;
    if (storage.isAdhanFajrOnly() && prayerName !== 'الفجر') return;

    const voice = storage.getAdhanVoice();
    audioRef.current.src = ADHAN_SOURCES[voice] || ADHAN_SOURCES.standard;
    audioRef.current.play().catch(err => {
        console.warn("Audio playback blocked. User interaction required.");
    });
  }, []);

  const checkReminders = useCallback(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (lastCheckedMinute.current === currentTime) return;
    lastCheckedMinute.current = currentTime;

    const isPermissionGranted = 'Notification' in window && Notification.permission === 'granted';

    // 1. التذكيرات المخصصة
    const reminders = storage.getReminders();
    reminders.filter(r => r.enabled && r.time === currentTime).forEach(reminder => {
      if (isPermissionGranted) {
        new Notification('تذكير من ريان', {
          body: reminder.label,
          icon: '/favicon.svg',
          tag: `rem-${reminder.id}`
        } as any);
      }
    });

    // 2. مواقيت الصلاة
    const location = storage.getLastLocation();
    if (location) {
        try {
            const coords = new adhan.Coordinates(location.lat, location.lng);
            const params = adhan.CalculationMethod.MuslimWorldLeague();
            const prayerTimes = new adhan.PrayerTimes(coords, now, params);
            
            const schedule = [
                { id: 'fajr', name: 'الفجر', time: prayerTimes.fajr },
                { id: 'dhuhr', name: 'الظهر', time: prayerTimes.dhuhr },
                { id: 'asr', name: 'العصر', time: prayerTimes.asr },
                { id: 'maghrib', name: 'المغرب', time: prayerTimes.maghrib },
                { id: 'isha', name: 'العشاء', time: prayerTimes.isha },
            ];

            schedule.forEach(p => {
                const pTimeStr = `${p.time.getHours().toString().padStart(2, '0')}:${p.time.getMinutes().toString().padStart(2, '0')}`;
                if (pTimeStr === currentTime) {
                    if (isPermissionGranted) {
                        new Notification(`حان الآن موعد أذان ${p.name}`, {
                            body: 'حي على الصلاة، حي على الفلاح',
                            icon: '/favicon.svg',
                            tag: `adhan-${p.id}`
                        });
                    }
                    playAdhan(p.name);
                }
            });
        } catch (e) {}
    }
  }, [playAdhan]);

  useEffect(() => {
    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  return null;
};

export default NotificationManager;