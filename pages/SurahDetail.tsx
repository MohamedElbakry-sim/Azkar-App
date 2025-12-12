
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QURAN_META } from '../data/quranMeta';
import { ArrowLeft, Play, BookOpen, Heart, Info, ArrowRight } from 'lucide-react';

const SurahDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const surahNumber = parseInt(id || '1');
  const meta = QURAN_META[surahNumber - 1];

  if (!meta) return null;

  const handleRead = () => {
    navigate(`/quran/read/${surahNumber}`);
  };

  const handleListen = () => {
    navigate(`/quran/read/${surahNumber}`, { state: { autoPlay: true } });
  };

  const handleTafsir = () => {
    navigate(`/quran/read/${surahNumber}`, { state: { showTafsir: true } });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col relative overflow-hidden">
        {/* Background Graphic */}
        <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-emerald-600 to-teal-800 rounded-b-[3rem] z-0">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 text-white">
            <button onClick={() => navigate('/quran')} className="p-2 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors">
                <ArrowRight size={24} className="rtl:rotate-0" />
            </button>
            <span className="font-english font-bold tracking-widest text-sm opacity-80">SURAH INFO</span>
            <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center px-6 pt-4">
            {/* Surah Title Card */}
            <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-3xl shadow-xl p-8 text-center mb-8 border border-gray-100 dark:border-dark-border animate-slideUp">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4 font-bold text-xl border-4 border-white dark:border-dark-surface shadow-sm">
                    {meta.number}
                </div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white font-arabicHead mb-2">{meta.name}</h1>
                <p className="text-gray-400 font-english text-lg mb-6">{meta.englishName}</p>
                
                <div className="flex justify-center gap-4 text-sm font-bold text-gray-500 dark:text-gray-400">
                    <span className="bg-gray-100 dark:bg-dark-bg px-3 py-1 rounded-lg">{meta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                    <span className="bg-gray-100 dark:bg-dark-bg px-3 py-1 rounded-lg">{meta.numberOfAyahs} آيات</span>
                </div>
            </div>

            {/* Actions Grid */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-4 mb-auto animate-slideUp" style={{ animationDelay: '100ms' }}>
                <button 
                    onClick={handleRead}
                    className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3 transition-transform active:scale-95"
                >
                    <BookOpen size={24} />
                    <span className="font-bold text-lg">قراءة السورة</span>
                </button>
                
                <button 
                    onClick={handleListen}
                    className="bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex flex-col items-center gap-2 text-gray-600 dark:text-gray-300 hover:border-emerald-200 transition-colors"
                >
                    <Play size={24} className="text-emerald-500" />
                    <span className="font-bold text-sm">استماع</span>
                </button>

                <button 
                    onClick={handleTafsir}
                    className="bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex flex-col items-center gap-2 text-gray-600 dark:text-gray-300 hover:border-emerald-200 transition-colors"
                >
                    <Info size={24} className="text-blue-500" />
                    <span className="font-bold text-sm">تفسير</span>
                </button>
            </div>

            {/* Bismillah */}
            {surahNumber !== 1 && surahNumber !== 9 && (
                <div className="pb-12 pt-8 opacity-60">
                    <p className="font-quran text-2xl text-gray-800 dark:text-gray-200">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default SurahDetail;
