
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
    const determineTime = () => {
      // 1. Get Location (or default to Mecca if unknown)
      // Ideally, we'd use the cached location from PrayerTimes, but for simplicity/privacy
      // we'll try to get it, or fallback.
      if (!navigator.geolocation) {
         setLoading(false);
         return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
           calculate(position.coords.latitude, position.coords.longitude);
        },
        () => {
           // Fallback: Use simple hour-based logic if location denied
           // Morning: 4 AM - 11 AM
           // Evening: 2 PM - 10 PM
           const hour = new Date().getHours();
           if (hour >= 4 && hour < 12) setSuggestion('sabah');
           else if (hour >= 14 && hour < 22) setSuggestion('masaa');
           setLoading(false);
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
        
        // Logic:
        // Morning Azkar: Fajr -> Dhuhr
        // Evening Azkar: Asr -> Isha
        
        if (now >= prayerTimes.fajr && now < prayerTimes.dhuhr) {
            setSuggestion('sabah');
        } else if (now >= prayerTimes.asr && now < prayerTimes.isha) {
            setSuggestion('masaa');
        } else {
            setSuggestion(null); // No specific suggestion (e.g., late night or mid-day)
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    determineTime();
  }, []);

  if (loading) return null;
  if (!suggestion) return null;

  const isSabah = suggestion === 'sabah';
  
  return (
    <div 
        onClick={() => navigate(`/category/${suggestion}`)}
        className={`
            relative overflow-hidden rounded-3xl p-6 mb-8 cursor-pointer group shadow-sm transition-all duration-300
            ${isSabah 
                ? 'bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 hover:shadow-orange-200/50' 
                : 'bg-gradient-to-br from-indigo-50 to-blue-100 border border-indigo-200 hover:shadow-indigo-200/50'}
        `}
    >
        {/* Decorative Icon Background */}
        <div className={`absolute -left-4 -bottom-4 opacity-10 transition-transform group-hover:scale-110 duration-500 ${isSabah ? 'text-orange-600' : 'text-indigo-600'}`}>
            {isSabah ? <Sun size={120} /> : <Moon size={120} />}
        </div>

        <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isSabah ? 'bg-orange-200 text-orange-700' : 'bg-indigo-200 text-indigo-700'}`}>
                    {isSabah ? <Sun size={24} /> : <Moon size={24} />}
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${isSabah ? 'text-orange-800' : 'text-indigo-800'}`}>
                        {isSabah ? 'وقت أذكار الصباح' : 'وقت أذكار المساء'}
                    </h3>
                    <p className={`text-sm opacity-80 ${isSabah ? 'text-orange-900' : 'text-indigo-900'}`}>
                        {isSabah ? 'ابدأ يومك بذكر الله وحفظه' : 'اختم يومك بالذكر والطمأنينة'}
                    </p>
                </div>
            </div>

            <div className={`p-2 rounded-full transition-transform group-hover:-translate-x-1 ${isSabah ? 'bg-orange-200/50 text-orange-700' : 'bg-indigo-200/50 text-indigo-700'}`}>
                <ArrowRight size={20} className="rtl:rotate-180" />
            </div>
        </div>
    </div>
  );
};

export default SmartAzkarSuggestion;
