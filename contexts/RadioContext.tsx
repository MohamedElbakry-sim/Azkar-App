
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
    audio.crossOrigin = "anonymous";
    audio.preload = "none";
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleError = (e: any) => {
        console.error("Global Audio Error:", e);
        setIsBuffering(false);
        setIsPlaying(false);
        setHasError(true);
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
        audio.src = "";
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
    if (currentStation?.id === station.id) {
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
            await playPromise;
        }
    } catch (err) {
        console.error("Play Station Error:", err);
        setHasError(true);
        setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentStation) return;

    if (isPlaying) {
        audioRef.current.pause();
    } else {
        audioRef.current.play().catch(e => {
            console.error("Resume Error:", e);
            setHasError(true);
        });
    }
  };

  const stop = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
    }
    setCurrentStation(null);
    setIsPlaying(false);
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
