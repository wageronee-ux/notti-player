"use client";
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';
import { Search, Heart, Play, Pause, ListMusic, TrendingUp, Music2, Plus, X } from 'lucide-react';

export default function PlayerPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [charts, setCharts] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('charts');
  const [isMounted, setIsMounted] = useState(false); // Защита от гидратации

  // 1. Проверка монтирования компонента (решает ошибку Hydration Error)
  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== 'undefined') {
      // Инициализация Telegram
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        tg.headerColor = '#050505';
      }
      
      // Загрузка лайков
      const saved = localStorage.getItem('tg_favs');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          console.error("Ошибка парсинга localStorage", e);
        }
      }
    }
    fetchCharts();
  }, []);

  // 2. Сохранение лайков при изменении
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('tg_favs', JSON.stringify(favorites));
    }
  }, [favorites, isMounted]);

  const fetchCharts = async () => {
    try {
      const res = await fetch('/api/search?q=top+hits+2026');
      const data = await res.json();
      setCharts(data.items || []);
    } catch (err) {
      console.error("Ошибка загрузки чартов", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setActiveTab('search');
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (err) {
      console.error("Ошибка поиска", err);
    }
  };

  const toggleLike = (video) => {
    // Вызываем вибрацию Telegram при лайке
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    const isLiked = favorites.find(v => v.id.videoId === video.id.videoId);
    if (isLiked) {
      setFavorites(favorites.filter(v => v.id.videoId !== video.id.videoId));
    } else {
      setFavorites([...favorites, video]);
    }
  };

  // Если компонент еще не загружен в браузере, ничего не рендерим (избегаем ошибок)
  if (!isMounted) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <div className="min-h-screen pb-32 animate-in fade-in duration-700">
      {/* Search Bar */}
      <header className="p-4 sticky top-0 z-40 glass">
        <form onSubmit={handleSearch} className="relative">
          <input 
            className="w-full bg-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none border border-white/10 focus:border-blue-500 transition-all text-sm"
            placeholder="Треки, артисты..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-3 text-slate-500" size={18} />
        </form>
      </header>

      {/* Tabs */}
      <div className="flex justify-around p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 bg-black/20">
        <button onClick={() => setActiveTab('charts')} className={activeTab === 'charts' ? 'text-blue-500' : ''}>Чарты</button>
        <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? 'text-blue-500' : ''}>Поиск</button>
        <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? 'text-blue-500' : ''}>Медиатека</button>
      </div>

      <main className="p-4">
        {activeTab === 'charts' && (
          <div className="grid grid-cols-2 gap-4">
            {charts.map((v) => (
              <div key={v.id.videoId} className="bg-white/5 rounded-3xl p-3 border border-white/5 hover:bg-white/10 transition shadow-xl">
                <div className="relative rounded-2xl overflow-hidden aspect-square" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                  <img src={v.snippet.thumbnails.high.url} className="w-full h-full object-cover" alt="cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                    <Play fill="white" size={32} />
                  </div>
                </div>
                <p className="mt-3 font-bold text-[13px] line-clamp-1">{v.snippet.title}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-slate-500 truncate w-2/3">{v.snippet.channelTitle}</span>
                  <button onClick={() => toggleLike(v)}>
                    <Heart size={18} fill={favorites.find(f => f.id.videoId === v.id.videoId) ? "#3b82f6" : "none"} className={favorites.find(f => f.id.videoId === v.id.videoId) ? "text-blue-500" : "text-slate-600"} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black flex items-center gap-2 px-2">Мои лайки</h2>
            {favorites.length === 0 && <p className="text-slate-500 p-4 text-center">Тут пока пусто...</p>}
            {favorites.map(v => (
              <div key={v.id.videoId} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                <img src={v.snippet.thumbnails.default.url} className="w-14 h-14 rounded-xl object-cover" alt="thumb" />
                <div className="flex-1" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                  <p className="font-bold text-sm truncate">{v.snippet.title}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">{v.snippet.channelTitle}</p>
                </div>
                <button onClick={() => toggleLike(v)} className="p-2 bg-white/5 rounded-full"><X size={16} className="text-slate-400"/></button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'search' && (
           <div className="space-y-3">
            {results.map(v => (
              <div key={v.id.videoId} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition shadow-lg cursor-pointer" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                 <img src={v.snippet.thumbnails.default.url} className="w-16 h-16 rounded-xl object-cover" alt="thumb" />
                 <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{v.snippet.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{v.snippet.channelTitle}</p>
                 </div>
                 <div className="bg-blue-500/10 p-2 rounded-full text-blue-500"><Play size={16} fill="currentColor" /></div>
              </div>
            ))}
           </div>
        )}
      </main>

      {/* Floating Modern Player */}
      {currentVideo && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <div className="glass p-4 rounded-[2.5rem] flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/20 animate-in slide-in-from-bottom-10">
            <div className="w-12 h-12 relative flex-shrink-0">
               <img 
                 src={currentVideo.snippet.thumbnails.default.url} 
                 className={`w-full h-full rounded-full object-cover border-2 border-blue-500/50 p-0.5 ${isPlaying ? 'animate-spin-slow' : ''}`} 
                 alt="disk"
               />
               <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse -z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px] truncate">{currentVideo.snippet.title}</p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">LIVE AUDIO</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition active:scale-95 shadow-xl">
                {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-0.5" />}
                </button>
                <button onClick={() => setCurrentVideo(null)} className="p-2 text-slate-500 opacity-50 hover:opacity-100"><X size={18} /></button>
            </div>
          </div>
          <div className="hidden">
            <ReactPlayer 
              url={`https://www.youtube.com/watch?v=${currentVideo.id.videoId}`}
              playing={isPlaying}
              onEnded={() => setIsPlaying(false)}
              config={{ youtube: { playerVars: { autoplay: 1 } } }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
