
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, ArrowRight, Loader2 } from 'lucide-react';
import * as AdhanLib from 'adhan';
import * as storage from '../services/storage';

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
        
        if (hour >= 3 && hour < 12) {
            setSuggestion('sabah');
        } 
        else if (hour >= 13 && hour < 23) {
            setSuggestion('masaa');
        } else {
            setSuggestion(null);
        }
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
           calculate(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
           console.warn("Geolocation failed/denied:", error);
           useFallbackLogic();
        },
        { 
            timeout: 5000,
            maximumAge: 60000, 
            enableHighAccuracy: false
        }
      );
    };

    const calculate = (lat: number, lng: number) => {
      try {
        const coordinates = new adhan.Coordinates(lat, lng);
        const params = adhan.CalculationMethod.MuslimWorldLeague();
        const date = new Date();
        const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
        
        const now = new Date();
        
        if (now >= prayerTimes.fajr && now < prayerTimes.dhuhr) {
            setSuggestion('sabah');
        } else if (now >= prayerTimes.asr && now < prayerTimes.isha) {
            setSuggestion('masaa');
        } else {
            const hour = now.getHours();
            if (hour >= 5 && hour < 12) setSuggestion('sabah');
            else if (hour >= 14 && hour < 22) setSuggestion('masaa');
            else setSuggestion(null);
        }
      } catch (e) {
        console.error("Adhan calculation error:", e);
        useFallbackLogic();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    determineTime();

    return () => {
        isMounted = false;
    };
  }, []);

  if (loading) return null;
  if (!suggestion) return null;

  const isSabah = suggestion === 'sabah';
  
  return (
    <div 
        onClick={() => navigate(`/category/${suggestion}`)}
        className={`
            relative overflow-hidden rounded-3xl p-6 mb-8 cursor-pointer group shadow-lg transition-all duration-300 animate-fadeIn
            ${isSabah 
                ? 'bg-gradient-to-br from-[#F1C40F] to-[#F39C12] text-white shadow-orange-500/20' // Accent Gradient for Sabah (Sun/Gold)
                : 'bg-gradient-to-br from-[#5D6D7E] to-[#34495E] text-white shadow-slate-500/20' // Secondary Gradient for Masaa (Night/Slate)
            }
        `}
    >
        {/* Decorative Icon Background */}
        <div className="absolute -left-4 -bottom-4 opacity-10 transition-transform group-hover:scale-110 duration-500 text-white">
            {isSabah ? <Sun size={120} /> : <Moon size={120} />}
        </div>

        <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm text-white">
                    {isSabah ? <Sun size={24} /> : <Moon size={24} />}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">
                        {isSabah ? 'وقت أذكار الصباح' : 'وقت أذكار المساء'}
                    </h3>
                    <p className="text-sm text-white/90 font-medium mt-1">
                        {isSabah ? 'ابدأ يومك بذكر الله وحفظه' : 'اختم يومك بالذكر والطمأنينة'}
                    </p>
                </div>
            </div>

            <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:-translate-x-1 text-white">
                <ArrowRight size={20} className="rtl:rotate-180" />
            </div>
        </div>
    </div>
  );
};

export default SmartAzkarSuggestion;
