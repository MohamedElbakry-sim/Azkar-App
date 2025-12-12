
import React, { useEffect, useState, useMemo } from 'react';
import { Radio as RadioIcon, Play, Pause, Search, Volume2, VolumeX, BarChart3, WifiOff, AlertCircle } from 'lucide-react';
import * as radioService from '../services/radioService';
import { RadioStation } from '../types';
import ErrorState from '../components/ErrorState';
import { useRadio } from '../contexts/RadioContext';

const Radio: React.FC = () => {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Consume Global Radio Context
  const { 
      currentStation, 
      isPlaying, 
      isBuffering, 
      playStation, 
      togglePlay, 
      volume, 
      setVolume, 
      isMuted, 
      toggleMute,
      hasError: playbackError
  } = useRadio();

  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      try {
        const data = await radioService.getRadioStations();
        if (data.length > 0) {
          setStations(data);
          // Auto-select first station if none active is not handled here to avoid auto-play on load
          // Only play if user clicks
        } else {
          setFetchError(true);
        }
      } catch (e) {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    return stations.filter(s => s.name.includes(searchQuery));
  }, [stations, searchQuery]);

  // If no station is active, but list loaded, we can conceptually "target" the first one for the UI 
  // without playing it, or just show "Select Station".
  // Let's fallback to first station for display only if nothing is globally playing.
  const displayStation = currentStation || stations[0];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 animate-pulse font-arabic">جاري ضبط الموجات...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="pt-10">
        <ErrorState 
            title="تعذر الاتصال بالإذاعة" 
            message="يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى."
            onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      
      {/* Header */}
      <div className="text-center py-6 md:py-8">
        <div className="inline-flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-full mb-4 text-red-600 dark:text-red-400">
           <RadioIcon size={32} />
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2 font-arabicHead">إذاعة القرآن الكريم</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base font-arabic">
          بث مباشر لأعذب التلاوات على مدار 24 ساعة
        </p>
      </div>

      {/* Main Player Card */}
      <div className="sticky top-4 z-30">
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 dark:from-dark-panel dark:to-black rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-emerald-900/20 border border-white/10 relative overflow-hidden">
            
            {/* Visualizer Background Effect */}
            {isPlaying && !playbackError && !isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-10 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-2 bg-white rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random()}s` }}></div>
                    ))}
                </div>
            )}

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${isPlaying ? 'bg-red-500 text-white' : 'bg-white/10 text-white/50'}`}>
                        {isPlaying ? (
                            <BarChart3 size={40} className="animate-pulse" />
                        ) : (
                            <RadioIcon size={40} />
                        )}
                    </div>
                    
                    <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${playbackError ? 'bg-red-500' : isBuffering ? 'bg-yellow-400 animate-bounce' : isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                            <span className={`text-xs font-bold uppercase tracking-wider ${playbackError ? 'text-red-300' : isBuffering ? 'text-yellow-200' : 'text-emerald-200'}`}>
                                {playbackError ? 'خطأ في البث' : isBuffering ? 'جاري التحميل...' : isPlaying ? 'بث مباشر' : 'متوقف'}
                            </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold font-arabicHead leading-tight">
                            {displayStation?.name || 'اختر إذاعة'}
                        </h2>
                        {playbackError && (
                            <p className="text-xs text-red-200 mt-1 flex items-center gap-1">
                                <AlertCircle size={12} />
                                تعذر تشغيل هذه المحطة
                            </p>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-center md:justify-end">
                    {/* Volume (Desktop) */}
                    <div className="hidden md:flex items-center gap-2 group">
                        <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full">
                            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={isMuted ? 0 : volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>

                    <button 
                        onClick={() => currentStation ? togglePlay() : stations[0] && playStation(stations[0])}
                        disabled={isBuffering}
                        className={`w-16 h-16 bg-white text-emerald-800 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-black/20 focus:outline-none focus:ring-4 focus:ring-white/30 ${isBuffering ? 'opacity-80 cursor-wait' : ''}`}
                    >
                        {isBuffering ? (
                            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : isPlaying ? (
                            <Pause size={32} fill="currentColor" /> 
                        ) : (
                            <Play size={32} fill="currentColor" className="ml-1" />
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-border min-h-[400px]">
        <div className="relative mb-6">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="ابحث عن قارئ أو إذاعة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-arabic"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStations.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400">
                    <WifiOff size={48} className="mx-auto mb-3 opacity-50" />
                    <p>لا توجد إذاعات مطابقة</p>
                </div>
            ) : (
                filteredStations.map((station) => (
                    <button
                        key={station.id}
                        onClick={() => playStation(station)}
                        className={`
                            flex items-center gap-3 p-4 rounded-xl text-right transition-all border
                            ${currentStation?.id === station.id 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                                : 'bg-gray-50 dark:bg-dark-bg border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                            }
                        `}
                    >
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                            ${currentStation?.id === station.id 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-gray-200 dark:bg-dark-surface text-gray-500'
                            }
                        `}>
                            {currentStation?.id === station.id && isPlaying && !playbackError ? (
                                <div className="flex gap-0.5 h-4 items-end">
                                    <div className="w-1 bg-white animate-pulse" style={{ height: '60%', animationDelay: '0s' }}></div>
                                    <div className="w-1 bg-white animate-pulse" style={{ height: '100%', animationDelay: '0.2s' }}></div>
                                    <div className="w-1 bg-white animate-pulse" style={{ height: '40%', animationDelay: '0.4s' }}></div>
                                </div>
                            ) : (
                                <RadioIcon size={18} />
                            )}
                        </div>
                        <span className={`font-bold text-sm ${currentStation?.id === station.id ? 'text-emerald-800 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {station.name}
                        </span>
                    </button>
                ))
            )}
        </div>
      </div>

    </div>
  );
};

export default Radio;
