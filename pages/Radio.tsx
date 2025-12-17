
import React, { useEffect, useState, useMemo } from 'react';
import { Radio as RadioIcon, Play, Pause, Search, Volume2, VolumeX, BarChart3, WifiOff, AlertCircle, Heart, Star, Signal } from 'lucide-react';
import * as radioService from '../services/radioService';
import { RadioStation } from '../types';
import ErrorState from '../components/ErrorState';
import { useRadio } from '../contexts/RadioContext';
import * as storage from '../services/storage';

const Radio: React.FC = () => {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteStations, setFavoriteStations] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

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
    setFavoriteStations(storage.getRadioFavorites());
  }, []);

  const toggleFavorite = (e: React.MouseEvent, stationId: number) => {
      e.stopPropagation();
      const updated = storage.toggleRadioFavorite(stationId);
      setFavoriteStations(updated);
  };

  const filteredStations = useMemo(() => {
    let result = stations;
    
    // 1. Filter by Tab
    if (activeTab === 'favorites') {
        result = result.filter(s => favoriteStations.includes(s.id));
    }

    // 2. Filter by Search
    if (searchQuery.trim()) {
        result = result.filter(s => s.name.includes(searchQuery));
    }

    // 3. Sort: Favorites first in 'All' view, then alphabetical
    return result.sort((a, b) => {
        if (activeTab === 'all') {
            const isFavA = favoriteStations.includes(a.id);
            const isFavB = favoriteStations.includes(b.id);
            if (isFavA && !isFavB) return -1;
            if (!isFavA && isFavB) return 1;
        }
        return a.name.localeCompare(b.name, 'ar');
    });
  }, [stations, searchQuery, favoriteStations, activeTab]);

  const displayStation = currentStation || stations[0];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center animate-pulse">
                <RadioIcon size={40} className="text-emerald-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full animate-bounce"></div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-bold font-arabic animate-pulse">جاري ضبط الموجات...</p>
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
    <div className="max-w-5xl mx-auto pb-28 space-y-8 animate-fadeIn px-2 md:px-0">
      
      {/* --- Main Player Hero --- */}
      <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/20 border border-white/10 group">
        
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 z-0"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] z-0 mix-blend-overlay"></div>
        
        {/* Animated Glows */}
        {isPlaying && !playbackError && (
            <>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/30 blur-[80px] rounded-full animate-pulse z-0"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 blur-[80px] rounded-full animate-pulse z-0" style={{ animationDelay: '1s' }}></div>
            </>
        )}

        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            
            {/* Visualizer & Icon */}
            <div className="relative">
                <div className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl flex items-center justify-center shadow-lg border-4 border-white/10 backdrop-blur-md transition-all duration-500 ${isPlaying ? 'bg-white/20' : 'bg-white/10'}`}>
                    {isPlaying && !playbackError && !isBuffering ? (
                        <div className="flex items-end gap-1.5 h-16">
                            {[...Array(5)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-2.5 bg-white rounded-full animate-[bounce_1s_infinite]" 
                                    style={{ 
                                        height: '60%', 
                                        animationDuration: `${0.6 + i * 0.1}s`,
                                        animationTimingFunction: 'ease-in-out'
                                    }} 
                                />
                            ))}
                        </div>
                    ) : (
                        <RadioIcon size={64} className="text-white opacity-80" />
                    )}
                </div>
                
                {/* Status Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 whitespace-nowrap">
                    <div className={`w-2 h-2 rounded-full ${playbackError ? 'bg-red-500' : isBuffering ? 'bg-yellow-400 animate-pulse' : isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        {playbackError ? 'خطأ' : isBuffering ? 'تحميل...' : isPlaying ? 'مباشر' : 'متوقف'}
                    </span>
                </div>
            </div>

            {/* Info & Controls */}
            <div className="flex-1 text-center md:text-right flex flex-col items-center md:items-end gap-6 w-full">
                <div className="space-y-2">
                    <h2 className="text-3xl md:text-5xl font-bold text-white font-arabicHead leading-tight drop-shadow-md">
                        {displayStation?.name || 'إذاعة القرآن الكريم'}
                    </h2>
                    {playbackError ? (
                        <p className="text-red-200 text-sm flex items-center justify-center md:justify-end gap-1 font-bold bg-red-900/30 px-3 py-1 rounded-lg inline-flex">
                            <AlertCircle size={14} />
                            تعذر تشغيل البث
                        </p>
                    ) : (
                        <p className="text-emerald-100/80 font-medium text-lg font-arabic flex items-center justify-center md:justify-end gap-2">
                            <Signal size={18} />
                            أثير إذاعي نقي على مدار الساعة
                        </p>
                    )}
                </div>

                {/* Main Controls */}
                <div className="flex items-center gap-6 w-full justify-center md:justify-end">
                    
                    {/* Volume Slider (Desktop) */}
                    <div className="hidden md:flex items-center gap-3 bg-black/20 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/5">
                        <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors">
                            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05" 
                            value={isMuted ? 0 : volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                    </div>

                    {/* Play Button */}
                    <button 
                        onClick={() => currentStation ? togglePlay() : stations[0] && playStation(stations[0])}
                        disabled={isBuffering}
                        className={`
                            w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95
                            ${isBuffering 
                                ? 'bg-white/10 cursor-wait' 
                                : 'bg-white text-emerald-900 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                            }
                        `}
                    >
                        {isBuffering ? (
                            <div className="w-8 h-8 border-4 border-white/50 border-t-white rounded-full animate-spin"></div>
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

      {/* --- Filter & List Section --- */}
      <div className="space-y-6">
        
        {/* Search & Tabs */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 z-20 bg-[#F9FAFB]/95 dark:bg-[#121212]/95 backdrop-blur-xl py-2 -mx-4 px-4 md:mx-0 md:px-0">
            {/* Tabs */}
            <div className="flex bg-gray-200 dark:bg-dark-surface p-1 rounded-2xl w-full md:w-auto">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'all' ? 'bg-white dark:bg-dark-elevated text-gray-800 dark:text-white shadow-sm scale-[1.02]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    <RadioIcon size={16} />
                    جميع الإذاعات
                </button>
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'favorites' ? 'bg-white dark:bg-dark-elevated text-red-500 shadow-sm scale-[1.02]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    <Heart size={16} fill={activeTab === 'favorites' ? "currentColor" : "none"} />
                    المفضلة
                </button>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="ابحث عن قارئ أو إذاعة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-arabic shadow-sm"
                />
            </div>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStations.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-dark-surface rounded-3xl border border-dashed border-gray-200 dark:border-dark-border">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4">
                        <WifiOff size={32} className="opacity-50" />
                    </div>
                    <p className="font-bold text-lg text-gray-500 dark:text-gray-400">لا توجد إذاعات مطابقة</p>
                    {activeTab === 'favorites' && <p className="text-sm mt-2">اضغط على رمز القلب لإضافة محطات للمفضلة</p>}
                </div>
            ) : (
                filteredStations.map((station) => {
                    const isFav = favoriteStations.includes(station.id);
                    const isActive = currentStation?.id === station.id;
                    
                    return (
                        <div
                            key={station.id}
                            onClick={() => playStation(station)}
                            className={`
                                relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer group overflow-hidden
                                ${isActive 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 dark:border-emerald-500 shadow-lg shadow-emerald-500/10 transform scale-[1.02]' 
                                    : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md'
                                }
                            `}
                        >
                            {/* Active Indicator Bar */}
                            {isActive && <div className="absolute right-0 top-4 bottom-4 w-1 bg-emerald-500 rounded-l-full"></div>}

                            <div className="flex items-center gap-4">
                                {/* Icon / Play State */}
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                    ${isActive 
                                        ? 'bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg' 
                                        : 'bg-gray-100 dark:bg-dark-bg text-gray-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 group-hover:text-emerald-600'
                                    }
                                `}>
                                    {isActive && isPlaying && !playbackError ? (
                                        <div className="flex gap-0.5 h-4 items-end">
                                            <div className="w-1 bg-white animate-[bounce_1s_infinite]" style={{ animationDelay: '0s' }}></div>
                                            <div className="w-1 bg-white animate-[bounce_1s_infinite]" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-1 bg-white animate-[bounce_1s_infinite]" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    ) : (
                                        <Play size={20} className={isActive ? "ml-1" : "ml-1 opacity-0 group-hover:opacity-100 transition-opacity"} fill="currentColor" />
                                    )}
                                    {/* Default Icon when not hovering/playing */}
                                    {!isActive && (
                                        <RadioIcon size={20} className="absolute transition-opacity group-hover:opacity-0" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-base truncate font-arabic ${isActive ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {station.name}
                                    </h3>
                                    {isActive && (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 animate-pulse">
                                            {isPlaying ? 'يعمل الآن' : 'متوقف مؤقتاً'}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => toggleFavorite(e, station.id)}
                                    className={`
                                        p-2 rounded-full transition-all active:scale-90
                                        ${isFav 
                                            ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                                            : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-bg'
                                        }
                                    `}
                                >
                                    <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

    </div>
  );
};

export default Radio;
