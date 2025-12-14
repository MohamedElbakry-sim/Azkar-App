
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as quranService from '../services/quranService';
import * as storage from '../services/storage';
import { SurahData } from '../types';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { Loader2 } from 'lucide-react';
import MushafPagesViewer from '../components/MushafPagesViewer';
import ErrorState from '../components/ErrorState';

const QuranReader: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { 
      scrollToAyah?: number; 
      autoPlay?: boolean; 
      showTafsir?: boolean; 
      highlightTerm?: string;
      initialPage?: number; 
  } | null;

  // Data State
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Audio State
  const [reciterId, setReciterId] = useState(quranService.getPreferredReciter());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyah, setCurrentAyah] = useState<{ surah: number, ayah: number } | null>(null);
  const [audioError, setAudioError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = handleAudioEnded;
    audioRef.current.onerror = () => {
        setAudioError(true);
        setIsPlaying(false);
    };

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        // Restore Status Bar
        if (Capacitor.isNativePlatform()) {
            StatusBar.setStyle({ style: Style.Light });
            StatusBar.show();
        }
    };
  }, []);

  // Update Reciter
  useEffect(() => {
      quranService.savePreferredReciter(reciterId);
  }, [reciterId]);

  // Load Data
  const loadContext = useCallback(async () => {
    if (!surahId) return;
    setLoading(true);
    setError(null);
    
    try {
      const id = parseInt(surahId);
      // 1. Fetch Surah Data (to know page mappings)
      const data = await quranService.getSurah(id);
      setSurahData(data);

      // 2. Determine Start Page & Highlight
      let startPage = data.ayahs[0].page; // Default to first page of surah
      let targetAyah = null;
      
      // If explicit page override (e.g. from Juz navigation)
      if (state?.initialPage) {
          startPage = state.initialPage;
      }
      // Or if deep linking to specific Ayah
      else if (state?.scrollToAyah) {
          const target = data.ayahs.find(a => a.numberInSurah === state.scrollToAyah);
          if (target) {
              startPage = target.page;
              targetAyah = { surah: id, ayah: state.scrollToAyah };
          }
      }

      setCurrentPage(startPage);
      setCurrentAyah(targetAyah); // Ensure highlighting is set or cleared
      setLoading(false);

      // Auto Play check
      if (state?.autoPlay) {
          playAyah(id, state.scrollToAyah || 1, true);
      }

      // Hide Status Bar for immersive reading on native
      if (Capacitor.isNativePlatform()) {
          StatusBar.hide();
      }

    } catch (e) {
      console.error("Failed to load reader", e);
      setError("تعذر تحميل السورة. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.");
      setLoading(false);
    }
  }, [surahId, state]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  // --- Audio Logic ---

  const getAudioUrl = (surah: number, ayah: number) => {
      const reciter = quranService.RECITERS.find(r => r.id === reciterId) || quranService.RECITERS[0];
      const s = surah.toString().padStart(3, '0');
      const a = ayah.toString().padStart(3, '0');
      return `https://everyayah.com/data/${reciter.subpath}/${s}${a}.mp3`;
  };

  const playAyah = (surah: number, ayah: number, forceStart = false) => {
      if (!audioRef.current) return;

      const url = getAudioUrl(surah, ayah);
      
      // If already playing this ayah, toggle pause
      if (currentAyah?.surah === surah && currentAyah?.ayah === ayah && !forceStart) {
          if (isPlaying) {
              audioRef.current.pause();
              setIsPlaying(false);
          } else {
              audioRef.current.play();
              setIsPlaying(true);
          }
          return;
      }

      // New Ayah
      setCurrentAyah({ surah, ayah });
      setIsPlaying(true);
      setAudioError(false);
      
      audioRef.current.src = url;
      audioRef.current.play().catch(e => {
          console.error("Playback failed", e);
          setIsPlaying(false);
          setAudioError(true);
      });

      // Sync Page if needed
      if (surahData) {
          const ayahData = surahData.ayahs.find(a => a.numberInSurah === ayah);
          if (ayahData && ayahData.page !== currentPage) {
              setCurrentPage(ayahData.page);
          }
      }
  };

  const handleAudioEnded = () => {
      if (!currentAyah || !surahData) return;

      // Find next ayah
      const currentIndex = surahData.ayahs.findIndex(a => a.numberInSurah === currentAyah.ayah);
      
      if (currentIndex !== -1 && currentIndex < surahData.ayahs.length - 1) {
          const nextAyah = surahData.ayahs[currentIndex + 1];
          playAyah(surahData.number, nextAyah.numberInSurah, true);
      } else {
          // Surah Finished
          setIsPlaying(false);
          setCurrentAyah(null);
      }
  };

  const togglePlay = () => {
      if (currentAyah) {
          playAyah(currentAyah.surah, currentAyah.ayah);
      } else if (surahData) {
          // Start from beginning or visible page
          // For simplicity, start from first ayah of surah if nothing selected
          playAyah(surahData.number, 1, true);
      }
  };

  const handleReciterChange = (id: string) => {
      setReciterId(id);
      // If playing, restart current ayah with new reciter
      if (isPlaying && currentAyah) {
          playAyah(currentAyah.surah, currentAyah.ayah, true);
      }
  };

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
          </div>
      );
  }

  if (error) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4">
              <ErrorState 
                  title="خطأ في التحميل"
                  message={error}
                  onRetry={loadContext}
                  fullScreen={true}
              />
          </div>
      );
  }

  return (
    <div className="h-screen w-full bg-white dark:bg-dark-bg">
        <MushafPagesViewer 
            initialPage={currentPage}
            onPageChange={(p) => setCurrentPage(p)}
            onClose={() => navigate(-1)}
            highlightedAyah={currentAyah}
            initialHighlightTerm={state?.highlightTerm}
            onAyahClick={(s, a) => playAyah(s, a, true)}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            reciterId={reciterId}
            onReciterChange={handleReciterChange}
            onClearHighlight={() => {
                // Clear the external highlight (Search/Audio cursor) if the user interacts
                // but ONLY if audio is NOT actively playing.
                if (!isPlaying) {
                    setCurrentAyah(null);
                }
            }}
        />
    </div>
  );
};

export default QuranReader;
