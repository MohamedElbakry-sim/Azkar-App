
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { RadioStation } from '../types';

interface RadioContextType {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  isBuffering: boolean;
  playStation: (station: RadioStation) => void;
  togglePlay: () => void;
  stop: () => void;
  volume: number;
  setVolume: (vol: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  hasError: boolean;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export const RadioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Object once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    
    const handlePlay = () => {
        setIsPlaying(true);
        setHasError(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    
    const handleError = (e: Event) => {
        const target = e.target as HTMLAudioElement;
        const error = target.error;
        console.warn("Audio Error Event:", error);
        
        // Code 20 (ABORT) happens on manual stop/load change, ignore it.
        // Code 4 (SRC_NOT_SUPPORTED) is the main one to catch.
        if (error && error.code !== 20) { 
            setHasError(true);
            setIsPlaying(false);
            setIsBuffering(false);
        }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handleCanPlay);
    audio.addEventListener('error', handleError);

    audioRef.current = audio;

    return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('playing', handleCanPlay);
        audio.removeEventListener('error', handleError);
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
    };
  }, []);

  // Handle Volume Changes
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const playStation = async (station: RadioStation) => {
    if (!audioRef.current) return;

    // If clicking the same station, just toggle
    if (currentStation?.id === station.id && !hasError) {
        togglePlay();
        return;
    }

    try {
        setHasError(false);
        setIsBuffering(true);
        setCurrentStation(station);
        
        audioRef.current.src = station.url;
        audioRef.current.load();
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            await playPromise.catch(error => {
                // Auto-play policy or load error
                console.warn("Playback prevented:", error);
                setIsPlaying(false);
                setIsBuffering(false);
                if (error.name !== 'AbortError') {
                    setHasError(true);
                }
            });
        }
    } catch (err) {
        console.error("Play Station Exception:", err);
        setHasError(true);
        setIsPlaying(false);
        setIsBuffering(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentStation) return;

    if (isPlaying) {
        audioRef.current.pause();
    } else {
        // If we are in error state, try reloading the current station
        if (hasError) {
            playStation(currentStation);
            return;
        }

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.error("Resume Error:", e);
                // If resume fails with no supported sources (e.g. stream expired), set error
                if (e.name === 'NotSupportedError' || e.message.includes('no supported sources')) {
                    setHasError(true);
                }
                setIsPlaying(false);
            });
        }
    }
  };

  const stop = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        // audioRef.current.currentTime = 0; // Not valid for live streams usually
        audioRef.current.removeAttribute('src'); 
        audioRef.current.load();
    }
    setCurrentStation(null);
    setIsPlaying(false);
    setIsBuffering(false);
    setHasError(false);
  };

  const setVolume = (vol: number) => {
      setVolumeState(vol);
      if (vol > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <RadioContext.Provider value={{
        currentStation,
        isPlaying,
        isBuffering,
        playStation,
        togglePlay,
        stop,
        volume,
        setVolume,
        isMuted,
        toggleMute,
        hasError
    }}>
      {children}
    </RadioContext.Provider>
  );
};

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
};
